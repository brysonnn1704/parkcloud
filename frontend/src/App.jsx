import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { UserDashboardView } from './views/UserDashboardView';
import { LotListingView } from './views/LotListingView';
import { LotDetailsView } from './views/LotDetailsView';
import { MyBookingsView } from './views/MyBookingsView';
import { VehiclesView } from './views/VehiclesView';
import { AnalyticsView } from './views/AnalyticsView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { ReportsView } from './views/ReportsView';
import { WifiOff, AlertTriangle } from 'lucide-react';

export const App = () => {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const [currentView, setView] = useState('landing');
  const [selectedLot, setSelectedLot] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Protected route redirects
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && ['dashboard', 'bookings', 'vehicles', 'reports'].includes(currentView)) {
        setView('login');
      }
      if (!isAdmin && currentView === 'admin') {
        setView(isAuthenticated ? 'dashboard' : 'landing');
      }
      if (isAuthenticated && currentView === 'landing') {
        setView('dashboard');
      }
    }
  }, [currentView, isAuthenticated, isAdmin, loading]);

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingView setView={setView} />;
      case 'login':
        return <LoginView setView={setView} />;
      case 'register':
        return <RegisterView setView={setView} />;
      case 'dashboard':
        return <UserDashboardView setView={setView} onSelectLot={setSelectedLot} />;
      case 'lots':
        return <LotListingView setView={setView} onSelectLot={setSelectedLot} />;
      case 'lot-details':
        return <LotDetailsView lot={selectedLot} setView={setView} onBookingComplete={() => setView('bookings')} />;
      case 'bookings':
        return <MyBookingsView setView={setView} />;
      case 'vehicles':
        return <VehiclesView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'admin':
        return isAdmin ? <AdminDashboardView /> : <LandingView setView={setView} />;
      case 'reports':
        return <ReportsView />;
      default:
        return <LandingView setView={setView} />;
    }
  };

  return (
    <div className="app-container">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div style={{
          background: 'var(--accent-danger)',
          color: '#FFFFFF',
          padding: '8px 20px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <WifiOff size={16} />
          Network Offline: Cloud-backed real-time slot booking requires an active internet connection to reach AWS ALB.
        </div>
      )}

      {/* Main App Navigation */}
      <Navbar currentView={currentView} setView={setView} />

      {/* View Content */}
      <main className="main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
            <p>Initializing ParkCloud Desktop Client...</p>
          </div>
        ) : (
          renderView()
        )}
      </main>

      {/* Desktop App Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '16px 32px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-secondary)'
      }}>
        <div>
          <strong>ParkCloud (India Edition)</strong> • Cloud-Based Smart Parking Management System
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>AWS Region: <strong>ap-south-1 (Mumbai)</strong></span>
          <span>Timezone: <strong>Asia/Kolkata (IST)</strong></span>
          <span>DPDP Act 2023 Compliant</span>
        </div>
      </footer>
    </div>
  );
};
export default App;
