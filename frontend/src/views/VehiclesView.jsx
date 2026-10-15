import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { validatePlate } from '../utils/formatters';
import { Car, Plus, Trash2, AlertCircle, CheckCircle, RefreshCw, Sparkles, Shield, Bike, Zap } from 'lucide-react';

export const VehiclesView = () => {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('FOUR_WHEELER');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal State
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getVehicles();
      if (res.success) {
        setVehicles(res.vehicles);
      }
    } catch (err) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const isPlateValid = regNumber.trim().length === 0 || validatePlate(regNumber);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePlate(regNumber)) {
      setError('Please enter a valid Indian registration plate format (e.g. MH02AB1234 or 22BH1234AA).');
      toast.warning('Invalid Indian registration plate format.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createVehicle({
        registrationNumber: regNumber.replace(/\s+/g, ''),
        vehicleType,
        nickname: nickname || undefined,
      });

      if (res.success) {
        toast.success(`Vehicle ${res.vehicle.registration_number} registered successfully!`);
        setRegNumber('');
        setNickname('');
        setShowAddForm(false);
        fetchVehicles();
      }
    } catch (err) {
      setError(err.message || 'Failed to register vehicle.');
      toast.error(err.message || 'Failed to register vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingVehicle) return;
    setDeletingId(deletingVehicle.id);
    try {
      await api.deleteVehicle(deletingVehicle.id);
      toast.success(`Vehicle ${deletingVehicle.registration_number} removed.`);
      setDeletingVehicle(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.message || 'Failed to remove vehicle');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '940px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>Registered Vehicles</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage two-wheelers, cars, and EVs with normalized Indian High Security Registration Plates (HSRP)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> {showAddForm ? 'Close Form' : 'Register New Vehicle'}
          </button>
          <button onClick={fetchVehicles} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Add Vehicle Form Modal/Panel */}
      {showAddForm && (
        <div className="glass-card" style={{ marginBottom: '28px', border: '1px solid var(--accent-primary)', padding: '28px 24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>Register Indian Vehicle</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Supports all standard state series (e.g. MH 02 AB 1234) and nationwide Bharat (BH) series (e.g. 22 BH 1234 AA).
          </p>

          <form onSubmit={handleAddVehicle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input
                  type="text"
                  required
                  className={`form-input ${!isPlateValid ? 'input-invalid' : ''}`}
                  placeholder="MH02AB1234 or 22BH1234AA"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', fontWeight: '700' }}
                />
                <span style={{ fontSize: '11px', color: isPlateValid ? 'var(--text-muted)' : 'var(--accent-danger)', marginTop: '4px', display: 'block' }}>
                  {isPlateValid ? 'Standard State Code or Bharat Series' : 'Invalid plate format (e.g. DL01AB1234 or 22BH1234AA)'}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  className="form-select"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="FOUR_WHEELER">Four-Wheeler (Car / SUV)</option>
                  <option value="TWO_WHEELER">Two-Wheeler (Motorcycle / Scooter)</option>
                  <option value="EV">EV (Electric Vehicle)</option>
                  <option value="THREE_WHEELER">Three-Wheeler (Auto-Rickshaw)</option>
                  <option value="COMMERCIAL">Commercial / Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Nickname (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Blue Nexon EV or Daily Activa"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Validating & Saving...' : 'Save Vehicle'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Fetching registered vehicles from Amazon RDS...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Car size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>No vehicles registered yet</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Add your vehicle plate to start booking parking bays instantly.
          </p>
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            Register Vehicle Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {vehicles.map(v => (
            <div key={v.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className={`badge ${
                    v.vehicle_type === 'EV' ? 'badge-purple' :
                    v.vehicle_type === 'TWO_WHEELER' ? 'badge-amber' : 'badge-blue'
                  }`}>
                    {v.vehicle_type === 'EV' && <Zap size={12} style={{ display: 'inline', marginRight: '3px' }} />}
                    {v.vehicle_type === 'TWO_WHEELER' && <Bike size={12} style={{ display: 'inline', marginRight: '3px' }} />}
                    {v.vehicle_type.replace('_', ' ')}
                  </span>

                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {v.nickname || 'Primary Vehicle'}
                  </span>
                </div>

                {/* Indian High Security Registration Plate (HSRP) Graphic */}
                <div className="hsrp-plate" style={{ margin: '14px 0 16px 0' }}>
                  <div className="hsrp-blue-band">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid #1D4ED8', margin: '0 auto 2px auto' }} />
                    <span className="hsrp-ind">IND</span>
                  </div>
                  <div className="hsrp-number">
                    {v.registration_number.replace(/^([A-Z]{2})(\d{2})([A-Z]+)(\d{4})$/, '$1 $2 $3 $4')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Registered {new Date(v.created_at).toLocaleDateString('en-IN')}
                </span>

                <button
                  onClick={() => setDeletingVehicle(v)}
                  className="btn btn-secondary btn-sm"
                  title="Remove vehicle"
                  style={{ color: 'var(--accent-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={15} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingVehicle}
        title="Remove Registered Vehicle"
        message={`Are you sure you want to remove vehicle ${deletingVehicle?.registration_number} (${deletingVehicle?.nickname || deletingVehicle?.vehicle_type})? Active bookings tied to this vehicle will remain unaffected.`}
        confirmLabel={deletingId ? 'Removing...' : 'Remove Vehicle'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingVehicle(null)}
      />
    </div>
  );
};
