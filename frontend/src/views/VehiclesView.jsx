import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Car, Plus, Trash2, AlertCircle, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';

export const VehiclesView = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('FOUR_WHEELER');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await api.createVehicle({
        registrationNumber: regNumber,
        vehicleType,
        nickname: nickname || undefined,
      });

      if (res.success) {
        setSuccess('Vehicle registered successfully!');
        setRegNumber('');
        setNickname('');
        setShowAddForm(false);
        fetchVehicles();
      }
    } catch (err) {
      setError(err.message || 'Failed to register vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await api.deleteVehicle(id);
      fetchVehicles();
    } catch (err) {
      alert(err.message || 'Failed to remove vehicle');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800' }}>Registered Vehicles</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage two-wheelers, cars, and EVs with normalized Indian registration numbers
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> {showAddForm ? 'Close Form' : 'Register New Vehicle'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Add Vehicle Form Modal/Panel */}
      {showAddForm && (
        <div className="glass-card" style={{ marginBottom: '28px', border: '1px solid var(--accent-primary)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Register Indian Vehicle</h3>
          <form onSubmit={handleAddVehicle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Registration Number (e.g. MH02AB1234 or 22BH1234AA)</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="MH02AB1234"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Standard Indian state format or Bharat (BH) series
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
                <label className="form-label">Nickname (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Blue Nexon EV"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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
          <p style={{ marginTop: '10px' }}>Fetching registered vehicles...</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {vehicles.map(v => (
            <div key={v.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className={`badge ${
                  v.vehicle_type === 'EV' ? 'badge-purple' :
                  v.vehicle_type === 'TWO_WHEELER' ? 'badge-amber' : 'badge-blue'
                }`} style={{ marginBottom: '8px' }}>
                  {v.vehicle_type.replace('_', ' ')}
                </span>
                <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', margin: '4px 0' }}>
                  {v.registration_number}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {v.nickname || 'Default Profile'}
                </div>
              </div>

              <button
                onClick={() => handleDelete(v.id)}
                className="btn btn-secondary btn-sm"
                title="Remove vehicle"
                style={{ color: 'var(--accent-danger)' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
