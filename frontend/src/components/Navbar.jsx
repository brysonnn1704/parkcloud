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
  Sparkles
} from 'lucide-react';

export const Navbar = ({ currentView, setView }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand */}
      <div 
        onClick={() => setView('landing')} 
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF'
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
            background: 'rgba(59, 130, 246, 0.2)', 
            color: 'var(--accent-primary)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            INDIA ED.
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button 
          onClick={() => setView('lots')} 
          className={`btn btn-sm ${currentView === 'lots' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <MapPin size={15} /> Find Parking
        </button>

        {isAuthenticated && (
          <>
            <button 
              onClick={() => setView('dashboard')} 
              className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Compass size={15} /> Dashboard
            </button>
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
            style={{ borderColor: 'var(--accent-purple)', color: currentView === 'admin' ? '#fff' : 'var(--accent-purple)' }}
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
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}>
              <User size={16} />
              <span>{user?.fullName?.split(' ')[0]}</span>
              {isAdmin && <span className="badge badge-purple">Admin</span>}
            </div>
            <button 
              onClick={logout} 
              className="btn btn-secondary btn-sm"
              title="Logout"
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
