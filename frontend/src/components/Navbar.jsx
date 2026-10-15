import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Compass, 
  MapPin, 
  Car, 
  CalendarCheck, 
  BarChart3, 
  ShieldCheck, 
  FileText, 
  Sun, 
  Moon, 
  LogOut, 
  User,
  Activity
} from 'lucide-react';

export const Navbar = ({ currentView, setView }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 24px',
      height: '66px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      {/* Brand & AWS Cloud Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div 
          onClick={() => setView(isAuthenticated ? 'dashboard' : 'landing')} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          title="ParkCloud India Edition"
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
          }}>
            <Compass size={22} />
          </div>
          <div>
            <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Park<span style={{ color: 'var(--accent-primary)' }}>Cloud</span>
            </span>
            <span style={{ 
              fontSize: '10px', 
              marginLeft: '6px', 
              background: 'rgba(99, 102, 241, 0.15)', 
              color: 'var(--accent-primary)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '700',
              letterSpacing: '0.04em'
            }}>
              INDIA ED.
            </span>
          </div>
        </div>

        {/* AWS ap-south-1 Live Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '600',
          color: 'var(--accent-success)'
        }} title="Connected to AWS ALB in Mumbai (ap-south-1)">
          <span className="live-dot" />
          <span>ap-south-1 Live</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isAuthenticated && (
          <button 
            onClick={() => setView('dashboard')} 
            className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Compass size={15} /> Dashboard
          </button>
        )}

        <button 
          onClick={() => setView('lots')} 
          className={`btn btn-sm ${currentView === 'lots' || currentView === 'lot-details' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <MapPin size={15} /> Find Parking
        </button>

        {isAuthenticated && (
          <>
            <button 
              onClick={() => setView('bookings')} 
              className={`btn btn-sm ${currentView === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <CalendarCheck size={15} /> My Bookings
            </button>
            <button 
              onClick={() => setView('vehicles')} 
              className={`btn btn-sm ${currentView === 'vehicles' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Car size={15} /> My Vehicles
            </button>
          </>
        )}

        <button 
          onClick={() => setView('analytics')} 
          className={`btn btn-sm ${currentView === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BarChart3 size={15} /> Analytics
        </button>

        {isAuthenticated && (
          <button 
            onClick={() => setView('reports')} 
            className={`btn btn-sm ${currentView === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FileText size={15} /> Reports (S3)
          </button>
        )}

        {isAdmin && (
          <button 
            onClick={() => setView('admin')} 
            className={`btn btn-sm ${currentView === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              borderColor: 'var(--accent-purple)', 
              color: currentView === 'admin' ? '#fff' : 'var(--accent-purple)',
              background: currentView === 'admin' ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' : 'transparent'
            }}
          >
            <ShieldCheck size={15} /> Admin Console
          </button>
        )}
      </nav>

      {/* Right Actions: Theme toggle, Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="btn btn-secondary btn-sm"
          style={{ width: '36px', height: '36px', padding: 0 }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'var(--text-primary)'
            }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span style={{ fontWeight: '600' }}>{user?.fullName?.split(' ')[0]}</span>
              {isAdmin && <span className="badge badge-purple" style={{ fontSize: '10px', padding: '1px 6px' }}>Admin</span>}
            </div>
            <button 
              onClick={logout} 
              className="btn btn-secondary btn-sm"
              title="Logout"
              style={{ width: '36px', height: '36px', padding: 0 }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setView('login')} className="btn btn-secondary btn-sm">
              Log In
            </button>
            <button onClick={() => setView('register')} className="btn btn-primary btn-sm">
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
