// test_gesture_logic.js - Unit test for gesture classification logic

function dist(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
}

function classifyHand(landmarks) {
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

  const palmScale = dist(wrist, middleMcp);
  if (palmScale < 0.01) {
    return { gesture: null, confidence: 0, reason: 'scale_too_small' };
  }

  // Helper for 4 main fingers
  function isExtended(mcp, pip, dip, tip) {
    const tipToWrist = dist(tip, wrist);
    const pipToWrist = dist(pip, wrist);
    const dipToWrist = dist(dip, wrist);
    const tipToMcp = dist(tip, mcp);
    const pipToMcp = dist(pip, mcp);

    const condition1 = tipToWrist > pipToWrist * 1.15;
    const condition2 = tipToWrist > dipToWrist * 1.05;
    const condition3 = tipToMcp > pipToMcp * 1.25;

    return condition1 && (condition2 || condition3);
  }

  function isFolded(mcp, pip, dip, tip) {
    const tipToWrist = dist(tip, wrist);
    const pipToWrist = dist(pip, wrist);
    const tipToMcp = dist(tip, mcp);
    const pipToMcp = dist(pip, mcp);

    // Tip curls back towards MCP/wrist
    const foldedToWrist = tipToWrist < pipToWrist * 1.1;
    const foldedToMcp = tipToMcp < pipToMcp * 1.15;
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
  // Thumb is extended when tip is far from index MCP and thumb MCP
  const thumbTipToIndexMcp = dist(thumbTip, indexMcp);
  const thumbTipToPinkyMcp = dist(thumbTip, pinkyMcp);
  const thumbTipToMcp = dist(thumbTip, thumbMcp);
  const thumbIpToMcp = dist(thumbIp, thumbMcp);

  const thumbExt =
    thumbTipToIndexMcp > palmScale * 0.42 &&
    thumbTipToMcp > thumbIpToMcp * 1.15 &&
    dist(thumbTip, wrist) > dist(thumbMcp, wrist) * 1.05;

  const thumbFld =
    thumbTipToIndexMcp < palmScale * 0.4 ||
    dist(thumbTip, middleMcp) < palmScale * 0.42 ||
    !thumbExt;

  const fourFingersFolded = indexFld && middleFld && ringFld && pinkyFld;
  const fourFingersExt = indexExt && middleExt && ringExt && pinkyExt;

  // 1. Thumbs Up & Thumbs Down (four fingers folded, thumb extended)
  if (fourFingersFolded && thumbExt) {
    const thumbUpCondition =
      thumbTip.y < indexMcp.y - palmScale * 0.15 &&
      thumbTip.y < wrist.y - palmScale * 0.15;
    const thumbDownCondition =
      thumbTip.y > indexMcp.y + palmScale * 0.15 &&
      thumbTip.y > wrist.y + palmScale * 0.15;

    if (thumbUpCondition) {
      return { gesture: 'Thumbs Up', confidence: 0.95 };
    }
    if (thumbDownCondition) {
      return { gesture: 'Thumbs Down', confidence: 0.95 };
    }
  }

  // 2. Stop: All fingers are folded into a fist
  if (fourFingersFolded && (thumbFld || !thumbExt)) {
    return { gesture: 'Stop', confidence: 0.95 };
  }

  // 3. Number 5: All five fingers extended
  if (fourFingersExt && thumbExt) {
    return { gesture: 'Number 5', confidence: 0.95 };
  }

  // 4. Number 4: Four fingers extended, thumb folded
  if (fourFingersExt && (thumbFld || !thumbExt)) {
    return { gesture: 'Number 4', confidence: 0.95 };
  }

  // 5. Number 3: Three fingers extended, remaining folded
  // Standard: index, middle, ring extended; pinky folded
  if (indexExt && middleExt && ringExt && pinkyFld && (thumbFld || !thumbExt)) {
    return { gesture: 'Number 3', confidence: 0.92 };
  }
  // Alternate: thumb, index, middle extended; ring and pinky folded
  if (thumbExt && indexExt && middleExt && ringFld && pinkyFld) {
    return { gesture: 'Number 3', confidence: 0.88 };
  }

  // 6. Number 2: Index and middle fingers extended, ring and pinky folded
  // Prompt: Number 2 should be the default interpretation of two extended fingers
  if (indexExt && middleExt && ringFld && pinkyFld) {
    return { gesture: 'Number 2', confidence: 0.95 };
  }

  // 7. Number 1: Index finger extended, remaining fingers folded (with tolerance for thumb)
  if (indexExt && middleFld && ringFld && pinkyFld) {
    return { gesture: 'Number 1', confidence: 0.95 };
  }

  return { gesture: null, confidence: 0, reason: 'ambiguous' };
}

// Quick validation test
console.log('Testing gesture classifier structure...');
const dummyWrist = { x: 0.5, y: 0.8, z: 0 };
const dummyHand = Array.from({ length: 21 }, (_, i) => ({ x: 0.5, y: 0.8 - i * 0.03, z: 0 }));
console.log('Dummy classification result:', classifyHand(dummyHand));
