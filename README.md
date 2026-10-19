```
Gesture Detector is a website that recognizes hand gestures through your webcam. Everything runs inside your browser. No video is ever sent to a server, and there is no account or login.

How it works

When you open the Detector page and press Start Camera, the browser asks for permission to use your webcam. Once you allow it, the video plays on the page, mirrored so it feels like looking in a mirror.

A loop then runs many times every second. On each pass, the current video frame is given to a hand tracking model from Google called MediaPipe Hand Landmarker. The model finds your hand and returns 21 points on it, such as the wrist, the knuckles, the finger joints and the fingertips. Each point has an x, y and z position, so the hand is described in three dimensions.

These points are then passed to a classifier written for this project. It does not use machine learning. It uses simple geometry. It measures the distances between points and the angles between finger directions to decide which fingers are straight and which are folded. It also checks which way the thumb is pointing. The measurements are compared to the hand's own size, so the result does not change much whether your hand is close to or far from the camera. The pattern of open and closed fingers is matched against eight supported gestures, such as an open palm, thumbs up, thumbs down and a closed fist.

Camera frames are noisy, and a single bad frame could make the result flicker. To avoid this, the app looks at several recent frames and only changes the result when they agree. This is called temporal smoothing. The result is steady and easy to read.

The result is shown in the panel beside the camera. It displays the gesture name, a confidence percentage, and the status of the engine, the model cache and the camera. A list shows all supported gestures, and the one being detected is highlighted. You can also turn on an overlay that draws the 21 points and the lines between them on top of the video.

Model caching

The hand tracking model is a file of a few megabytes. The first time you use the app, it is loaded and saved in the browser's IndexedDB storage. On later visits it is read from there instead of downloaded again, so the app starts faster and can reuse the file without a new download.

Tech stack

The interface is built with React 18. The project is bundled and served during development by Vite. Hand tracking uses the MediaPipe Tasks Vision library, version 0.10.14, which runs the model in the browser using WebAssembly. The video is read through the standard browser camera API, and the overlay is drawn on an HTML canvas placed over the video. The styling is plain CSS with a monospace font from Google Fonts.

The site has two views, Home and Detector. They are switched with a small piece of code that uses the browser history, so the address bar and back button still work. No routing library is needed.

There is no backend, no database and no API. The whole project is static files, which keeps it simple and private.

Hosting

Because the site is only static files, it can be hosted almost anywhere. The project is set up for Vercel, which can build it straight from a Git repository. Running the build command creates a dist folder, and Vercel serves that folder over HTTPS. HTTPS matters here, because browsers only allow camera access on secure pages, with localhost as the one exception during development. Any other static host, such as Netlify or GitHub Pages, would also work with the same build output.

Running it yourself

Install the dependencies with npm install, start the development server with npm run dev, and create the production build with npm run build.

Limits

Accuracy depends on good lighting and on showing one hand clearly to the camera. Because the rules are hand-written, the app only knows the eight gestures it was built for. Adding a new gesture means writing a new rule in the classifier file.


Project File Structure


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
