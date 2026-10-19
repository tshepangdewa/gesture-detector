/**
 * modelCache.js
 * Handles IndexedDB persistence, validation, and retrieval of the MediaPipe Hand Landmarker model.
 */

const DB_NAME = 'HandSight_Model_Cache';
const DB_VERSION = 1;
const STORE_NAME = 'models';
const MODEL_CACHE_KEY = 'hand_landmarker_task_v1';
const MIN_EXPECTED_SIZE = 5_000_000; // ~5MB minimum threshold (actual model is ~7.8MB)

const PRIMARY_MODEL_URL = '/models/hand_landmarker.task';
const FALLBACK_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';

/**
 * Opens or upgrades the IndexedDB instance.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Validates an ArrayBuffer for model integrity.
 */
export function validateModelBuffer(buffer) {
  if (!buffer) return false;
  if (!(buffer instanceof ArrayBuffer)) return false;
  if (buffer.byteLength < MIN_EXPECTED_SIZE) return false;
  return true;
}

/**
 * Retrieves the cached model from IndexedDB.
 */
export async function getCachedModel() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(MODEL_CACHE_KEY);

      request.onsuccess = () => {
        const record = request.result;
        if (record && record.data && validateModelBuffer(record.data)) {
          resolve(record.data);
        } else {
          // If corrupted or empty, clean up
          if (record) {
            invalidateModelCache().catch(() => {});
          }
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Could not access IndexedDB for model cache:', err);
    return null;
  }
}

/**
 * Saves a validated ArrayBuffer to IndexedDB.
 */
export async function saveModelToCache(buffer) {
  if (!validateModelBuffer(buffer)) {
    console.warn('Skipping cache save: invalid model buffer');
    return false;
  }

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record = {
        key: MODEL_CACHE_KEY,
        version: '1.0.0',
        timestamp: Date.now(),
        size: buffer.byteLength,
        data: buffer
      };

      const request = store.put(record);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.warn('Error saving model to IndexedDB:', request.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('Could not save model to IndexedDB:', err);
    return false;
  }
}

/**
 * Invalidates and removes the cached model.
 */
export async function invalidateModelCache() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(MODEL_CACHE_KEY);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Downloads the model from network (primary with fallback).
 */
async function fetchModelFromNetwork(onProgress) {
  let response;
  let usedUrl = PRIMARY_MODEL_URL;

  try {
    onProgress?.('Fetching model from local asset...');
    response = await fetch(PRIMARY_MODEL_URL);
    if (!response.ok) {
      throw new Error(`Primary URL returned status ${response.status}`);
    }
  } catch (primaryErr) {
    console.warn('Primary model URL failed, trying remote CDN fallback:', primaryErr);
    usedUrl = FALLBACK_MODEL_URL;
    onProgress?.('Fetching model from CDN fallback...');
    response = await fetch(FALLBACK_MODEL_URL);
    if (!response.ok) {
      throw new Error(`Fallback model URL returned status ${response.status}`);
    }
  }

  onProgress?.('Receiving model data...');
  const buffer = await response.arrayBuffer();

  if (!validateModelBuffer(buffer)) {
    throw new Error(
      `Received invalid model data (${buffer?.byteLength || 0} bytes) from ${usedUrl}`
    );
  }

  return buffer;
}

/**
 * Main entry point: Loads model from IndexedDB cache or downloads it,
 * validates it, and saves to cache.
 */
export async function loadModelWithCache(onProgress) {
  onProgress?.('Checking model cache in browser storage...');
  const cachedBuffer = await getCachedModel();

  if (cachedBuffer) {
    onProgress?.('Model loaded from local storage cache');
    return {
      buffer: cachedBuffer,
      fromCache: true,
      size: cachedBuffer.byteLength
    };
  }

  onProgress?.('Model not in cache. Downloading hand detection model...');
  const freshBuffer = await fetchModelFromNetwork(onProgress);

  // Attempt to persist to IndexedDB asynchronously
  onProgress?.('Saving model to local cache for future visits...');
  await saveModelToCache(freshBuffer);

  return {
    buffer: freshBuffer,
    fromCache: false,
    size: freshBuffer.byteLength
  };
}
