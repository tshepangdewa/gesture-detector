import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import Detector from './pages/Detector.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/detector' || window.location.hash === '#detector') {
        return 'detector';
      }
    }
    return 'home';
  });

  const navigate = (view) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      const url = view === 'detector' ? '/detector' : '/';
      window.history.pushState({ view }, '', url);
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      const path = window.location.pathname;
      if (path === '/detector' || window.location.hash === '#detector') {
        setCurrentView('detector');
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="app-container">
      <Header currentView={currentView} onNavigate={navigate} />

      <main className="main-content">
        {currentView === 'home' && <Home onNavigate={navigate} />}
        {currentView === 'detector' && <Detector onNavigate={navigate} />}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            HANDSIGHT — Realtime Landmark Vision Engine
          </div>
          <div>
            Pure client-side execution. Zero recording, zero server transmission.
          </div>
          <div>
            Built with MediaPipe & React
          </div>
        </div>
      </footer>
    </div>
  );
}
