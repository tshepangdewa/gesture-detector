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
          <div className="footer-top">
            <div>
              <div className="footer-name">Tshepang Dewa</div>
              <div className="footer-tagline">Building useful digital experiences.</div>
            </div>
            <div className="footer-social">
              <div className="footer-social-label">Social</div>
              <div className="footer-social-links">
                <a className="footer-social-link" href="https://github.com/tshepangdewa" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path className="fill" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                  </svg>
                  GitHub
                </a>
                <a className="footer-social-link" href="https://www.linkedin.com/in/tshepang-dewa-601b78270/" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <rect className="fill" x="6.5" y="10" width="2" height="7" />
                    <circle className="fill" cx="7.5" cy="7.3" r="1.2" />
                    <path d="M11.5 17v-7m0 3c0-1.7 1-3 2.8-3S17 11.3 17 13v4" />
                  </svg>
                  LinkedIn
                </a>
                <a className="footer-social-link" href="https://www.instagram.com/tshepang.dewa/" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle className="fill" cx="17.2" cy="6.8" r="1.1" />
                  </svg>
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; {new Date().getFullYear()} Tshepang Dewa. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
