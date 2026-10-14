import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  ShieldCheck, 
  Plus, 
  MapPin, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Search,
  Filter 
} from 'lucide-react';

export const AdminDashboardView = () => {
  const [activeTab, setActiveTab] = useState('OPERATOR');
  const [scanRef, setScanRef] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [submittingScan, setSubmittingScan] = useState(false);

  // Lot Management State
  const [lots, setLots] = useState([]);
  const [showAddLot, setShowAddLot] = useState(false);
  const [newLot, setNewLot] = useState({
    name: '',
    address: '',
    city: 'Mumbai',
    pincode: '400001',
    operatingStartHour: 6,
    operatingEndHour: 23,
    rateFourWheelerPaise: 5000,
    rateTwoWheelerPaise: 2000,
  });

  // Slot Management State
  const [selectedLotForSlot, setSelectedLotForSlot] = useState('');
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [newSlotCategory, setNewSlotCategory] = useState('STANDARD');

  // Bookings Log State
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const fetchLots = async () => {
    try {
      const res = await api.getLots();
      if (res.success) {
        setLots(res.lots);
        if (res.lots.length > 0 && !selectedLotForSlot) {
          setSelectedLotForSlot(res.lots[0].id);
        }
      }
    } catch (e) {}
  };

  const fetchAllBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.getAdminBookings();
      if (res.success) {
        setAllBookings(res.bookings);
      }
    } catch (e) {}
    finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchLots();
    fetchAllBookings();
  }, []);

  // Handle Gate Check-in
  const handleCheckIn = async () => {
    if (!scanRef.trim()) return;
    setSubmittingScan(true);
    setScanResult(null);
    setScanError('');
    try {
      const res = await api.checkIn(scanRef.trim());
      setScanResult(res.message);
      fetchAllBookings();
    } catch (err) {
      setScanError(err.message || 'Check-in failed');
    } finally {
      setSubmittingScan(false);
    }
  };

  // Handle Gate Check-out
  const handleCheckOut = async () => {
    if (!scanRef.trim()) return;
    setSubmittingScan(true);
    setScanResult(null);
    setScanError('');
    try {
      const res = await api.checkOut(scanRef.trim());
      setScanResult(res.message);
      fetchAllBookings();
    } catch (err) {
      setScanError(err.message || 'Check-out failed');
    } finally {
      setSubmittingScan(false);
    }
  };

  // Handle Add Lot
  const handleCreateLot = async (e) => {
    e.preventDefault();
    try {
      await api.createLot(newLot);
      setShowAddLot(false);
      fetchLots();
      alert('Parking lot created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create lot');
    }
  };

  // Handle Add Slot
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!selectedLotForSlot || !newSlotNumber) return;
    try {
      await api.createSlot(selectedLotForSlot, {
        slotNumber: newSlotNumber,
        category: newSlotCategory,
      });
      setNewSlotNumber('');
      fetchLots();
      alert('Slot added successfully to lot!');
    } catch (err) {
      alert(err.message || 'Failed to create slot');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800' }}>Admin & Gate Operations Console</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Boom-barrier verification, lot rate controls, and system-wide booking audits
          </p>
        </div>

        <span className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '12px' }}>
          <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px' }} /> Role: ADMINISTRATOR
        </span>
      </div>

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('OPERATOR')}
          className={`btn btn-sm ${activeTab === 'OPERATOR' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <QrCode size={14} /> Gate Boom Barrier Scanner
        </button>
        <button
          onClick={() => setActiveTab('LOTS')}
          className={`btn btn-sm ${activeTab === 'LOTS' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <MapPin size={14} /> Lot & Slot Configuration
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`btn btn-sm ${activeTab === 'AUDIT' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Search size={14} /> All Bookings Audit ({allBookings.length})
        </button>
      </div>

      {/* Tab 1: Operator QR / Reference Entry */}
      {activeTab === 'OPERATOR' && (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              Gate Operator Pass Verification
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Enter or scan the customer's Booking Reference (e.g. <code style={{ color: 'var(--accent-primary)' }}>PC-BKG-2602</code>)
            </p>

            {scanResult && (
              <div className="alert alert-success">
                <CheckCircle size={18} />
                <span>{scanResult}</span>
              </div>
            )}

            {scanError && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{scanError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Booking Reference ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="PC-BKG-2602 or scan code"
                value={scanRef}
                onChange={(e) => setScanRef(e.target.value.toUpperCase())}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', letterSpacing: '0.05em' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                disabled={submittingScan}
                onClick={handleCheckIn}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px' }}
              >
                {submittingScan ? 'Processing...' : 'Verify & Check In (Gate Open)'}
              </button>
              <button
                type="button"
                disabled={submittingScan}
                onClick={handleCheckOut}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                {submittingScan ? 'Processing...' : 'Process Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Lot & Slot Management */}
      {activeTab === 'LOTS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Create Lot */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Add New Parking Lot</h3>
            <form onSubmit={handleCreateLot}>
              <div className="form-group">
                <label className="form-label">Lot Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Thane Viviana Mall North"
                  value={newLot.name}
                  onChange={(e) => setNewLot({ ...newLot, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Eastern Express Highway"
                  value={newLot.address}
                  onChange={(e) => setNewLot({ ...newLot, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newLot.city}
                    onChange={(e) => setNewLot({ ...newLot, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newLot.pincode}
                    onChange={(e) => setNewLot({ ...newLot, pincode: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Save Parking Lot
              </button>
            </form>
          </div>

          {/* Add Slot */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Add Parking Slot to Lot</h3>
            <form onSubmit={handleCreateSlot}>
              <div className="form-group">
                <label className="form-label">Select Lot</label>
                <select
                  className="form-select"
                  value={selectedLotForSlot}
                  onChange={(e) => setSelectedLotForSlot(e.target.value)}
                >
                  {lots.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Slot Identifier (e.g. A-12 or EV-05)</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="SLOT-01"
                  value={newSlotNumber}
                  onChange={(e) => setNewSlotNumber(e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newSlotCategory}
                  onChange={(e) => setNewSlotCategory(e.target.value)}
                >
                  <option value="STANDARD">Standard (Cars/SUVs)</option>
                  <option value="EV_CHARGING">EV Fast Charging Bay</option>
                  <option value="TWO_WHEELER">Two-Wheeler Dedicated</option>
                  <option value="ACCESSIBLE">Accessible (Divyangjan)</option>
                  <option value="RESERVED">Reserved</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Add Slot to RDS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: All Bookings Audit */}
      {activeTab === 'AUDIT' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>System-Wide Booking Ledger</h3>
            <button onClick={fetchAllBookings} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Reference</th>
                  <th style={{ padding: '10px 8px' }}>User</th>
                  <th style={{ padding: '10px 8px' }}>Location & Slot</th>
                  <th style={{ padding: '10px 8px' }}>Vehicle Plate</th>
                  <th style={{ padding: '10px 8px' }}>Start Time (IST)</th>
                  <th style={{ padding: '10px 8px' }}>Fee (INR)</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      {b.booking_reference}
                    </td>
                    <td style={{ padding: '10px 8px' }}>{b.user_name || b.user_email}</td>
                    <td style={{ padding: '10px 8px' }}>{b.lot_name} (Bay {b.slot_number})</td>
                    <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>{b.registration_number}</td>
                    <td style={{ padding: '10px 8px' }}>{b.startTimeIST}</td>
                    <td style={{ padding: '10px 8px', fontWeight: '600', color: 'var(--accent-success)' }}>{b.feeFormatted}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className={`badge ${
                        b.status === 'ACTIVE' ? 'badge-green' :
                        b.status === 'CONFIRMED' ? 'badge-blue' :
                        b.status === 'COMPLETED' ? 'badge-purple' : 'badge-amber'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
