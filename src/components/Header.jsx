import React from 'react';

export default function Header({ currentView, onNavigate }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div
          className="brand"
          onClick={() => onNavigate('home')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('home')}
          aria-label="Gesture Detector Home"
        >
          <span className="brand-wordmark">Gesture Detector</span>
        </div>

        <nav className="site-nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`nav-link ${currentView === 'detector' ? 'active' : ''}`}
            onClick={() => onNavigate('detector')}
          >
            Detector
          </button>
        </nav>
      </div>
    </header>
  );
}
