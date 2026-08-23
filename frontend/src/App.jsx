import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './shared/components/Navbar';
import Footer from './shared/components/Footer';
import AiButton from './shared/components/AiButton';
import BridgeLoader from './shared/components/BridgeLoader';
import AppRoutes from './routes';
import { useAuth } from './features/auth/AuthContext';
import { useHeartbeat } from './features/presence/hooks/useHeartbeat';
import RfidScannerModal from './features/rfid/components/RfidScannerModal';
import './App.css';

// Helper to extract view ID from URL hash or path
function getViewFromLocation() {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  if (hash) return hash;

  const path = window.location.pathname.replace(/^\//, '').toLowerCase().trim();
  return path || 'home';
}

// Map view IDs to dynamic document DOM title tags
const ROUTE_TITLES = {
  home: 'Setu: AI Knowledge Bridge',
  library: 'Setu: Knowledge Library',
  community: 'Setu: Community Mentors & Discussions',
  schemes: 'Setu: Government Schemes & Benefits',
  legacy: 'Setu: Legacy Archives & Wisdom',
  about: 'Setu: About Us & Mission',
  contribute: 'Setu: Share Knowledge & Heritage',
  profile: 'Setu: User Profile & Saved Wisdom',
  signin: 'Setu: Sign In to Account',
  signup: 'Setu: Join Setu Community',
  ai: 'Setu: AI Knowledge Assistant',
  admin: 'Setu: Admin AI Cost Control & Telemetry',
};

export default function App() {
  const [currentView, setCurrentViewState] = useState(() => getViewFromLocation());
  const { currentUser, isLoading, logout, loginWithSession, patchLocalProfile } = useAuth();
  const [showLoader, setShowLoader] = useState(true);
  const [isRfidModalOpen, setIsRfidModalOpen] = useState(false);

  // Live user state backend-confirmed heartbeat with 20s interval & activity tracking
  useHeartbeat({
    isAuthenticated: !!currentUser,
    currentActivity: `viewing_${currentView}`,
    currentResource: currentView,
    intervalMs: 20000
  });

  // Synchronized view changer that pushes history stack entry for Browser Back/Forward buttons
  const setCurrentView = useCallback((newView) => {
    const cleanView = (newView || 'home').toString().toLowerCase().trim();
    const targetHash = `#/${cleanView}`;

    if (window.location.hash !== targetHash) {
      window.history.pushState({ view: cleanView }, '', targetHash);
    }

    setCurrentViewState(cleanView);
    document.title = ROUTE_TITLES[cleanView] || 'Setu: AI Knowledge Bridge';
    window.scrollTo(0, 0);
  }, []);

  // Listen for browser Back/Forward navigation (popstate & hashchange)
  useEffect(() => {
    const initialView = getViewFromLocation();
    if (!window.location.hash) {
      window.history.replaceState({ view: initialView }, '', `#/${initialView}`);
    }

    const handleUrlChange = (e) => {
      const viewFromUrl = e.state?.view || getViewFromLocation();
      setCurrentViewState(viewFromUrl);
      document.title = ROUTE_TITLES[viewFromUrl] || 'Setu: AI Knowledge Bridge';
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    document.title = ROUTE_TITLES[initialView] || 'Setu: AI Knowledge Bridge';

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentView('home');
  };

  // Only user profile and contributing require active user login session
  const protectedViews = ['profile', 'contribute'];
  
  // Navigation handler for full-page route views
  const handleViewChange = (targetView) => {
    const clean = targetView.toString().toLowerCase().trim();
    const token = localStorage.getItem('setu_access_token');
    const isAuthed = !!currentUser || !!token;
    if (!isAuthed && protectedViews.includes(clean)) {
      setCurrentView('signin');
    } else {
      setCurrentView(clean);
    }
  };

  // Hide loader once auth check finishes and BridgeLoader animation completes
  const handleLoaderFinish = () => {
    setShowLoader(false);
  };

  if (isLoading || showLoader) {
    return <BridgeLoader onFinish={handleLoaderFinish} />;
  }

  return (
    <div id="app-root-container" className="min-h-screen flex flex-col bg-white">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onViewChange={handleViewChange}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenRfid={() => setIsRfidModalOpen(true)}
      />

      {/* Main Content Area via AppRoutes */}
      <main id="main-content-view" className="flex-grow">
        <React.Suspense fallback={
          <div className="py-20 text-center space-y-3 min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Wisdom...</p>
          </div>
        }>
          <AppRoutes
            currentView={currentView}
            setCurrentView={handleViewChange}
            currentUser={currentUser}
            handleLogout={handleLogout}
            onOpenRfid={() => setIsRfidModalOpen(true)}
          />
        </React.Suspense>
      </main>

      {/* Footer Section */}
      <Footer currentView={currentView} onViewChange={handleViewChange} />

      {/* Floating AI Assistant Button */}
      <AiButton onViewChange={handleViewChange} currentView={currentView} />

      {/* Global RFID / NFC Smart Card Kiosk Modal */}
      <RfidScannerModal
        isOpen={isRfidModalOpen}
        onClose={() => setIsRfidModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(tokens, user) => {
          loginWithSession(tokens, user);
        }}
        onViewChange={handleViewChange}
      />
    </div>
  );
}
