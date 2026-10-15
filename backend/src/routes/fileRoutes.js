const express = require('express');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const s3Service = require('../services/s3Service');

const router = express.Router();

// Generate PDF or CSV Report (Admin or User)
router.post('/generate-report', authenticateToken, async (req, res, next) => {
  try {
    const { format = 'PDF', lotId } = req.body;

    let storedFile;
    if (format.toUpperCase() === 'CSV') {
      storedFile = await s3Service.generateCsvReport(req.user.id, lotId || null);
    } else {
      storedFile = await s3Service.generatePdfReport(req.user.id, lotId || null);
    }

    res.status(201).json({
      success: true,
      message: `${format.toUpperCase()} report generated and stored successfully.`,
      file: storedFile,
    });
  } catch (err) {
    next(err);
  }
});

// List files
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { lotId, fileType } = req.query;
    let query = `
      SELECT f.*, l.name as lot_name, u.full_name as uploader_name
      FROM stored_files f
      LEFT JOIN parking_lots l ON f.lot_id = l.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (lotId) {
      if (!uuidRegex.test(lotId)) {
        return res.status(400).json({ success: false, error: 'Invalid lotId parameter format. Expected UUID.' });
      }
      params.push(lotId);
      query += ` AND f.lot_id = $${params.length}`;
    }
    if (fileType) {
      params.push(fileType);
      query += ` AND f.file_type = $${params.length}`;
    }

    query += ' ORDER BY f.created_at DESC LIMIT 50;';
    const result = await pool.query(query, params);

    res.json({ success: true, files: result.rows });
  } catch (err) {
    next(err);
  }
});

// Get Presigned S3 or local download URL
router.get('/:id/download-url', authenticateToken, async (req, res, next) => {
  try {
    const { url, file, isPresignedS3 } = await s3Service.getDownloadUrl(req.params.id);
    res.json({ success: true, downloadUrl: url, file, isPresignedS3 });
  } catch (err) {
    next(err);
  }
});

// Local dev fallback download handler
router.get('/download-local/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM stored_files WHERE id = $1;', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).send('File not found');
    }
    const file = result.rows[0];
    const localPath = path.join(s3Service.LOCAL_STORAGE_DIR, path.basename(file.file_key));
    if (!fs.existsSync(localPath)) {
      return res.status(404).send('File missing on disk');
    }
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    fs.createReadStream(localPath).pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
