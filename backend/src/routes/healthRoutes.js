const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// Lightweight liveness check for ALB target group
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'parkcloud-backend',
    region: process.env.AWS_REGION || 'ap-south-1',
  });
});

// Deep readiness check verifying DB connection
router.get('/ready', async (req, res) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1;');
    const latencyMs = Date.now() - start;

    res.status(200).json({
      status: 'ready',
      database: 'connected',
      dbLatencyMs: latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
});

module.exports = router;
