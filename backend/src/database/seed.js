const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedDatabase() {
  console.log('[Seed] Seeding database with authentic Indian smart parking demo data...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Clean existing records for idempotent runs
    await client.query('TRUNCATE audit_logs, stored_files, parking_sessions, bookings, parking_slots, parking_lots, vehicles, users CASCADE;');

    // 2. Hash passwords
    const adminPasswordHash = await bcrypt.hash('Admin@ParkCloud2026!', 10);
    const userPasswordHash = await bcrypt.hash('User@ParkCloud2026!', 10);

    // 3. Create Admin & Demo Users
    const adminRes = await client.query(`
      INSERT INTO users (email, password_hash, full_name, phone, role)
      VALUES ($1, $2, $3, $4, 'ADMIN')
      RETURNING id;
    `, ['admin@parkcloud.in', adminPasswordHash, 'ParkCloud Administrator', '+919820011223']);
    const adminId = adminRes.rows[0].id;

    const userRes = await client.query(`
      INSERT INTO users (email, password_hash, full_name, phone, role)
      VALUES ($1, $2, $3, $4, 'USER')
      RETURNING id;
    `, ['rahul.sharma@example.com', userPasswordHash, 'Rahul Sharma', '+919819988776']);
    const userId = userRes.rows[0].id;

    // 4. Create User Vehicles
    const carRes = await client.query(`
      INSERT INTO vehicles (user_id, registration_number, vehicle_type, nickname)
      VALUES ($1, 'MH02DE4567', 'FOUR_WHEELER', 'White Creta')
      RETURNING id;
    `, [userId]);
    const carId = carRes.rows[0].id;

    const bikeRes = await client.query(`
      INSERT INTO vehicles (user_id, registration_number, vehicle_type, nickname)
      VALUES ($1, 'MH04EA8910', 'TWO_WHEELER', 'Activa 6G')
      RETURNING id;
    `, [userId]);
    const bikeId = bikeRes.rows[0].id;

    const evRes = await client.query(`
      INSERT INTO vehicles (user_id, registration_number, vehicle_type, nickname)
      VALUES ($1, '22BH1234AA', 'EV', 'Nexon EV')
      RETURNING id;
    `, [userId]);
    const evId = evRes.rows[0].id;

    // 5. Create 5 Indian Fictional Parking Lots
    const lots = [
      {
        name: 'Phoenix Marketcity Mall Smart Lot',
        address: 'LBS Marg, Kurla West',
        city: 'Mumbai',
        pincode: '400070',
        description: 'Multi-level covered smart parking with high-speed EV chargers and automated boom barriers.',
        start: 7,
        end: 23,
        two: 2000, three: 3000, four: 6000, ev: 5000, comm: 10000,
        slots: [
          { num: 'P1-01', cat: 'STANDARD' },
          { num: 'P1-02', cat: 'STANDARD' },
          { num: 'P1-03', cat: 'ACCESSIBLE' },
          { num: 'P1-04', cat: 'EV_CHARGING' },
          { num: 'P1-05', cat: 'TWO_WHEELER' },
          { num: 'P1-06', cat: 'TWO_WHEELER' },
        ]
      },
      {
        name: 'Vasai Road Railway Station North Lot',
        address: 'Station Road, Navghar, Vasai West',
        city: 'Vasai-Virar',
        pincode: '401202',
        description: 'High-turnover commuter parking adjacent to Platform 1 with 24/7 CCTV surveillance.',
        start: 5,
        end: 23,
        two: 1500, three: 2500, four: 4000, ev: 3500, comm: 7000,
        slots: [
          { num: 'VS-01', cat: 'STANDARD' },
          { num: 'VS-02', cat: 'STANDARD' },
          { num: 'VS-03', cat: 'TWO_WHEELER' },
          { num: 'VS-04', cat: 'TWO_WHEELER' },
          { num: 'VS-05', cat: 'ACCESSIBLE' },
        ]
      },
      {
        name: 'Hinjewadi Phase 1 Tech Park Ground',
        address: 'Rajiv Gandhi Infotech Park, Hinjewadi',
        city: 'Pune',
        pincode: '411057',
        description: 'Corporate smart parking facility with dedicated reserved bays and fast EV charging docks.',
        start: 6,
        end: 22,
        two: 1000, three: 2000, four: 4000, ev: 3500, comm: 8000,
        slots: [
          { num: 'TECH-A1', cat: 'STANDARD' },
          { num: 'TECH-A2', cat: 'STANDARD' },
          { num: 'TECH-E1', cat: 'EV_CHARGING' },
          { num: 'TECH-B1', cat: 'TWO_WHEELER' },
          { num: 'TECH-R1', cat: 'RESERVED' },
        ]
      },
      {
        name: 'Hiranandani Estate Resident & Visitor Hub',
        address: 'Ghodbunder Road, Patlipada',
        city: 'Thane',
        pincode: '400607',
        description: 'Gated community and retail plaza parking with RFID and automatic number plate recognition.',
        start: 6,
        end: 23,
        two: 1500, three: 2500, four: 5000, ev: 4500, comm: 9000,
        slots: [
          { num: 'HE-101', cat: 'STANDARD' },
          { num: 'HE-102', cat: 'STANDARD' },
          { num: 'HE-103', cat: 'EV_CHARGING' },
          { num: 'HE-104', cat: 'TWO_WHEELER' },
          { num: 'HE-105', cat: 'ACCESSIBLE' },
        ]
      },
      {
        name: 'Commercial Street Smart Municipal Lot',
        address: 'Tasker Town, Shivaji Nagar',
        city: 'Bengaluru',
        pincode: '560001',
        description: 'Bustling central shopping district municipal smart lot with live digital signage display.',
        start: 8,
        end: 22,
        two: 2000, three: 3000, four: 5000, ev: 4000, comm: 8000,
        slots: [
          { num: 'CS-01', cat: 'STANDARD' },
          { num: 'CS-02', cat: 'STANDARD' },
          { num: 'CS-03', cat: 'TWO_WHEELER' },
          { num: 'CS-04', cat: 'EV_CHARGING' },
          { num: 'CS-05', cat: 'ACCESSIBLE' },
        ]
      }
    ];

    const createdLots = [];
    for (const lot of lots) {
      const lotRes = await client.query(`
        INSERT INTO parking_lots (
          name, address, city, pincode, description, operating_start_hour, operating_end_hour,
          rate_two_wheeler_paise, rate_three_wheeler_paise, rate_four_wheeler_paise, rate_ev_paise, rate_commercial_paise
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id;
      `, [
        lot.name, lot.address, lot.city, lot.pincode, lot.description,
        lot.start, lot.end, lot.two, lot.three, lot.four, lot.ev, lot.comm
      ]);
      const lId = lotRes.rows[0].id;
      createdLots.push({ id: lId, name: lot.name, slots: [] });

      for (const slot of lot.slots) {
        const slotRes = await client.query(`
          INSERT INTO parking_slots (lot_id, slot_number, category)
          VALUES ($1, $2, $3)
          RETURNING id, slot_number, category;
        `, [lId, slot.num, slot.cat]);
        createdLots[createdLots.length - 1].slots.push(slotRes.rows[0]);
      }
    }

    // 6. Create realistic sample bookings (Past completed, current active, future confirmed)
    const lot1 = createdLots[0];
    const slotP101 = lot1.slots.find(s => s.slot_number === 'P1-01');
    const slotP102 = lot1.slots.find(s => s.slot_number === 'P1-02');
    const slotP104 = lot1.slots.find(s => s.slot_number === 'P1-04');

    const now = new Date();

    // Past completed booking (2 days ago, 2 hours)
    const pastStart = new Date(now.getTime() - 48 * 3600 * 1000);
    const pastEnd = new Date(now.getTime() - 46 * 3600 * 1000);
    const pastBaseFee = 12000; // 2 hrs * 60 = 120
    const pastGst = Math.round(pastBaseFee * 0.18);
    const pastTotal = pastBaseFee + pastGst;

    const b1 = await client.query(`
      INSERT INTO bookings (
        booking_reference, user_id, vehicle_id, lot_id, slot_id,
        start_time, end_time, status, estimated_fee_paise, base_fee_paise, gst_paise, actual_fee_paise
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED', $8, $9, $10, $11)
      RETURNING id;
    `, ['PC-BKG-2601', userId, carId, lot1.id, slotP101.id, pastStart, pastEnd, pastTotal, pastBaseFee, pastGst, pastTotal]);

    // Add session for past booking
    await client.query(`
      INSERT INTO parking_sessions (booking_id, check_in_time, check_out_time, checked_in_by, checked_out_by, notes)
      VALUES ($1, $2, $3, $4, $4, 'Automated gate boom check-in/out');
    `, [b1.rows[0].id, pastStart, pastEnd, adminId]);

    // Active booking right now (Started 30 mins ago, ends in 90 mins)
    const activeStart = new Date(now.getTime() - 30 * 60 * 1000);
    const activeEnd = new Date(now.getTime() + 90 * 60 * 1000);
    const activeBaseFee = 12000;
    const activeGst = Math.round(activeBaseFee * 0.18);
    const activeTotal = activeBaseFee + activeGst;

    const b2 = await client.query(`
      INSERT INTO bookings (
        booking_reference, user_id, vehicle_id, lot_id, slot_id,
        start_time, end_time, status, estimated_fee_paise, base_fee_paise, gst_paise
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8, $9, $10)
      RETURNING id;
    `, ['PC-BKG-2602', userId, carId, lot1.id, slotP102.id, activeStart, activeEnd, activeTotal, activeBaseFee, activeGst]);

    await client.query(`
      INSERT INTO parking_sessions (booking_id, check_in_time, checked_in_by, notes)
      VALUES ($1, $2, $3, 'Checked in with QR pass');
    `, [b2.rows[0].id, activeStart, adminId]);

    // Future confirmed booking (Tomorrow 10:00 AM to 12:00 PM)
    const futureStart = new Date(now.getTime() + 24 * 3600 * 1000);
    const futureEnd = new Date(now.getTime() + 26 * 3600 * 1000);
    const futureBaseFee = 10000; // EV rate
    const futureGst = Math.round(futureBaseFee * 0.18);
    const futureTotal = futureBaseFee + futureGst;

    await client.query(`
      INSERT INTO bookings (
        booking_reference, user_id, vehicle_id, lot_id, slot_id,
        start_time, end_time, status, estimated_fee_paise, base_fee_paise, gst_paise
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'CONFIRMED', $8, $9, $10);
    `, ['PC-BKG-2603', userId, evId, lot1.id, slotP104.id, futureStart, futureEnd, futureTotal, futureBaseFee, futureGst]);

    // 7. Audit log entries
    await client.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES 
      ($1, 'SEED_DATABASE', 'SYSTEM', 'INIT', '{"message": "Initial seed of Indian smart parking lots"}'::jsonb, '127.0.0.1'),
      ($2, 'CREATE_BOOKING', 'BOOKING', 'PC-BKG-2602', '{"lot": "Phoenix Marketcity Mall", "slot": "P1-02"}'::jsonb, '127.0.0.1');
    `, [adminId, userId]);

    await client.query('COMMIT');
    console.log('[Seed] Database successfully seeded with 5 lots, multiple slots, test vehicles, and demo bookings.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed Error] Database seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
