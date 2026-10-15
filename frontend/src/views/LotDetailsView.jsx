import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatINR, formatIST } from '../utils/formatters';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Calendar, 
  Car, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  QrCode,
  ShieldCheck,
  Bike
} from 'lucide-react';

export const LotDetailsView = ({ lot, setView, onBookingComplete }) => {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  // Availability inputs (default: starting in 15 mins for 2 hours)
  const [startTime, setStartTime] = useState(() => {
    const d = new Date(Date.now() + 15 * 60 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date(Date.now() + 135 * 60 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [vehicleType, setVehicleType] = useState('FOUR_WHEELER');

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Fetch slot availability
  const checkAvailability = async () => {
    if (!lot) return;
    setLoading(true);
    setError('');
    try {
      const startISO = new Date(startTime).toISOString();
      const endISO = new Date(endTime).toISOString();
      const res = await api.getLotAvailability(lot.id, startISO, endISO, vehicleType);
      if (res.success) {
        setSlots(res.slots);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch slot availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAvailability();
  }, [lot, startTime, endTime, vehicleType]);

  // Fetch user vehicles when modal opens
  useEffect(() => {
    if (isAuthenticated) {
      api.getVehicles()
        .then(res => {
          if (res.success && res.vehicles.length > 0) {
            setVehicles(res.vehicles);
            setSelectedVehicleId(res.vehicles[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSelectSlot = (slot) => {
    if (!slot.is_available) return;
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      setView('login');
      return;
    }
    if (!selectedVehicleId) {
      setBookingError('Please select or register a vehicle to proceed.');
      return;
    }

    setBookingSubmitting(true);
    setBookingError('');
    try {
      const res = await api.createBooking({
        lotId: lot.id,
        slotId: selectedSlot.id,
        vehicleId: selectedVehicleId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });

      if (res.success) {
        toast.success(`Booking Confirmed! Slot ${selectedSlot.slot_number} reserved at ${lot.name}.`);
        setShowBookingModal(false);
        if (onBookingComplete) {
          onBookingComplete(res.booking);
        }
        setView('bookings');
      }
    } catch (err) {
      setBookingError(err.message || 'Failed to confirm booking.');
      toast.error(err.message || 'Booking conflict or validation error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (!lot) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>No parking lot selected.</p>
        <button onClick={() => setView('lots')} className="btn btn-primary" style={{ marginTop: '12px' }}>
          Back to Lots
        </button>
      </div>
    );
  }

  // Calculate estimated fee for modal
  const durationHours = Math.max(1, Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / (3600 * 1000)));
  let hourlyRatePaise = lot.rate_four_wheeler_paise || 5000;
  if (vehicleType === 'TWO_WHEELER') hourlyRatePaise = lot.rate_two_wheeler_paise || 2000;
  if (vehicleType === 'EV') hourlyRatePaise = lot.rate_ev_paise || 4000;
  const basePaise = hourlyRatePaise * durationHours;
  const gstPaise = Math.round(basePaise * 0.18);
  const totalPaise = basePaise + gstPaise;

  const availableCount = slots.filter(s => s.is_available).length;

  return (
    <div>
      {/* Top Header */}
      <button onClick={() => setView('lots')} className="btn btn-secondary btn-sm" style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={15} /> Back to Locations
      </button>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-blue">{lot.city}</span>
              <span className="badge badge-green">Operational</span>
              <span className="badge badge-purple">{availableCount} / {slots.length} Bays Free</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>{lot.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
              {lot.address} • PIN {lot.pincode}
            </p>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '14px 20px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700' }}>Operating Hours (IST)</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '2px' }}>
              {lot.operating_start_hour}:00 to {lot.operating_end_hour}:00 IST
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Asia/Kolkata Guaranteed</div>
          </div>
        </div>
      </div>

      {/* Real-time Time Interval Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--accent-primary)" /> Check Slot Availability for Time Window (IST)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Start Date & Time (IST)</label>
            <input
              type="datetime-local"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">End Date & Time (IST)</label>
            <input
              type="datetime-local"
              className="form-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Vehicle Type</label>
            <select
              className="form-select"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value="FOUR_WHEELER">Four-Wheeler (Car / SUV)</option>
              <option value="TWO_WHEELER">Two-Wheeler (Bike / Scooter)</option>
              <option value="EV">EV (Electric Vehicle)</option>
              <option value="THREE_WHEELER">Three-Wheeler (Auto)</option>
              <option value="COMMERCIAL">Commercial / Other</option>
            </select>
          </div>

          <button onClick={checkAvailability} className="btn btn-secondary" style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <RefreshCw size={15} /> Check Availability
          </button>
        </div>
      </div>

      {/* Visual Slot Grid Map */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: '800' }}>Live Slot Layout Map</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Click any green slot to reserve for your selected time window.
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--accent-success)' }}></div>
              <span>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--accent-danger)' }}></div>
              <span>Occupied</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--accent-purple)' }}></div>
              <span>EV Fast Bay</span>
            </div>
          </div>
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
            <p style={{ marginTop: '10px' }}>Evaluating PostgreSQL btree_gist temporal locks...</p>
          </div>
        ) : slots.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>No slots registered for this lot.</p>
        ) : (
          <div className="slot-grid">
            {slots.map(slot => {
              const isAvail = slot.is_available;
              const isEV = slot.category === 'EV_CHARGING';
              const isBike = slot.category === 'TWO_WHEELER';

              return (
                <div
                  key={slot.id}
                  onClick={() => handleSelectSlot(slot)}
                  className={`slot-box ${isAvail ? 'available' : 'occupied'}`}
                  title={isAvail ? `Click to book slot ${slot.slot_number}` : `Slot ${slot.slot_number} is already booked for this interval`}
                  style={{
                    position: 'relative',
                    cursor: isAvail ? 'pointer' : 'not-allowed',
                    border: isEV && isAvail ? '1px solid var(--accent-purple)' : undefined
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {slot.category.replace('_', ' ')}
                    </span>
                    {isEV && <Zap size={13} color="var(--accent-purple)" />}
                  </div>

                  <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: isAvail ? 'var(--text-primary)' : 'var(--accent-danger)' }}>
                    {slot.slot_number}
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    {isAvail ? (
                      <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 8px' }}>Available</span>
                    ) : (
                      <span className="badge badge-red" style={{ fontSize: '10px', padding: '2px 8px' }}>Booked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && selectedSlot && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.02em' }}>
              Confirm Parking Reservation
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {lot.name} • Bay <strong style={{ color: 'var(--accent-primary)' }}>{selectedSlot.slot_number}</strong>
            </p>

            {bookingError && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{bookingError}</span>
              </div>
            )}

            {!isAuthenticated ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                  You need to be signed in to confirm a booking.
                </p>
                <button onClick={() => setView('login')} className="btn btn-primary" style={{ width: '100%' }}>
                  Sign In to Continue
                </button>
              </div>
            ) : (
              <div>
                {/* Vehicle Selector */}
                <div className="form-group">
                  <label className="form-label">Select Registered Vehicle</label>
                  {vehicles.length === 0 ? (
                    <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: '13px', color: 'var(--accent-warning)', marginBottom: '8px' }}>
                        No vehicles registered in your account yet.
                      </p>
                      <button onClick={() => setView('vehicles')} className="btn btn-secondary btn-sm">
                        Register a Vehicle
                      </button>
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registration_number} — {v.nickname || v.vehicle_type}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Timing Summary */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '18px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Start Time (IST):</span>
                    <strong>{formatIST(startTime)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>End Time (IST):</span>
                    <strong>{formatIST(endTime)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                    <strong>{durationHours} Hour(s)</strong>
                  </div>
                </div>

                {/* Fee Breakdown (in ₹) */}
                <div style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '20px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Base Parking Fee ({durationHours} hrs):</span>
                    <span>{formatINR(basePaise)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Demo 18% GST:</span>
                    <span>{formatINR(gstPaise)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '15px', fontWeight: '800' }}>
                    <span>Estimated Accrued Fee:</span>
                    <span style={{ color: 'var(--accent-primary)' }}>{formatINR(totalPaise)}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                    * Labeled as estimated/accrued demo fee. No actual money collected.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={bookingSubmitting || vehicles.length === 0}
                    onClick={handleConfirmBooking}
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                  >
                    {bookingSubmitting ? 'Securing Slot in RDS...' : 'Confirm & Generate Pass'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
