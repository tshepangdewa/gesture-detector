# HandSight — Hand Gesture Detection Website

HandSight is a minimalist, high-precision web application that detects and recognizes hand gestures in real time using the user's webcam. Detection and classification run entirely client-side in the browser using the MediaPipe Hand Landmarker vision engine, providing instant feedback with zero server latency and absolute privacy.

---

## 1. Visual Identity & Design System

HandSight features a technical, monospace aesthetic inspired by high-precision lab instruments and classic architectural drafting:

- **Typography**: Ubuntu Mono (`font-weight: 400`, monospace fallback)
- **Palette**:
  - Primary Background: `#F6F3ED` (soft parchment/cream)
  - Primary Text & Controls: `#313851` (deep slate navy)
  - Secondary Surface: `#ECE7DE`
  - Border Accents: `#313851` (thin 1px solid borders)
- **Strict Geometric Restraint**:
  - Zero gradients
  - Zero glassmorphism
  - Zero glowing effects
  - Sharp corners (`border-radius: 0`) across all elements, buttons, inputs, and panels
  - High-contrast tactile hover states

---

## 2. Supported Gestures

HandSight classifies 21 MediaPipe hand landmarks into exactly **eight** distinct hand gestures using scale-invariant Euclidean geometry and relative angular vectors:

| Gesture | Category | Geometric Classification Rule |
| :--- | :--- | :--- |
| **Number 1** | Counting | Index finger extended. Middle, ring, and pinky folded into palm (with natural tolerance for thumb position). |
| **Number 2** | Counting | Index and middle fingers extended. Ring and pinky folded. Default interpretation for two extended fingers. |
| **Number 3** | Counting | Three fingers extended (index, middle, ring). Pinky folded. |
| **Number 4** | Counting | Four fingers extended (index, middle, ring, pinky). Thumb folded across the palm. |
| **Number 5** | Counting | All five fingers extended and spread outward. |
| **Thumbs Up** | Sign | Thumb pointing upward relative to the hand. Other four fingers folded into a fist. |
| **Thumbs Down** | Sign | Thumb pointing downward relative to the hand. Other four fingers folded into a fist. |
| **Stop** | Sign | All fingers and thumb folded into a closed fist. |

*Note: In accordance with project specifications, ambiguous hand poses are never guessed and will cleanly display "No gesture detected". Temporal smoothing across consecutive video frames prevents frame flicker.*

---

## 3. Architecture & MediaPipe Model Caching

### On-Demand Engine Initialization
- The MediaPipe model is **never** loaded on the homepage visit.
- Initialization only occurs when the user navigates to the detector and explicitly clicks **[Start Camera]**.

### Multi-Tiered IndexedDB Model Caching
1. **Cache Validation**: On initialization, `modelCache.js` checks the browser's IndexedDB (`HandSight_Model_Cache`) for `hand_landmarker_task_v1`.
2. **Integrity Check**: Verifies that the cached model is a valid `ArrayBuffer` meeting the minimum byte threshold (~7.8 MB). Corrupt or partial cache entries are purged automatically.
3. **Download on First Use**: If no cache entry exists, the model is fetched from the local production asset (`/models/hand_landmarker.task`) with an automatic fallback to Google's official MediaPipe Cloud Storage CDN.
4. **Persistent Storage**: The verified model buffer is saved into IndexedDB, enabling near-instantaneous subsequent launches with zero network overhead.

---

## 4. Privacy & Security

- **100% Client-Side Processing**: Camera frames are processed directly in GPU/CPU memory via WebAssembly and WebGL.
- **Zero Recording or Transmission**: Video streams are never recorded, cached to disk, or sent to any server.
- **Strict Permission Scoping**: Camera access is requested only when the user starts detection and is immediately terminated when detection is stopped or when navigating away.

---

## 5. Local Development

### Prerequisites
- Node.js (v18 or higher recommended; developed and tested on Node v22)
- npm (v9 or higher)

### Installation
```bash
git clone https://github.com/tshepangdewa/gesture-detector.git
cd gesture-detector
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running Unit & Gesture Logic Tests
```bash
node test_all_gestures.js
```

### Building for Production
```bash
npm run build
```
Production assets are generated in the `dist/` directory.

---

## 6. Vercel Deployment Instructions

HandSight is optimized for seamless zero-configuration deployment on [Vercel](https://vercel.com):

1. **Push to GitHub**:
   Ensure all repository changes are pushed to your remote repository.

2. **Import Project to Vercel**:
   - Log in to your Vercel Dashboard and click **"Add New Project"**.
   - Select your `gesture-detector` repository.

3. **Configure Build & Output Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **SPA Routing Configuration (`vercel.json`)**:
   The repository includes a root `vercel.json` file configuring rewrites so that direct links or refreshes to `/detector` route correctly to `index.html`:
   ```json
   {
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

5. **HTTPS Requirement for Webcam Access**:
   Browsers require a secure context (HTTPS) to allow `navigator.mediaDevices.getUserMedia`. Vercel automatically provisions SSL certificates for all deployments, guaranteeing camera access works in production out of the box.

---

## 7. Project File Structure

```
gesture-detector/
├── public/
│   ├── favicon.svg                 # Technical geometric SVG favicon
│   └── models/
│       └── hand_landmarker.task    # Offline-ready MediaPipe model asset (7.8 MB)
├── src/
│   ├── components/
│   │   ├── CameraView.jsx          # Live video feed, canvas overlay, stream lifecycle
│   │   ├── GestureResult.jsx       # Real-time gesture display & skeletal matrix
│   │   ├── Header.jsx              # Minimalist navigation & brand wordmark
│   │   └── Hero.jsx                # Homepage hero banner & CTA
│   ├── pages/
│   │   ├── Detector.jsx            # Detector layout (camera + result panel)
│   │   └── Home.jsx                # Homepage with pipeline & gesture catalog
│   ├── utils/
│   │   ├── gestureClassifier.js    # Geometric landmark classification & smoothing
│   │   ├── handDetection.js        # MediaPipe HandLandmarker lifecycle & drawing
│   │   └── modelCache.js           # IndexedDB model caching & fallback retrieval
│   ├── App.jsx                     # SPA router & application shell
│   ├── main.jsx                    # React entry point
│   └── styles.css                  # Minimalist monospace design system
├── index.html                      # HTML template with Ubuntu Mono webfont
├── package.json                    # Project dependencies and build scripts
├── test_all_gestures.js            # Classification test suite
├── vercel.json                     # Vercel SPA rewrites configuration
├── vite.config.js                  # Vite configuration
└── README.md                       # Documentation & deployment guide
```
