import React from 'react';
import Hero from '../components/Hero.jsx';
import { SUPPORTED_GESTURES } from '../utils/gestureClassifier.js';

export default function Home({ onNavigate }) {
  return (
    <div className="home-page">
      <Hero onStart={() => onNavigate('detector')} />

      {/* Two Main Steps: Detect and Recognize */}
      <section className="steps-section">
        <div className="section-label">Pipeline Architecture</div>
        <h2 className="section-heading">How HandSight Operates</h2>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">STEP 01</div>
            <h3 className="step-title">Detect</h3>
            <p className="step-desc">
              Your webcam feed is analyzed frame-by-frame on-device using the MediaPipe Hand Landmarker runtime. The detector extracts 21 precise 3D hand coordinates (wrist, knuckles, joints, and finger tips) at high frame rates without sending any data off your device.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">STEP 02</div>
            <h3 className="step-title">Recognize</h3>
            <p className="step-desc">
              HandSight evaluates spatial vectors and angular relationships relative to the hand's palm axis. Geometric classification resolves the hand configuration into one of eight supported gestures with temporal smoothing to eliminate flicker and spurious triggers.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Gestures Showcase */}
      <section className="gestures-section" id="gestures">
        <div className="section-label">Gesture Catalog</div>
        <h2 className="section-heading">8 Supported Hand Gestures</h2>

        <div className="gestures-grid">
          {SUPPORTED_GESTURES.map((gesture) => (
            <div key={gesture.id} className="gesture-card">
              <div className="gesture-card-header">
                <span className="gesture-card-badge">{gesture.badge}</span>
                <span className="gesture-card-category">{gesture.category}</span>
              </div>
              <h3 className="gesture-card-name">{gesture.name}</h3>
              <p className="gesture-card-desc">{gesture.description}</p>
              <div className="gesture-card-rule">
                <strong>Instruction:</strong> {gesture.instruction}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
