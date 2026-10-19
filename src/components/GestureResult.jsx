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

      {/* Real-time Finger State Matrix */}
      <div className="finger-matrix">
        <div className="matrix-title">Skeletal Finger Analysis</div>
        <div className="matrix-grid">
          <div className={`matrix-item ${handDetails?.thumbExt ? 'extended' : ''}`}>
            <span className="matrix-item-name">THUMB</span>
            <span className="matrix-item-state">
              {handDetails?.thumbExt ? 'OPEN' : 'FOLD'}
            </span>
          </div>
          <div className={`matrix-item ${handDetails?.indexExt ? 'extended' : ''}`}>
            <span className="matrix-item-name">INDEX</span>
            <span className="matrix-item-state">
              {handDetails?.indexExt ? 'OPEN' : 'FOLD'}
            </span>
          </div>
          <div className={`matrix-item ${handDetails?.middleExt ? 'extended' : ''}`}>
            <span className="matrix-item-name">MIDDLE</span>
            <span className="matrix-item-state">
              {handDetails?.middleExt ? 'OPEN' : 'FOLD'}
            </span>
          </div>
          <div className={`matrix-item ${handDetails?.ringExt ? 'extended' : ''}`}>
            <span className="matrix-item-name">RING</span>
            <span className="matrix-item-state">
              {handDetails?.ringExt ? 'OPEN' : 'FOLD'}
            </span>
          </div>
          <div className={`matrix-item ${handDetails?.pinkyExt ? 'extended' : ''}`}>
            <span className="matrix-item-name">PINKY</span>
            <span className="matrix-item-state">
              {handDetails?.pinkyExt ? 'OPEN' : 'FOLD'}
            </span>
          </div>
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
          <span className="system-status-val" style={{ textTransform: 'uppercase' }}>
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

      {/* Quick Reference Checklist */}
      <div className="quick-ref-list">
        <div className="quick-ref-heading">Supported Target Set</div>
        <div className="quick-ref-items">
          {SUPPORTED_GESTURES.map((gesture) => {
            const isActive = gesture.name === detectedGesture;
            return (
              <div
                key={gesture.id}
                className={`quick-ref-item ${isActive ? 'active' : ''}`}
              >
                <span>{gesture.name}</span>
                <span>{gesture.badge}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
