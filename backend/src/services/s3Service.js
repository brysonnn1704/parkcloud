const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const PDFDocument = require('pdfkit');
const { pool } = require('../config/db');
const { formatINRFromPaise, formatISTDateTime } = require('../utils/indiaLocale');

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const S3_BUCKET = process.env.S3_BUCKET_NAME || '';

const s3Client = new S3Client({
  region: AWS_REGION,
});

// Local fallback storage folder for dev
const LOCAL_STORAGE_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

/**
 * Upload a buffer or stream to S3 or local development fallback
 */
async function uploadFile({ buffer, originalName, mimeType, fileType, userId, lotId }) {
  // Generate safe random object key
  const timestamp = Date.now();
  const safeExt = path.extname(originalName) || (fileType === 'REPORT_PDF' ? '.pdf' : '.csv');
  const safeName = path.basename(originalName, safeExt).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileKey = `${fileType.toLowerCase()}s/${timestamp}-${safeName}${safeExt}`;

  let storedBucket = S3_BUCKET || 'local-dev-bucket';

  if (S3_BUCKET) {
    // S3 Cloud Upload
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    });
    await s3Client.send(command);
  } else {
    // Local dev write
    const localFilePath = path.join(LOCAL_STORAGE_DIR, path.basename(fileKey));
    fs.writeFileSync(localFilePath, buffer);
  }

  // Record metadata in database
  const res = await pool.query(`
    INSERT INTO stored_files (
      user_id, lot_id, file_name, file_key, s3_bucket, mime_type, file_size_bytes, file_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `, [
    userId, lotId || null, originalName, fileKey, storedBucket, mimeType, buffer.length, fileType
  ]);

  return res.rows[0];
}

/**
 * Generate secure presigned download URL (15-minute expiry)
 */
async function getDownloadUrl(fileId) {
  const res = await pool.query(`SELECT * FROM stored_files WHERE id = $1;`, [fileId]);
  if (res.rows.length === 0) {
    throw { statusCode: 404, message: 'File record not found.' };
  }
  const file = res.rows[0];

  if (file.s3_bucket && file.s3_bucket !== 'local-dev-bucket') {
    const command = new GetObjectCommand({
      Bucket: file.s3_bucket,
      Key: file.file_key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 mins
    return { url, file, isPresignedS3: true };
  } else {
    // Local download endpoint
    return {
      url: `/api/files/download-local/${file.id}`,
      file,
      isPresignedS3: false,
    };
  }
}

/**
 * Generate PDF Parking Utilization Report directly from database records
 */
async function generatePdfReport(userId, lotId = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const lotFilter = lotId ? 'AND b.lot_id = $1' : '';
      const params = lotId ? [lotId] : [];

      const bookingsRes = await pool.query(`
        SELECT 
          b.booking_reference,
          l.name as lot_name,
          s.slot_number,
          v.registration_number,
          v.vehicle_type,
          b.start_time,
          b.end_time,
          b.status,
          b.estimated_fee_paise
        FROM bookings b
        JOIN parking_lots l ON b.lot_id = l.id
        JOIN parking_slots s ON b.slot_id = s.id
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE 1=1 ${lotFilter}
        ORDER BY b.start_time DESC
        LIMIT 50;
      `, params);

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);
        try {
          const storedFile = await uploadFile({
            buffer: pdfData,
            originalName: `ParkCloud_Report_${Date.now()}.pdf`,
            mimeType: 'application/pdf',
            fileType: 'REPORT_PDF',
            userId,
            lotId,
          });
          resolve(storedFile);
        } catch (err) {
          reject(err);
        }
      });

      // Header
      doc.fontSize(22).fillColor('#1E3A8A').text('ParkCloud India - Utilization Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#4B5563').text(`Generated at: ${formatISTDateTime(new Date())} IST`, { align: 'center' });
      doc.text('Compliance: India DPDP Act 2023 - Confidential Internal Audit Document', { align: 'center' });
      doc.moveDown(1.5);

      // Summary Table Header
      doc.fontSize(13).fillColor('#111827').text('Recent Bookings & Utilization Summary:');
      doc.moveDown(0.5);

      // Rows
      doc.fontSize(9).fillColor('#374151');
      bookingsRes.rows.forEach((b, idx) => {
        const line = `${idx + 1}. [${b.booking_reference}] ${b.lot_name} (Slot: ${b.slot_number}) | Plate: ${b.registration_number} (${b.vehicle_type}) | Status: ${b.status} | Fee: ${formatINRFromPaise(b.estimated_fee_paise)}`;
        doc.text(line);
      });

      doc.moveDown(1);
      doc.fontSize(10).fillColor('#6B7280').text('--- End of Official ParkCloud AWS S3 Stored Report ---', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate CSV Report
 */
async function generateCsvReport(userId, lotId = null) {
  const lotFilter = lotId ? 'AND b.lot_id = $1' : '';
  const params = lotId ? [lotId] : [];

  const bookingsRes = await pool.query(`
    SELECT 
      b.booking_reference,
      l.name as lot_name,
      s.slot_number,
      v.registration_number,
      v.vehicle_type,
      b.start_time,
      b.end_time,
      b.status,
      b.estimated_fee_paise
    FROM bookings b
    JOIN parking_lots l ON b.lot_id = l.id
    JOIN parking_slots s ON b.slot_id = s.id
    JOIN vehicles v ON b.vehicle_id = v.id
    WHERE 1=1 ${lotFilter}
    ORDER BY b.start_time DESC;
  `, params);

  let csvContent = 'Booking Reference,Lot Name,Slot Number,Vehicle Plate,Vehicle Type,Start Time (IST),End Time (IST),Status,Fee (INR)\n';
  bookingsRes.rows.forEach(b => {
    const feeINR = ((b.estimated_fee_paise || 0) / 100).toFixed(2);
    csvContent += `"${b.booking_reference}","${b.lot_name}","${b.slot_number}","${b.registration_number}","${b.vehicle_type}","${formatISTDateTime(b.start_time)}","${formatISTDateTime(b.end_time)}","${b.status}",${feeINR}\n`;
  });

  const buffer = Buffer.from(csvContent, 'utf8');
  return uploadFile({
    buffer,
    originalName: `ParkCloud_Bookings_${Date.now()}.csv`,
    mimeType: 'text/csv',
    fileType: 'REPORT_CSV',
    userId,
    lotId,
  });
}

module.exports = {
  uploadFile,
  getDownloadUrl,
  generatePdfReport,
  generateCsvReport,
  LOCAL_STORAGE_DIR,
};
