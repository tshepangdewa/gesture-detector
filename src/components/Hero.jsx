import React from 'react';

export default function Hero({ onStart }) {
  return (
    <section className="hero-section">
      <h1 className="hero-title">
        Hand gestures recognized instantly
      </h1>
      <p className="hero-description">
        HandSight recognizes hand gestures in real time directly through your webcam using client-side landmark analysis. High accuracy, zero server latency, and complete privacy.
      </p>
      <div className="hero-actions">
        <button
          type="button"
          className="hero-start-btn btn-primary"
          onClick={onStart}
          id="hero-start-button"
        >
          [ Start Gesture Detector ]
        </button>
        <p className="hero-notice">
          No account required. Camera permission is requested only when detection starts.
        </p>
      </div>
    </section>
  );
}
