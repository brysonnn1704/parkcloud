import React from 'react';
import { Compass, ShieldCheck, Zap, BarChart, Clock, Smartphone, ChevronRight } from 'lucide-react';

export const LandingView = ({ setView }) => {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 0' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '50px 40px',
        textAlign: 'center',
        marginBottom: '40px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(59, 130, 246, 0.2)',
          color: 'var(--accent-primary)',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '20px'
        }}>
          <Zap size={16} /> Cloud-Native Smart Parking for Indian Metro Cities
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1.2', marginBottom: '18px' }}>
          Real-Time Parking Availability & Booking <br />
          <span style={{ color: 'var(--accent-primary)' }}>Powered by AWS Cloud Architecture</span>
        </h1>
        <p style={{
          fontSize: '17px',
          color: 'var(--text-secondary)',
          maxWidth: '720px',
          margin: '0 auto 30px auto',
          lineHeight: '1.6'
        }}>
          Built for Indian parking realities across Mumbai, Pune, Thane, and Bengaluru. 
          Book slots for cars, two-wheelers, and EVs with guaranteed concurrency protection and instant QR passes.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button onClick={() => setView('lots')} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
            Browse Parking Lots <ChevronRight size={18} />
          </button>
          <button onClick={() => setView('analytics')} className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px' }}>
            <BarChart size={18} /> Live Utilization Analytics
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card">
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Clock size={22} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>India IST Operating Hours</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Operating boundaries computed accurately in Asia/Kolkata timezone with IST/UTC boundary guarantees.
          </p>
        </div>

        <div className="glass-card">
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <ShieldCheck size={22} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Zero Double-Booking Guarantee</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            PostgreSQL <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>btree_gist</code> exclusion constraint locks slot time intervals at the database engine level.
          </p>
        </div>

        <div className="glass-card">
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Smartphone size={22} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Instant QR Code Pass</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Generate cryptographic digital passes with seamless boom-barrier check-in and check-out tracking.
          </p>
        </div>
      </div>

      {/* Compliance note */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '18px 24px',
        fontSize: '13px',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <span><strong>DPDP Act 2023 Compliance:</strong> Data minimization and purpose limitation enforced. No Aadhaar or confidential documents collected.</span>
        <span className="badge badge-blue">AWS ap-south-1 Mumbai</span>
      </div>
    </div>
  );
};
