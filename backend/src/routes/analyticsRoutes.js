const express = require('express');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

// Summary metrics (occupancy, active bookings, accrued demo fees)
router.get('/summary', async (req, res, next) => {
  try {
    const { lotId } = req.query;
    const summary = await analyticsService.getAnalyticsSummary(lotId || null);
    res.json({ success: true, ...summary });
  } catch (err) {
    next(err);
  }
});

// Peak hours aggregation in IST
router.get('/peak-hours', async (req, res, next) => {
  try {
    const { lotId } = req.query;
    const peakHours = await analyticsService.getPeakHoursIST(lotId || null);
    res.json({ success: true, peakHours });
  } catch (err) {
    next(err);
  }
});

// Utilization heatmap (day-of-week x hour-of-day in IST)
router.get('/heatmap', async (req, res, next) => {
  try {
    const { lotId } = req.query;
    const heatmap = await analyticsService.getUtilizationHeatmap(lotId || null);
    res.json({ success: true, heatmap });
  } catch (err) {
    next(err);
  }
});

// Statistical occupancy forecast
router.get('/forecast', async (req, res, next) => {
  try {
    const { lotId } = req.query;
    const forecast = await analyticsService.getOccupancyForecast(lotId || null);
    res.json({ success: true, ...forecast });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
