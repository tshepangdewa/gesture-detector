import React from 'react';
import { SUPPORTED_GESTURES } from '../utils/gestureClassifier.js';

export default function GestureResult({
  detectedGesture,
  confidence,
  handDetails,
  cameraStatus,
  modelStatus,
  cacheInfo
}) {
  const isDetected = Boolean(detectedGesture);
  const currentGestureObj = SUPPORTED_GESTURES.find((g) => g.name === detectedGesture);

  return (
    <div className="result-panel" aria-live="polite">
      <div className="panel-header-title">Detection Telemetry</div>

      {/* Main Detected Gesture Display */}
      <div className={`gesture-display-box ${isDetected ? 'detected' : ''}`}>
        <div className="gesture-tagline">
          {isDetected ? 'Recognized Gesture' : 'Current Status'}
        </div>
        <div className={`gesture-headline ${!isDetected ? 'empty' : ''}`}>
          {isDetected ? detectedGesture : 'No gesture detected'}
        </div>
        <div className="gesture-instruction-text">
          {isDetected
            ? currentGestureObj?.description || 'Active landmark match'
            : cameraStatus === 'active'
            ? 'Present one hand clearly in front of the camera.'
            : 'Start camera to begin real-time gesture detection.'}
        </div>
      </div>

      {/* System Status and Model Cache Information */}
      <div className="system-status-box">
        <div className="system-status-row">
          <span className="system-status-label">Engine:</span>
          <span className="system-status-val">{modelStatus || 'Standby'}</span>
        </div>
        <div className="system-status-row">
          <span className="system-status-label">Storage Cache:</span>
          <span className="system-status-val">
            {cacheInfo ? `${cacheInfo.fromCache ? 'IndexedDB (Cached)' : 'Downloaded & Saved'}` : 'Checking cache...'}
          </span>
        </div>
        <div className="system-status-row">
          <span className="system-status-label">Camera:</span>
          <span
            className="system-status-val"
            style={{
              textTransform: 'uppercase',
              color: cameraStatus === 'active' ? '#227B3D' : 'inherit',
              fontWeight: cameraStatus === 'active' ? '700' : '400'
            }}
          >
            {cameraStatus}
          </span>
        </div>
        {confidence > 0 && (
          <div className="system-status-row">
            <span className="system-status-label">Confidence:</span>
            <span className="system-status-val">{Math.round(confidence * 100)}%</span>
          </div>
        )}
      </div>

      {/* Quick Reference List */}
      <div className="quick-ref-list">
        <div className="quick-ref-heading">Supported Target Set</div>
        <ul className="quick-ref-items">
          {SUPPORTED_GESTURES.map((gesture) => {
            const isActive = gesture.name === detectedGesture;
            return (
              <li
                key={gesture.id}
                className={`quick-ref-item ${isActive ? 'active' : ''}`}
              >
                {gesture.name}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
