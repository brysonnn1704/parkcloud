require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    // Test DB connection before listening
    const dbTest = await pool.query('SELECT current_database(), version();');
    console.log(`[Database Connected] DB: ${dbTest.rows[0].current_database}`);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`  ParkCloud REST API Server Running on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Region: ${process.env.AWS_REGION || 'ap-south-1'}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[Shutdown] Received ${signal}. Closing HTTP server gracefully...`);
      server.close(async () => {
        console.log('[Shutdown] HTTP server closed.');
        try {
          await pool.end();
          console.log('[Shutdown] Database connection pool ended.');
          process.exit(0);
        } catch (err) {
          console.error('[Shutdown Error] Failed to close database pool:', err.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    console.error('[Startup Error] Failed to initialize server:', err.message);
    process.exit(1);
  }
}

startServer();
