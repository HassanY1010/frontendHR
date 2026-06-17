const CACHE_KEY = 'face-api-models-v1';
const MODEL_FILES = [
  '/models/ssd_mobilenetv1_model-weights_manifest.json',
  '/models/ssd_mobilenetv1_model-shard1',
  '/models/ssd_mobilenetv1_model-shard2',
  '/models/face_landmark_68_model-weights_manifest.json',
  '/models/face_landmark_68_model-shard1',
  '/models/face_recognition_model-weights_manifest.json',
  '/models/face_recognition_model-shard1',
  '/models/face_recognition_model-shard2',
];

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_KEY, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('models')) {
        db.createObjectStore('models');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheModelFiles(): Promise<void> {
  const cache = await caches.open('face-api-models');
  for (const url of MODEL_FILES) {
    const cached = await cache.match(url);
    if (!cached) {
      const response = await fetch(url);
      if (response.ok) {
        cache.put(url, response.clone());
      }
    }
  }
}

export async function loadModelsFromCache(
  nets: Array<{ loadFromUri: (uri: string) => Promise<void> }>,
  uri: string
): Promise<boolean> {
  const cache = await caches.open('face-api-models');
  const allCached = await Promise.all(
    MODEL_FILES.map(url => cache.match(url).then(r => !!r))
  );
  if (allCached.every(Boolean)) {
    await Promise.all(nets.map(net => net.loadFromUri(uri)));
    return true;
  }
  return false;
}

export function isFaceVerified(): boolean {
  return localStorage.getItem('faceVerified') === 'true';
}

export function setFaceVerified(): void {
  localStorage.setItem('faceVerified', 'true');
}
