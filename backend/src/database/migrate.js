const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigrations() {
  console.log('[Migration] Starting database migration...');
  const client = await pool.connect();
  try {
    let migrationFile = path.resolve(__dirname, '../../../database/migrations/001_initial_schema.sql');
    if (!fs.existsSync(migrationFile)) {
      migrationFile = path.resolve(__dirname, 'migrations/001_initial_schema.sql');
    }
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found at: ${migrationFile}`);
    }
    const sql = fs.readFileSync(migrationFile, 'utf8');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[Migration] Schema migration applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Migration Error] Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
