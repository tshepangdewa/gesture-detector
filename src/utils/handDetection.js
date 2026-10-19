/**
 * handDetection.js
 * MediaPipe HandLandmarker lifecycle management and camera stream utilities.
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { loadModelWithCache } from './modelCache.js';

// MediaPipe 21 Hand Landmark skeletal connections
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

let landmarkerInstance = null;
let landmarkerPromise = null;

/**
 * Initializes and caches the MediaPipe HandLandmarker instance.
 * Reuses the singleton instance to prevent duplicate overhead.
 */
export async function getHandLandmarker(onStatusUpdate) {
  if (landmarkerInstance) {
    return landmarkerInstance;
  }

  if (landmarkerPromise) {
    return landmarkerPromise;
  }

  landmarkerPromise = (async () => {
    try {
      onStatusUpdate?.('Initializing MediaPipe vision engine...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      const { buffer, fromCache } = await loadModelWithCache(onStatusUpdate);

      onStatusUpdate?.(
        fromCache
          ? 'Compiling cached hand detection model...'
          : 'Compiling hand detection model...'
      );

      try {
        landmarkerInstance = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetBuffer: new Uint8Array(buffer),
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      } catch (gpuErr) {
        console.warn('GPU acceleration delegate unavailable; falling back to CPU:', gpuErr);
        onStatusUpdate?.('Switching to CPU delegate...');
        landmarkerInstance = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetBuffer: new Uint8Array(buffer),
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      }

      onStatusUpdate?.('Detection model ready');
      return landmarkerInstance;
    } catch (err) {
      console.error('HandLandmarker initialization failed:', err);
      landmarkerInstance = null;
      landmarkerPromise = null;
      throw err;
    }
  })();

  return landmarkerPromise;
}

/**
 * Disposes the current HandLandmarker instance.
 */
export function disposeHandLandmarker() {
  if (landmarkerInstance) {
    try {
      landmarkerInstance.close();
    } catch (e) {
      console.warn('Error closing landmarker:', e);
    }
    landmarkerInstance = null;
    landmarkerPromise = null;
  }
}

/**
 * Requests webcam video stream from navigator.mediaDevices.
 */
export async function requestWebcamStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const error = new Error('Camera API is not supported in this browser environment.');
    error.name = 'NotSupportedError';
    throw error;
  }

  const constraints = {
    audio: false,
    video: {
      facingMode: 'user',
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 }
    }
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Stops all media tracks on a given stream.
 */
export function stopCameraStream(stream) {
  if (!stream) return;
  try {
    const tracks = stream.getTracks();
    tracks.forEach((track) => {
      track.stop();
    });
  } catch (err) {
    console.warn('Error stopping camera tracks:', err);
  }
}

/**
 * Draws sharp, minimalist hand landmark overlay on canvas.
 * Follows design requirements: no glowing effects, no gradients, sharp points.
 */
export function drawLandmarks(ctx, landmarks, width, height, isMirrored = true) {
  if (!ctx || !landmarks || landmarks.length === 0) return;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Set line styling: thin solid lines, sharp caps
  ctx.strokeStyle = '#313851';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  // Helper for mirrored x coordinate
  const getX = (normalizedX) => (isMirrored ? (1 - normalizedX) * width : normalizedX * width);
  const getY = (normalizedY) => normalizedY * height;

  // Draw skeletal connections
  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];
    if (p1 && p2) {
      ctx.beginPath();
      ctx.moveTo(getX(p1.x), getY(p1.y));
      ctx.lineTo(getX(p2.x), getY(p2.y));
      ctx.stroke();
    }
  }

  // Draw landmark points: sharp square markers
  ctx.fillStyle = '#313851';
  const pointSize = 5;

  for (let i = 0; i < landmarks.length; i++) {
    const pt = landmarks[i];
    if (pt) {
      const px = getX(pt.x);
      const py = getY(pt.y);

      // Distinct styling for key tips (4, 8, 12, 16, 20) vs joints
      const isTip = [4, 8, 12, 16, 20].includes(i);
      const size = isTip ? 6 : 4;

      if (isTip) {
        ctx.fillStyle = '#313851';
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
      } else {
        ctx.fillStyle = '#F6F3ED';
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
        ctx.strokeRect(px - size / 2, py - size / 2, size, size);
      }
    }
  }

  ctx.restore();
}
