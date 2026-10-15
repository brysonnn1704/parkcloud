import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { 
  CalendarCheck, 
  Clock, 
  MapPin, 
  QrCode, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Download,
  Car,
  CheckCircle,
  Copy,
  Printer
} from 'lucide-react';

export const MyBookingsView = ({ setView }) => {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [selectedPass, setSelectedPass] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getMyBookings();
      if (res.success) {
        setBookings(res.bookings);
      }
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    const bookingId = cancellingBooking.id;
    setCancellingId(bookingId);
    try {
      await api.cancelBooking(bookingId, 'Cancelled from user dashboard');
      toast.success(`Booking ${cancellingBooking.booking_reference} cancelled successfully. Slot released.`);
      setCancellingBooking(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCopyRef = (ref) => {
    navigator.clipboard.writeText(ref);
    toast.info(`Copied reference ${ref} to clipboard.`);
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ACTIVE') return b.status === 'ACTIVE' || b.status === 'CONFIRMED';
    if (activeTab === 'PAST') return b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'EXPIRED';
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>My Parking Reservations</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            View active QR passes, manage upcoming slots, and review booking history
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setView('lots')} className="btn btn-primary btn-sm">
            Book New Slot
          </button>
          <button onClick={fetchBookings} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`btn btn-sm ${activeTab === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '20px', padding: '6px 16px' }}
        >
          Active & Upcoming ({bookings.filter(b => b.status === 'ACTIVE' || b.status === 'CONFIRMED').length})
        </button>
        <button
          onClick={() => setActiveTab('PAST')}
          className={`btn btn-sm ${activeTab === 'PAST' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '20px', padding: '6px 16px' }}
        >
          Past & Cancelled ({bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'EXPIRED').length})
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Querying Amazon RDS for reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <CalendarCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>No reservations found</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            You do not have any {activeTab === 'ACTIVE' ? 'active or upcoming' : 'past'} bookings.
          </p>
          <button onClick={() => setView('lots')} className="btn btn-primary">
            Find and Book a Slot
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px' }}>
          {filteredBookings.map(b => (
            <div key={b.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className={`badge ${
                    b.status === 'ACTIVE' ? 'badge-green' :
                    b.status === 'CONFIRMED' ? 'badge-blue' :
                    b.status === 'COMPLETED' ? 'badge-purple' : 'badge-amber'
                  }`}>
                    {b.status}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {b.booking_reference}
                    </span>
                    <button
                      onClick={() => handleCopyRef(b.booking_reference)}
                      className="btn-icon"
                      title="Copy Reference"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '19px', fontWeight: '800', marginBottom: '4px' }}>{b.lot_name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  <MapPin size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                  {b.lot_address}, {b.lot_city}
                </p>

                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Bay Number:</span>
                    <strong style={{ color: 'var(--accent-primary)', fontSize: '15px' }}>Slot {b.slot_number}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Vehicle Plate:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{b.registration_number}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Timings (IST):</span>
                    <span>{b.startTimeIST}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Accrued Fee:</span>
                    <strong style={{ color: 'var(--accent-success)' }}>{b.feeFormatted}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setSelectedPass(b)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <QrCode size={14} /> View Pass QR
                </button>

                {b.status === 'CONFIRMED' && (
                  <button
                    disabled={cancellingId === b.id}
                    onClick={() => setCancellingBooking(b)}
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <XCircle size={14} /> Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Digital Pass Modal */}
      {selectedPass && (
        <div className="modal-overlay" onClick={() => setSelectedPass(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
              color: 'var(--accent-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <QrCode size={24} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>Smart Parking Pass</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Scan at automated barrier or present to gate operator
            </p>

            {/* Generated QR Code Container */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '18px',
              display: 'inline-block',
              marginBottom: '20px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  JSON.stringify({
                    ref: selectedPass.booking_reference,
                    lot: selectedPass.lot_name,
                    slot: selectedPass.slot_number,
                    plate: selectedPass.registration_number,
                  })
                )}`}
                alt="Parking QR Pass"
                style={{ width: '190px', height: '190px', display: 'block' }}
              />
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              padding: '14px',
              textAlign: 'left',
              fontSize: '13px',
              marginBottom: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reference:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedPass.booking_reference}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                <span>{selectedPass.lot_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Slot Bay:</span>
                <strong style={{ color: 'var(--accent-primary)' }}>Slot {selectedPass.slot_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedPass.registration_number}</strong>
              </div>
            </div>

            <button onClick={() => setSelectedPass(null)} className="btn btn-secondary" style={{ width: '100%' }}>
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* Sleek Confirm Cancellation Modal */}
      <ConfirmModal
        isOpen={!!cancellingBooking}
        title="Cancel Parking Reservation"
        message={`Are you sure you want to cancel booking ${cancellingBooking?.booking_reference} at ${cancellingBooking?.lot_name}? Free cancellation is permitted up to 30 minutes before your scheduled slot.`}
        confirmLabel={cancellingId ? 'Cancelling...' : 'Confirm Cancellation'}
        cancelLabel="Keep Reservation"
        variant="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancellingBooking(null)}
      />
    </div>
  );
};
