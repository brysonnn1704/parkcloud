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
  RefreshCw 
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
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <span className="badge badge-blue" style={{ marginBottom: '8px' }}>User Portal</span>
          <h1 style={{ fontSize: '26px', fontWeight: '800' }}>
            Namaste, {user?.fullName || 'Driver'}!
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Registered Mobile: {user?.phone} • Verified Profile
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setView('lots')} className="btn btn-primary">
            <Plus size={16} /> Book Parking Bay
          </button>
          <button onClick={() => setView('vehicles')} className="btn btn-secondary">
            <Car size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Active Booking Highlight Card (if any) */}
      {activeBooking ? (
        <div className="glass-card" style={{ marginBottom: '28px', border: '1px solid var(--accent-success)' }}>
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
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{activeBooking.lot_name}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                {activeBooking.lot_address}, {activeBooking.lot_city}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assigned Bay</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-primary)' }}>
                Slot {activeBooking.slot_number}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '10px',
            padding: '14px',
            margin: '18px 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            fontSize: '13px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Vehicle</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{activeBooking.registration_number}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Start Time (IST)</span>
              <span>{activeBooking.startTimeIST}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Estimated Fee</span>
              <strong style={{ color: 'var(--accent-success)' }}>{activeBooking.feeFormatted}</strong>
            </div>
          </div>

          <button onClick={() => setView('bookings')} className="btn btn-secondary btn-sm">
            <QrCode size={15} /> Show Entry Pass QR Code <ArrowRight size={14} />
          </button>
        </div>
      ) : null}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Registered Vehicles</span>
          <div style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0', color: 'var(--accent-primary)' }}>
            {vehicles.length}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ready for instant booking</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Trips Completed</span>
          <div style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0', color: 'var(--accent-success)' }}>
            {myBookings.filter(b => b.status === 'COMPLETED').length}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Zero booking overlap record</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>City Hubs Available</span>
          <div style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0', color: 'var(--accent-purple)' }}>
            {summary?.lots?.length || 5}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Mumbai, Pune, Thane, Bengaluru</span>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Recent Reservations</h3>
          <button onClick={() => setView('bookings')} className="btn btn-secondary btn-sm">
            View All Bookings <ArrowRight size={13} />
          </button>
        </div>

        {myBookings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            No parking bookings recorded yet.
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
                  padding: '12px 14px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              >
                <div>
                  <strong>{b.lot_name}</strong> (Slot {b.slot_number})
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>
                    {b.startTimeIST} • {b.registration_number}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <strong style={{ color: 'var(--accent-success)' }}>{b.feeFormatted}</strong>
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
