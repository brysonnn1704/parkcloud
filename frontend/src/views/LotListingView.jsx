import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { formatINR } from '../utils/formatters';
import { MapPin, Clock, Search, Car, Zap, ArrowRight, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

export const LotListingView = ({ setView, onSelectLot }) => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');

  const fetchLots = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getLots();
      if (res.success) {
        setLots(res.lots);
      }
    } catch (err) {
      setError(err.message || 'Failed to load parking lots from cloud API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const cities = ['ALL', ...new Set(lots.map(l => l.city))];

  const filteredLots = lots.filter(lot => {
    const matchesSearch = lot.name.toLowerCase().includes(search.toLowerCase()) ||
                          lot.address.toLowerCase().includes(search.toLowerCase()) ||
                          lot.city.toLowerCase().includes(search.toLowerCase());
    const matchesCity = selectedCity === 'ALL' || lot.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>Smart Parking Locations</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Live availability across verified Indian commercial malls, railway hubs, and IT tech parks
          </p>
        </div>

        <button onClick={fetchLots} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh Lots
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by lot name, area, or PIN code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {cities.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`btn btn-sm ${selectedCity === city ? 'btn-primary' : 'btn-secondary'}`}
              style={{ whiteSpace: 'nowrap', borderRadius: '20px', padding: '6px 14px' }}
            >
              {city === 'ALL' ? 'All Cities' : city}
            </button>
          ))}
        </div>
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
          <p style={{ marginTop: '12px' }}>Querying Amazon RDS for parking locations & tariffs...</p>
        </div>
      ) : filteredLots.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>No parking locations found matching "{search}".</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px' }}>
          {filteredLots.map(lot => (
            <div key={lot.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 0.2s ease, border-color 0.2s ease' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-blue">{lot.city} • PIN {lot.pincode}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <Clock size={13} /> {lot.operating_start_hour}:00 - {lot.operating_end_hour}:00 IST
                  </div>
                </div>

                <h3 style={{ fontSize: '19px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>{lot.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.45' }}>
                  <MapPin size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                  {lot.address}
                </p>

                {lot.description && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    {lot.description}
                  </p>
                )}

                {/* Rates in ₹ */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '18px',
                  fontSize: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>2-Wheeler</span>
                    <strong style={{ color: 'var(--accent-success)', fontSize: '14px' }}>{formatINR(lot.rate_two_wheeler_paise || 2000)}/hr</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Car / SUV</span>
                    <strong style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>{formatINR(lot.rate_four_wheeler_paise || 5000)}/hr</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>EV Fast</span>
                    <strong style={{ color: 'var(--accent-purple)', fontSize: '14px' }}>{formatINR(lot.rate_ev_paise || 4000)}/hr</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Total Capacity: <strong style={{ color: 'var(--text-primary)' }}>{lot.total_slots || 0} Slots</strong>
                </div>

                <button
                  onClick={() => {
                    onSelectLot(lot);
                    setView('lot-details');
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  View Slots & Book <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
