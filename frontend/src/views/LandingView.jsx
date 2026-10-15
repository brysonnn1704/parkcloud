import React from 'react';
import { Compass, ShieldCheck, Zap, BarChart3, Clock, Smartphone, ChevronRight, Shield, Database, Cloud } from 'lucide-react';

export const LandingView = ({ setView }) => {
  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '16px 0 40px 0' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(37, 99, 235, 0.12) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '56px 40px',
        textAlign: 'center',
        marginBottom: '36px',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '400px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: 'var(--accent-primary)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '22px'
        }}>
          <Zap size={16} /> Cloud-Native Smart Parking for Indian Metro Cities
        </div>

        <h1 style={{ fontSize: '44px', fontWeight: '800', lineHeight: '1.18', letterSpacing: '-0.03em', marginBottom: '18px' }}>
          Real-Time Parking Availability & Booking <br />
          <span style={{ 
            background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Powered by AWS Cloud Architecture
          </span>
        </h1>

        <p style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
          maxWidth: '740px',
          margin: '0 auto 32px auto',
          lineHeight: '1.6'
        }}>
          Engineered specifically for Indian parking realities across Mumbai, Pune, Thane, Vasai-Virar, and Bengaluru. 
          Reserve bays for two-wheelers, cars, autos, and EVs with PostgreSQL interval exclusion locks and instant boom-barrier QR passes.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setView('lots')} 
            className="btn btn-primary" 
            style={{ padding: '13px 30px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Find Parking Bays <ChevronRight size={18} />
          </button>
          <button 
            onClick={() => setView('analytics')} 
            className="btn btn-secondary" 
            style={{ padding: '13px 26px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <BarChart3 size={18} /> Live Utilization Analytics
          </button>
        </div>

        {/* Live System Metric Counters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginTop: '44px',
          paddingTop: '32px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>5 Hubs</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Mumbai, Pune, Bengaluru</div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--accent-success)' }}>0.0%</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Double-Booking Rate (GIST Locked)</div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--accent-primary)' }}>18% GST</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Compliant Itemized Receipts</div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--accent-purple)' }}>DPDP 2023</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Data Minimization Verified</div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '36px' }}>
        <div className="glass-card">
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Clock size={22} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Strict IST Operating Hours</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            All operations, pricing schedules, and availability windows are calculated deterministically in Asia/Kolkata (IST), matching Indian commercial hub hours.
          </p>
        </div>

        <div className="glass-card">
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Database size={22} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Zero Collision Engine</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            PostgreSQL <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>btree_gist</code> exclusion constraint locks temporal ranges atomically at the storage layer.
          </p>
        </div>

        <div className="glass-card">
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Smartphone size={22} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Instant Boom Barrier Pass</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Generates standardized Indian parking passes with scannable QR verification for contactless gate entry and automated barrier exit.
          </p>
        </div>
      </div>

      {/* Cloud Architecture & DPDP Act compliance note */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '20px 28px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={20} color="var(--accent-success)" />
          <span>
            <strong>Digital Personal Data Protection (DPDP) Act 2023:</strong> Strict purpose limitation. No Aadhaar or biometric data collected or retained.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cloud size={16} color="var(--accent-primary)" />
          <span className="badge badge-blue">AWS ap-south-1 Mumbai</span>
        </div>
      </div>
    </div>
  );
};
