import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  MapPin, 
  ShieldAlert, 
  Zap,
  Calendar
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AnalyticsView = () => {
  const [summary, setSummary] = useState(null);
  const [peakHours, setPeakHours] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, peakRes, heatRes, foreRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getPeakHours(),
        api.getHeatmap(),
        api.getForecast(),
      ]);

      if (sumRes.success) setSummary(sumRes);
      if (peakRes.success) setPeakHours(peakRes.peakHours);
      if (heatRes.success) setHeatmap(heatRes.heatmap);
      if (foreRes.success) setForecast(foreRes);
    } catch (err) {
      setError(err.message || 'Failed to load real-time analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Peak Hours Chart Data
  const peakChartData = {
    labels: peakHours.map(p => `${p.hour}:00`),
    datasets: [
      {
        label: 'Bookings Volume (IST)',
        data: peakHours.map(p => p.count),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3B82F6',
        borderRadius: 4,
      },
    ],
  };

  const peakChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Bookings: ${ctx.parsed.y} sessions`,
        },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
      y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
    },
  };

  // Forecast Chart Data
  const forecastChartData = {
    labels: forecast?.forecast?.map(f => f.label) || [],
    datasets: [
      {
        label: 'Projected Occupancy (%)',
        data: forecast?.forecast?.map(f => f.projectedOccupancyPercent) || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  const forecastOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Projected: ${ctx.parsed.y}% Occupancy`,
        },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
      y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800' }}>Operational & Utilization Analytics</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Real-time metrics computed directly from PostgreSQL database in Asia/Kolkata (IST) timezone
          </p>
        </div>

        <button onClick={fetchAnalytics} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh Analytics
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Executing analytical aggregations in Amazon RDS...</p>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-card">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>System Occupancy Rate</span>
              <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--accent-primary)', margin: '4px 0' }}>
                {summary?.occupancyRate || 0}%
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {summary?.occupiedSlots || 0} / {summary?.totalSlots || 0} active bays occupied
              </span>
            </div>

            <div className="glass-card">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Booking Volume</span>
              <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--accent-success)', margin: '4px 0' }}>
                {summary?.bookings?.total || 0}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {summary?.bookings?.active || 0} Active • {summary?.bookings?.confirmed || 0} Upcoming
              </span>
            </div>

            <div className="glass-card">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Accrued Demo Parking Fees</span>
              <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--accent-purple)', margin: '4px 0' }}>
                {summary?.accruedFees?.formatted || '₹0.00'}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                * Estimated demo accrual with 18% GST (no actual money)
              </span>
            </div>

            <div className="glass-card">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completion / Cancel Stats</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '8px 0' }}>
                {summary?.bookings?.completed || 0} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Done</span> / {summary?.bookings?.cancelled || 0} <span style={{ fontSize: '14px', color: 'var(--accent-danger)' }}>Cancelled</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Complies with 30-min cancellation window
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* Peak Hours Chart */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="var(--accent-primary)" /> Peak Parking Hours Distribution (IST)
                </h3>
                <span className="badge badge-blue">24-Hour IST</span>
              </div>
              <div style={{ height: '240px' }}>
                <Bar data={peakChartData} options={peakChartOptions} />
              </div>
            </div>

            {/* Occupancy Forecasting */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} color="var(--accent-success)" /> Statistical Occupancy Forecast
                </h3>
                <span className="badge badge-green">Statistical Model</span>
              </div>
              <div style={{ height: '240px' }}>
                <Line data={forecastChartData} options={forecastOptions} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
                {forecast?.disclaimer}
              </span>
            </div>
          </div>

          {/* Heatmap Matrix: Day of Week x Hour of Day */}
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--accent-purple)" /> Utilization Heatmap (Day of Week × Hour in IST)
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Darker purple indicates higher booking density</span>
            </div>

            <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px', textAlign: 'left', color: 'var(--text-muted)' }}>Day</th>
                    {Array.from({ length: 24 }, (_, i) => (
                      <th key={i} style={{ padding: '6px 3px', color: 'var(--text-muted)', minWidth: '24px' }}>
                        {i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map((row) => (
                    <tr key={row.day}>
                      <td style={{ padding: '6px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {row.day}
                      </td>
                      {row.hours.map((h) => {
                        const count = h.count;
                        let bg = 'rgba(255, 255, 255, 0.03)';
                        if (count > 0 && count < 2) bg = 'rgba(139, 92, 246, 0.25)';
                        else if (count >= 2 && count < 4) bg = 'rgba(139, 92, 246, 0.55)';
                        else if (count >= 4) bg = 'rgba(139, 92, 246, 0.85)';

                        return (
                          <td
                            key={h.hour}
                            title={`${row.day} at ${h.hour}:00 IST: ${count} bookings`}
                            style={{
                              background: bg,
                              border: '1px solid var(--border-subtle)',
                              padding: '8px 2px',
                              borderRadius: '2px',
                              color: count > 0 ? '#FFFFFF' : 'var(--text-muted)',
                            }}
                          >
                            {count > 0 ? count : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Metric Formulas Transparency Panel */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px 20px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              <Info size={15} color="var(--accent-primary)" /> Metric Computation Formulas & Standards:
            </div>
            <p style={{ marginBottom: '4px' }}>
              • <strong>Occupancy Rate:</strong> {summary?.metricsFormulaInfo?.occupancyRate}
            </p>
            <p>
              • <strong>Accrued Fees:</strong> {summary?.metricsFormulaInfo?.accruedFees}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
