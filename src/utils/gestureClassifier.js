/**
 * gestureClassifier.js
 * Geometric landmark-based classification for eight hand gestures using MediaPipe 21 landmarks.
 * Includes temporal smoothing and debouncing.
 */

export const SUPPORTED_GESTURES = [
  {
    id: 'number_1',
    name: 'Number 1',
    category: 'Counting',
    description: 'Index finger extended, remaining fingers folded.',
    instruction: 'Point your index finger upward with other fingers folded.'
  },
  {
    id: 'number_2',
    name: 'Number 2',
    category: 'Counting',
    description: 'Index and middle fingers extended, ring and little fingers folded.',
    instruction: 'Extend both index and middle fingers.'
  },
  {
    id: 'number_3',
    name: 'Number 3',
    category: 'Counting',
    description: 'Three fingers extended, remaining fingers folded.',
    instruction: 'Extend index, middle, and ring fingers.'
  },
  {
    id: 'number_4',
    name: 'Number 4',
    category: 'Counting',
    description: 'Four fingers extended, thumb folded.',
    instruction: 'Extend four fingers with thumb folded across your palm.'
  },
  {
    id: 'number_5',
    name: 'Number 5',
    category: 'Counting',
    description: 'All five fingers extended.',
    instruction: 'Open your hand with all five fingers spread.'
  },
  {
    id: 'thumbs_up',
    name: 'Thumbs Up',
    category: 'Sign',
    description: 'Thumb pointing upward, other four fingers folded.',
    instruction: 'Make a fist with your thumb pointing straight up.'
  },
  {
    id: 'thumbs_down',
    name: 'Thumbs Down',
    category: 'Sign',
    description: 'Thumb pointing downward, other four fingers folded.',
    instruction: 'Make a fist with your thumb pointing straight down.'
  },
  {
    id: 'stop',
    name: 'Stop',
    category: 'Sign',
    description: 'All fingers are folded into a fist.',
    instruction: 'Clench all fingers and thumb into a closed fist.'
  }
];

/**
 * Calculates 3D/2D Euclidean distance between two landmark points.
 */
function dist(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
}

/**
 * Classifies a single frame of 21 MediaPipe hand landmarks.
 * Returns { gesture: string | null, confidence: number, rawDetails: object }
 */
export function classifyHandLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: null, confidence: 0, reason: 'insufficient_landmarks' };
  }

  const wrist = landmarks[0];
  const thumbCmc = landmarks[1];
  const thumbMcp = landmarks[2];
  const thumbIp = landmarks[3];
  const thumbTip = landmarks[4];

  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexDip = landmarks[7];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleDip = landmarks[11];
  const middleTip = landmarks[12];

  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringDip = landmarks[15];
  const ringTip = landmarks[16];

  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyDip = landmarks[19];
  const pinkyTip = landmarks[20];

  // Scale normalization based on palm length (wrist to middle knuckle)
  const palmScale = dist(wrist, middleMcp);
  if (palmScale < 0.01) {
    return { gesture: null, confidence: 0, reason: 'scale_too_small' };
  }

  // Extension/folding detection invariant to camera distance
  function isExtended(mcp, pip, dip, tip) {
    const tipToWrist = dist(tip, wrist);
    const pipToWrist = dist(pip, wrist);
    const dipToWrist = dist(dip, wrist);
    const tipToMcp = dist(tip, mcp);
    const pipToMcp = dist(pip, mcp);

    const condition1 = tipToWrist > pipToWrist * 1.12;
    const condition2 = tipToWrist > dipToWrist * 1.02;
    const condition3 = tipToMcp > pipToMcp * 1.25;

    return condition1 && (condition2 || condition3);
  }

  function isFolded(mcp, pip, dip, tip) {
    const tipToWrist = dist(tip, wrist);
    const pipToWrist = dist(pip, wrist);
    const tipToMcp = dist(tip, mcp);
    const pipToMcp = dist(pip, mcp);

    const foldedToWrist = tipToWrist <= pipToWrist * 1.15;
    const foldedToMcp = tipToMcp <= pipToMcp * 1.25;
    return foldedToWrist || foldedToMcp;
  }

  const indexExt = isExtended(indexMcp, indexPip, indexDip, indexTip);
  const middleExt = isExtended(middleMcp, middlePip, middleDip, middleTip);
  const ringExt = isExtended(ringMcp, ringPip, ringDip, ringTip);
  const pinkyExt = isExtended(pinkyMcp, pinkyPip, pinkyDip, pinkyTip);

  const indexFld = isFolded(indexMcp, indexPip, indexDip, indexTip);
  const middleFld = isFolded(middleMcp, middlePip, middleDip, middleTip);
  const ringFld = isFolded(ringMcp, ringPip, ringDip, ringTip);
  const pinkyFld = isFolded(pinkyMcp, pinkyPip, pinkyDip, pinkyTip);

  // Thumb evaluation
  const thumbTipToIndexMcp = dist(thumbTip, indexMcp);
  const thumbTipToPinkyMcp = dist(thumbTip, pinkyMcp);
  const thumbTipToMcp = dist(thumbTip, thumbMcp);
  const thumbIpToMcp = dist(thumbIp, thumbMcp);

  const thumbExt =
    thumbTipToIndexMcp > palmScale * 0.44 &&
    thumbTipToMcp > thumbIpToMcp * 1.15 &&
    dist(thumbTip, wrist) > dist(thumbMcp, wrist) * 1.05;

  const thumbFld =
    thumbTipToIndexMcp < palmScale * 0.42 ||
    dist(thumbTip, middleMcp) < palmScale * 0.42 ||
    !thumbExt;

  const fourFingersFolded = indexFld && middleFld && ringFld && pinkyFld;
  const fourFingersExt = indexExt && middleExt && ringExt && pinkyExt;

  const rawDetails = {
    indexExt,
    middleExt,
    ringExt,
    pinkyExt,
    thumbExt,
    palmScale
  };

  // 1. Thumbs Up & Thumbs Down (four fingers folded, thumb extended)
  if (fourFingersFolded && thumbExt) {
    const isUp =
      thumbTip.y < indexMcp.y - palmScale * 0.15 &&
      thumbTip.y < wrist.y - palmScale * 0.15;
    const isDown =
      thumbTip.y > indexMcp.y + palmScale * 0.15 &&
      thumbTip.y > wrist.y + palmScale * 0.15;

    if (isUp) {
      return { gesture: 'Thumbs Up', confidence: 0.95, rawDetails };
    }
    if (isDown) {
      return { gesture: 'Thumbs Down', confidence: 0.95, rawDetails };
    }
  }

  // 2. Stop: All fingers folded into a fist
  if (fourFingersFolded && (thumbFld || !thumbExt)) {
    return { gesture: 'Stop', confidence: 0.95, rawDetails };
  }

  // 3. Number 5: All five fingers extended
  if (fourFingersExt && thumbExt) {
    return { gesture: 'Number 5', confidence: 0.96, rawDetails };
  }

  // 4. Number 4: Four fingers extended, thumb folded
  if (fourFingersExt && (thumbFld || !thumbExt)) {
    return { gesture: 'Number 4', confidence: 0.94, rawDetails };
  }

  // 5. Number 3: Three fingers extended, remaining folded
  // Standard: index, middle, ring extended; pinky folded
  if (indexExt && middleExt && ringExt && pinkyFld && (thumbFld || !thumbExt)) {
    return { gesture: 'Number 3', confidence: 0.92, rawDetails };
  }
  // Alternate standard: thumb, index, middle extended; ring and pinky folded
  if (thumbExt && indexExt && middleExt && ringFld && pinkyFld) {
    return { gesture: 'Number 3', confidence: 0.88, rawDetails };
  }

  // 6. Number 2: Index and middle extended, ring and pinky folded
  // Prompt requirement: Number 2 should be the default interpretation of two extended fingers
  if (indexExt && middleExt && ringFld && pinkyFld) {
    return { gesture: 'Number 2', confidence: 0.95, rawDetails };
  }

  // 7. Number 1: Index finger extended, remaining fingers folded (with tolerance for thumb)
  if (indexExt && middleFld && ringFld && pinkyFld) {
    return { gesture: 'Number 1', confidence: 0.95, rawDetails };
  }

  // Ambiguous or unsupported gesture
  return { gesture: null, confidence: 0, reason: 'ambiguous', rawDetails };
}

/**
 * Temporal smoothing to eliminate frame flicker and false positives.
 * Requires consistent detection across consecutive frames before changing state.
 */
export class TemporalGestureSmoother {
  constructor({ requiredConfirmations = 3, resetThreshold = 3 } = {}) {
    this.requiredConfirmations = requiredConfirmations;
    this.resetThreshold = resetThreshold;
    this.currentGesture = null;
    this.candidateGesture = null;
    this.candidateStreak = 0;
    this.nullStreak = 0;
    this.confidence = 0;
  }

  processFrame(rawResult) {
    const rawGesture = rawResult?.gesture || null;
    const rawConfidence = rawResult?.confidence || 0;

    if (!rawGesture) {
      this.candidateGesture = null;
      this.candidateStreak = 0;
      this.nullStreak += 1;

      if (this.nullStreak >= this.resetThreshold) {
        this.currentGesture = null;
        this.confidence = 0;
      }
      return {
        gesture: this.currentGesture,
        confidence: this.currentGesture ? this.confidence : 0,
        isStable: this.currentGesture !== null
      };
    }

    this.nullStreak = 0;

    if (rawGesture === this.currentGesture) {
      this.candidateGesture = null;
      this.candidateStreak = 0;
      this.confidence = Math.max(this.confidence, rawConfidence);
      return {
        gesture: this.currentGesture,
        confidence: this.confidence,
        isStable: true
      };
    }

    if (rawGesture === this.candidateGesture) {
      this.candidateStreak += 1;
      if (this.candidateStreak >= this.requiredConfirmations) {
        this.currentGesture = this.candidateGesture;
        this.confidence = rawConfidence;
        this.candidateGesture = null;
        this.candidateStreak = 0;
      }
    } else {
      this.candidateGesture = rawGesture;
      this.candidateStreak = 1;
    }

    return {
      gesture: this.currentGesture,
      confidence: this.confidence,
      isStable: this.currentGesture !== null
    };
  }

  reset() {
    this.currentGesture = null;
    this.candidateGesture = null;
    this.candidateStreak = 0;
    this.nullStreak = 0;
    this.confidence = 0;
  }
}
