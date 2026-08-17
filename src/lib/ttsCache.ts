/**
 * Persistent Client-Side Audio Caching for Panda Droom TTS.
 *
 * Uses IndexedDB to store ElevenLabs audio Blobs locally in the user's browser,
 * indexed by a SHA-256 hash of (voiceId + modelId + normalized text).
 *
 * This ensures:
 * 1. 0 ElevenLabs API credits consumed for repeated questions.
 * 2. Instant playback without network delay.
 * 3. Offline availability for cached speech.
 */

const DB_NAME = 'panda-droom-tts-cache';
const STORE_NAME = 'audio_clips';
const DB_VERSION = 1;

export interface CachedAudioEntry {
  hash: string;
  text: string;
  voiceId: string;
  modelId: string;
  blob: Blob;
  createdAt: number;
}

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase | null> | null = null;

/**
 * Open (or create) the IndexedDB database instance.
 */
function getDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbOpenPromise) {
    return dbOpenPromise;
  }

  dbOpenPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        // Reset cached instance if database connection is closed unexpectedly
        dbInstance.onclose = () => {
          dbInstance = null;
          dbOpenPromise = null;
        };
        resolve(dbInstance);
      };

      request.onerror = (err) => {
        console.warn('[TTS Cache] Failed to open IndexedDB:', err);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('[TTS Cache] IndexedDB open blocked');
        resolve(null);
      };
    } catch (err) {
      console.warn('[TTS Cache] IndexedDB initialization error:', err);
      resolve(null);
    }
  });

  return dbOpenPromise;
}

/**
 * Generate a SHA-256 hash representing the voice, model, and normalized text.
 */
export async function computeAudioHash(
  text: string,
  voiceId: string,
  modelId: string
): Promise<string> {
  const cleanText = text.trim().replace(/\s+/g, ' ');
  const normalizedKey = `${voiceId}:${modelId}:${cleanText.toLowerCase()}`;

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalizedKey);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below if subtle crypto fails
    }
  }

  // Fallback hash implementation if Web Crypto is not available (e.g. non-secure local dev)
  let hash = 0;
  for (let i = 0; i < normalizedKey.length; i++) {
    const char = normalizedKey.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * Retrieve cached audio Blob from IndexedDB.
 */
export async function getCachedAudioBlob(hash: string): Promise<Blob | null> {
  const db = await getDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(hash);

      request.onsuccess = () => {
        const result = request.result as CachedAudioEntry | undefined;
        if (result && result.blob) {
          resolve(result.blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch (err) {
      console.warn('[TTS Cache] Read error:', err);
      resolve(null);
    }
  });
}

/**
 * Store an audio Blob in IndexedDB.
 */
export async function saveAudioBlobToCache(
  hash: string,
  text: string,
  voiceId: string,
  modelId: string,
  blob: Blob
): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const entry: CachedAudioEntry = {
        hash,
        text,
        voiceId,
        modelId,
        blob,
        createdAt: Date.now(),
      };

      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = (err) => {
        console.warn('[TTS Cache] Write error:', err);
        resolve();
      };
    } catch (err) {
      console.warn('[TTS Cache] Save error:', err);
      resolve();
    }
  });
}

/**
 * Optional helper to clear the audio cache.
 */
export async function clearAudioCache(): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
