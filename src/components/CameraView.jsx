import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  getHandLandmarker,
  requestWebcamStream,
  stopCameraStream,
  drawLandmarks
} from '../utils/handDetection.js';
import {
  classifyHandLandmarks,
  TemporalGestureSmoother
} from '../utils/gestureClassifier.js';

export default function CameraView({
  onGestureChange,
  onModelStatusChange,
  onCameraStatusChange,
  onCacheInfoChange,
  isLandmarkOverlayEnabled,
  onToggleLandmarkOverlay
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const smootherRef = useRef(new TemporalGestureSmoother());
  const lastVideoTimeRef = useRef(-1);
  const landmarkerRef = useRef(null);

  // Throttling React state updates
  const lastStateUpdateRef = useRef(0);
  const lastReportedGestureRef = useRef(null);

  const [cameraState, setCameraState] = useState('inactive'); // 'inactive' | 'loading' | 'active' | 'permission_denied' | 'unavailable' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [fps, setFps] = useState(0);

  // Notify parent of camera state changes
  useEffect(() => {
    onCameraStatusChange?.(cameraState);
  }, [cameraState, onCameraStatusChange]);

  /**
   * Main animation frame loop processing video frames through MediaPipe
   */
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2 || video.paused || video.ended) {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const startTime = performance.now();

      try {
        const detectionResult = landmarker.detectForVideo(video, startTime);

        let activeLandmarks = null;
        let classified = { gesture: null, confidence: 0, rawDetails: null };

        if (detectionResult?.landmarks && detectionResult.landmarks.length > 0) {
          activeLandmarks = detectionResult.landmarks[0];
          const rawResult = classifyHandLandmarks(activeLandmarks);
          const smoothed = smootherRef.current.processFrame(rawResult);

          classified = {
            gesture: smoothed.gesture,
            confidence: smoothed.confidence,
            rawDetails: rawResult.rawDetails
          };
        } else {
          // No hand landmarks detected this frame
          const smoothed = smootherRef.current.processFrame(null);
          classified = {
            gesture: smoothed.gesture,
            confidence: smoothed.confidence,
            rawDetails: null
          };
        }

        // Draw landmarks on overlay canvas
        if (canvas) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (isLandmarkOverlayEnabled && activeLandmarks) {
              drawLandmarks(ctx, activeLandmarks, canvas.width, canvas.height, true);
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        }

        // Avoid re-rendering React on every frame:
        // Update parent immediately if gesture changes; otherwise throttle telemetry updates to 150ms
        const now = performance.now();
        const gestureChanged = classified.gesture !== lastReportedGestureRef.current;
        const shouldThrottleUpdate = now - lastStateUpdateRef.current > 150;

        if (gestureChanged || shouldThrottleUpdate) {
          lastReportedGestureRef.current = classified.gesture;
          lastStateUpdateRef.current = now;
          onGestureChange?.(classified);
        }
      } catch (detectErr) {
        console.warn('Frame detection warning:', detectErr);
      }
    }

    animFrameIdRef.current = requestAnimationFrame(processFrame);
  }, [isLandmarkOverlayEnabled, onGestureChange]);

  /**
   * Starts the camera and detection engine.
   */
  const startCamera = async () => {
    setCameraState('loading');
    setErrorMessage('');
    onModelStatusChange?.('Requesting camera permission & initializing model...');

    try {
      // 1. Request webcam access
      const stream = await requestWebcamStream();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 2. Initialize MediaPipe HandLandmarker with cached model
      const landmarker = await getHandLandmarker((status) => {
        onModelStatusChange?.(status);
        if (status.includes('cached')) {
          onCacheInfoChange?.({ fromCache: true });
        } else if (status.includes('Saved') || status.includes('Downloaded')) {
          onCacheInfoChange?.({ fromCache: false });
        }
      });

      landmarkerRef.current = landmarker;
      setCameraState('active');
      onModelStatusChange?.('Real-time tracking active');

      // Start processing loop
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error('Start camera error:', err);
      stopCamera();

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('permission_denied');
        setErrorMessage(
          'Webcam permission was denied. Please allow camera access in your browser address bar and click Retry.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('unavailable');
        setErrorMessage('No camera hardware was detected on your device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraState('unavailable');
        setErrorMessage(
          'Camera is currently in use by another application or could not be accessed.'
        );
      } else {
        setCameraState('error');
        setErrorMessage(
          err.message || 'An error occurred while initializing the hand detection engine.'
        );
      }
      onModelStatusChange?.('Initialization error');
    }
  };

  /**
   * Stops the camera, cancels animation frame, and cleans up tracks.
   */
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    smootherRef.current.reset();
    lastReportedGestureRef.current = null;
    setCameraState('inactive');
    onGestureChange?.({ gesture: null, confidence: 0, rawDetails: null });
    onModelStatusChange?.('Standby');
  }, [onGestureChange, onModelStatusChange]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="camera-panel">
      {/* Panel Top Status Bar */}
      <div className="camera-panel-header">
        <div className="camera-status-tag">
          <span
            className={`status-dot ${
              cameraState === 'active'
                ? 'active'
                : cameraState === 'loading'
                ? 'loading'
                : cameraState === 'inactive'
                ? ''
                : 'error'
            }`}
          />
          <span
            style={{
              color: cameraState === 'active' ? '#227B3D' : 'inherit',
              fontWeight: cameraState === 'active' ? '700' : '400'
            }}
          >
            {cameraState === 'active'
              ? 'WEBCAM ACTIVE'
              : cameraState === 'loading'
              ? 'INITIALIZING'
              : cameraState === 'permission_denied'
              ? 'PERMISSION DENIED'
              : cameraState === 'unavailable'
              ? 'CAMERA UNAVAILABLE'
              : cameraState === 'error'
              ? 'SYSTEM ERROR'
              : 'CAMERA STANDBY'}
          </span>
        </div>
        <div>
          <span>{cameraState === 'active' ? 'STREAM: 720p MIRRORED' : 'ZERO-UPLOAD PRIVACY'}</span>
        </div>
      </div>

      {/* Video Viewport Area */}
      <div className="camera-screen">
        <video
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
          autoPlay
          style={{ display: cameraState === 'active' ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="camera-canvas"
          style={{ display: cameraState === 'active' ? 'block' : 'none' }}
        />

        {/* Empty / Inactive State */}
        {cameraState === 'inactive' && (
          <div className="camera-empty-state">
            <div className="camera-empty-icon">📷</div>
            <div className="camera-empty-title">Camera Feed Inactive</div>
            <p className="camera-empty-text">
              Click "Start Camera" below to request access and initialize the MediaPipe vision engine.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={startCamera}
              id="start-camera-overlay-button"
            >
              [ Start Camera ]
            </button>
          </div>
        )}

        {/* Loading State */}
        {cameraState === 'loading' && (
          <div className="camera-empty-state">
            <div className="camera-empty-title">Initializing Vision Engine</div>
            <p className="camera-empty-text">
              Loading model from browser storage cache and requesting camera access...
            </p>
          </div>
        )}

        {/* Permission Denied State */}
        {cameraState === 'permission_denied' && (
          <div className="camera-empty-state">
            <div className="camera-empty-title">Camera Access Denied</div>
            <p className="camera-empty-text">{errorMessage}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={startCamera}
            >
              [ Retry Camera Access ]
            </button>
          </div>
        )}

        {/* Unavailable or Error State */}
        {(cameraState === 'unavailable' || cameraState === 'error') && (
          <div className="camera-empty-state">
            <div className="camera-empty-title">Camera Initialization Failed</div>
            <p className="camera-empty-text">{errorMessage}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={startCamera}
            >
              [ Retry ]
            </button>
          </div>
        )}
      </div>

      {/* Control Actions Bar */}
      <div className="camera-panel-footer">
        <div className="camera-actions">
          {cameraState !== 'active' ? (
            <button
              type="button"
              className="btn-primary"
              onClick={startCamera}
              disabled={cameraState === 'loading'}
              id="start-camera-button"
            >
              [ Start Camera ]
            </button>
          ) : (
            <button
              type="button"
              className="btn-danger"
              onClick={stopCamera}
              id="stop-camera-button"
            >
              [ Stop Camera ]
            </button>
          )}

          {(cameraState === 'permission_denied' ||
            cameraState === 'unavailable' ||
            cameraState === 'error') && (
            <button
              type="button"
              onClick={startCamera}
              id="retry-camera-button"
            >
              [ Retry ]
            </button>
          )}
        </div>

        {/* Landmark Overlay Toggle */}
        <label className="camera-toggle-option" htmlFor="landmark-toggle">
          <input
            type="checkbox"
            id="landmark-toggle"
            checked={isLandmarkOverlayEnabled}
            onChange={(e) => onToggleLandmarkOverlay(e.target.checked)}
          />
          <span>Show 21 Landmark Overlay</span>
        </label>
      </div>

      {/* In-Panel Error Alert Box if applicable */}
      {errorMessage && cameraState !== 'permission_denied' && cameraState !== 'unavailable' && (
        <div className="alert-box error">
          <div className="alert-title">Notice</div>
          <div className="alert-message">{errorMessage}</div>
          <div className="alert-actions">
            <button type="button" onClick={startCamera}>
              Retry Initialization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
