import React, { useState, useCallback } from 'react';
import CameraView from '../components/CameraView.jsx';
import GestureResult from '../components/GestureResult.jsx';

export default function Detector({ onNavigate }) {
  const [detectedGesture, setDetectedGesture] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [handDetails, setHandDetails] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('inactive');
  const [modelStatus, setModelStatus] = useState('Standby');
  const [cacheInfo, setCacheInfo] = useState(null);
  const [isLandmarkOverlayEnabled, setIsLandmarkOverlayEnabled] = useState(true);

  const handleGestureChange = useCallback((result) => {
    setDetectedGesture(result.gesture);
    setConfidence(result.confidence);
    setHandDetails(result.rawDetails);
  }, []);

  return (
    <div className="detector-page">
      {/* Top Header Bar for Detector */}
      <div className="detector-header-bar">
        <div>
          <h1 className="detector-title">Live Hand Gesture Detection</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Realtime 21-landmark classification running locally in your browser.
          </p>
        </div>
        <div className="detector-controls-top">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Main Detector Workspace: Desktop (Left: Camera, Right: Result), Mobile (Stacked) */}
      <div className="detector-workspace">
        <div className="detector-camera-column">
          <CameraView
            onGestureChange={handleGestureChange}
            onModelStatusChange={setModelStatus}
            onCameraStatusChange={setCameraStatus}
            onCacheInfoChange={setCacheInfo}
            isLandmarkOverlayEnabled={isLandmarkOverlayEnabled}
            onToggleLandmarkOverlay={setIsLandmarkOverlayEnabled}
          />
        </div>

        <div className="detector-result-column">
          <GestureResult
            detectedGesture={detectedGesture}
            confidence={confidence}
            handDetails={handDetails}
            cameraStatus={cameraStatus}
            modelStatus={modelStatus}
            cacheInfo={cacheInfo}
          />
        </div>
      </div>
    </div>
  );
}
