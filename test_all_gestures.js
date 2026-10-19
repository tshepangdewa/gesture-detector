// test_all_gestures.js
function dist(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
}

function classifyHand(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: null, confidence: 0, reason: 'insufficient_landmarks' };
  }

  const wrist = landmarks[0];
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

  const thumbTipToIndexMcp = dist(thumbTip, indexMcp);
  const thumbTipToMcp = dist(thumbTip, thumbMcp);
  const thumbIpToMcp = dist(thumbIp, thumbMcp);

  const thumbExt =
    thumbTipToIndexMcp > palmScale * 0.45 &&
    thumbTipToMcp > thumbIpToMcp * 1.15 &&
    dist(thumbTip, wrist) > dist(thumbMcp, wrist) * 1.05;

  const thumbFld =
    thumbTipToIndexMcp < palmScale * 0.42 ||
    dist(thumbTip, middleMcp) < palmScale * 0.42 ||
    !thumbExt;

  const fourFingersFolded = indexFld && middleFld && ringFld && pinkyFld;
  const fourFingersExt = indexExt && middleExt && ringExt && pinkyExt;

  // 1. Thumbs Up / Down
  if (fourFingersFolded && thumbExt) {
    const isUp =
      thumbTip.y < indexMcp.y - palmScale * 0.15 &&
      thumbTip.y < wrist.y - palmScale * 0.15;
    const isDown =
      thumbTip.y > indexMcp.y + palmScale * 0.15 &&
      thumbTip.y > wrist.y + palmScale * 0.15;

    if (isUp) return { gesture: 'Thumbs Up', confidence: 0.95 };
    if (isDown) return { gesture: 'Thumbs Down', confidence: 0.95 };
  }

  // 2. Stop: All fingers folded into a fist
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

  // 5. Number 3: Three fingers extended
  if (indexExt && middleExt && ringExt && pinkyFld && (thumbFld || !thumbExt)) {
    return { gesture: 'Number 3', confidence: 0.92 };
  }
  if (thumbExt && indexExt && middleExt && ringFld && pinkyFld) {
    return { gesture: 'Number 3', confidence: 0.88 };
  }

  // 6. Number 2: Index and middle extended, ring & pinky folded
  if (indexExt && middleExt && ringFld && pinkyFld) {
    return { gesture: 'Number 2', confidence: 0.95 };
  }

  // 7. Number 1: Index extended, remaining folded (with tolerance for thumb)
  if (indexExt && middleFld && ringFld && pinkyFld) {
    return { gesture: 'Number 1', confidence: 0.95 };
  }

  return { gesture: null, confidence: 0, reason: 'ambiguous' };
}

// Generate hand landmark helper
function createHandLandmarks({ thumbExtended, thumbDir = 'up', extendedFingers = [] }) {
  const lm = [];
  const wrist = { x: 0.5, y: 0.7, z: 0 };
  lm[0] = wrist;

  // Thumb
  lm[1] = { x: 0.44, y: 0.65, z: 0 };
  lm[2] = { x: 0.40, y: 0.60, z: 0 };
  if (thumbExtended) {
    if (thumbDir === 'up') {
      lm[3] = { x: 0.38, y: 0.50, z: 0 };
      lm[4] = { x: 0.36, y: 0.38, z: 0 }; // Thumb up
    } else if (thumbDir === 'down') {
      lm[3] = { x: 0.38, y: 0.75, z: 0 };
      lm[4] = { x: 0.36, y: 0.92, z: 0 }; // Thumb down
    } else {
      // Extended sideways (open hand)
      lm[3] = { x: 0.34, y: 0.55, z: 0 };
      lm[4] = { x: 0.28, y: 0.52, z: 0 };
    }
  } else {
    // Thumb folded across palm
    lm[3] = { x: 0.44, y: 0.56, z: 0 };
    lm[4] = { x: 0.48, y: 0.55, z: 0 }; // Folded against index/middle MCP
  }

  const fingerMcps = [
    { x: 0.46, y: 0.52 }, // Index MCP (5)
    { x: 0.50, y: 0.50 }, // Middle MCP (9)
    { x: 0.54, y: 0.52 }, // Ring MCP (13)
    { x: 0.58, y: 0.55 }  // Pinky MCP (17)
  ];

  for (let f = 0; f < 4; f++) {
    const isExt = extendedFingers.includes(f);
    const mcp = fingerMcps[f];
    const baseIdx = 5 + f * 4;
    lm[baseIdx] = { x: mcp.x, y: mcp.y, z: 0 };

    if (isExt) {
      // Extended upward
      lm[baseIdx + 1] = { x: mcp.x, y: mcp.y - 0.10, z: 0 };
      lm[baseIdx + 2] = { x: mcp.x, y: mcp.y - 0.18, z: 0 };
      lm[baseIdx + 3] = { x: mcp.x, y: mcp.y - 0.26, z: 0 };
    } else {
      // Curled / folded into palm
      lm[baseIdx + 1] = { x: mcp.x, y: mcp.y - 0.04, z: 0.04 };
      lm[baseIdx + 2] = { x: mcp.x, y: mcp.y + 0.02, z: 0.06 };
      lm[baseIdx + 3] = { x: mcp.x, y: mcp.y + 0.06, z: 0.04 };
    }
  }

  return lm;
}

const tests = [
  {
    name: 'Number 1',
    params: { thumbExtended: false, extendedFingers: [0] },
    expected: 'Number 1'
  },
  {
    name: 'Number 2',
    params: { thumbExtended: false, extendedFingers: [0, 1] },
    expected: 'Number 2'
  },
  {
    name: 'Number 3',
    params: { thumbExtended: false, extendedFingers: [0, 1, 2] },
    expected: 'Number 3'
  },
  {
    name: 'Number 4',
    params: { thumbExtended: false, extendedFingers: [0, 1, 2, 3] },
    expected: 'Number 4'
  },
  {
    name: 'Number 5',
    params: { thumbExtended: true, thumbDir: 'side', extendedFingers: [0, 1, 2, 3] },
    expected: 'Number 5'
  },
  {
    name: 'Thumbs Up',
    params: { thumbExtended: true, thumbDir: 'up', extendedFingers: [] },
    expected: 'Thumbs Up'
  },
  {
    name: 'Thumbs Down',
    params: { thumbExtended: true, thumbDir: 'down', extendedFingers: [] },
    expected: 'Thumbs Down'
  },
  {
    name: 'Stop (Fist)',
    params: { thumbExtended: false, extendedFingers: [] },
    expected: 'Stop'
  },
  {
    name: 'Ambiguous (Half-folded)',
    params: { thumbExtended: false, extendedFingers: [2] }, // only ring finger
    expected: null
  }
];

let allPassed = true;
for (const t of tests) {
  const lm = createHandLandmarks(t.params);
  const result = classifyHand(lm);
  const passed = result.gesture === t.expected;
  console.log(
    `[${passed ? 'PASS' : 'FAIL'}] ${t.name}: expected "${t.expected}", got "${result.gesture}"`
  );
  if (!passed) allPassed = false;
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\nAll 9 test cases passed successfully!');
}
