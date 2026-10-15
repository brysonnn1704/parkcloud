import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  Car, 
  CalendarCheck, 
  MapPin, 
  QrCode, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const UserDashboardView = ({ setView, onSelectLot }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, bkgRes, vehRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getMyBookings(),
        api.getVehicles(),
      ]);

      if (sumRes.success) setSummary(sumRes);
      if (bkgRes.success) setMyBookings(bkgRes.bookings);
      if (vehRes.success) setVehicles(vehRes.vehicles);
    } catch (e) {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const activeBooking = myBookings.find(b => b.status === 'ACTIVE' || b.status === 'CONFIRMED');

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(37, 99, 235, 0.1) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '32px 36px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', marginBottom: '10px' }}>
            <Sparkles size={12} /> Verified Driver Account
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Namaste, {user?.fullName ? user.fullName.split(' ')[0] : 'Driver'}!
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Mobile: {user?.phone || 'Verified'} • Accessing Cloud Cluster ap-south-1 (Mumbai)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setView('lots')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Book Parking Bay
          </button>
          <button onClick={() => setView('vehicles')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Car size={16} /> My Vehicles ({vehicles.length})
          </button>
        </div>
      </div>

      {/* Active Booking Highlight Card (if any) */}
      {activeBooking ? (
        <div className="glass-card" style={{ marginBottom: '28px', border: '1px solid var(--accent-success)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-green">
                  {activeBooking.status === 'ACTIVE' ? 'Currently Parked' : 'Upcoming Pass'}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {activeBooking.booking_reference}
                </span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800' }}>{activeBooking.lot_name}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                <MapPin size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                {activeBooking.lot_address}, {activeBooking.lot_city}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700' }}>Assigned Bay</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                Slot {activeBooking.slot_number}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '10px',
            padding: '14px 18px',
            margin: '18px 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            fontSize: '13px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Vehicle Plate</span>
              <strong style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{activeBooking.registration_number}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Scheduled Start (IST)</span>
              <span>{activeBooking.startTimeIST}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Estimated Fee</span>
              <strong style={{ color: 'var(--accent-success)' }}>{activeBooking.feeFormatted}</strong>
            </div>
          </div>

          <button onClick={() => setView('bookings')} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <QrCode size={15} /> Show Entry Pass QR Code <ArrowRight size={14} />
          </button>
        </div>
      ) : null}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        <div className="glass-card">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Registered Vehicles</span>
          <div style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0', color: 'var(--accent-primary)' }}>
            {vehicles.length}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ready for instant booking</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Bookings Completed</span>
          <div style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0', color: 'var(--accent-success)' }}>
            {myBookings.filter(b => b.status === 'COMPLETED').length}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Zero booking collision record</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>City Hubs Available</span>
          <div style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0', color: 'var(--accent-purple)' }}>
            {summary?.lots?.length || 5}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Mumbai, Pune, Thane, Bengaluru</span>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Recent Reservations</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Your latest smart parking sessions</p>
          </div>
          <button onClick={() => setView('bookings')} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            View All Bookings <ArrowRight size={13} />
          </button>
        </div>

        {myBookings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '30px' }}>
            No parking bookings recorded yet. Select "Book Parking Bay" to reserve your first slot!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myBookings.slice(0, 3).map(b => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <strong style={{ fontSize: '14px' }}>{b.lot_name}</strong> (Slot {b.slot_number})
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', marginTop: '2px' }}>
                    {b.startTimeIST} • <span style={{ fontFamily: 'var(--font-mono)' }}>{b.registration_number}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <strong style={{ color: 'var(--accent-success)', fontSize: '14px' }}>{b.feeFormatted}</strong>
                  <span className={`badge ${
                    b.status === 'ACTIVE' ? 'badge-green' :
                    b.status === 'CONFIRMED' ? 'badge-blue' :
                    b.status === 'COMPLETED' ? 'badge-purple' : 'badge-amber'
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
