export const ARCADE_STORAGE_KEYS = {
  audioEnabled: 'arcade-audio-enabled',
  achievements: 'arcade-achievement-state',
  streak: 'arcade-daily-streak',
  meteorHopBest: 'meteor-hop-best-score',
  signalTapBest: 'signal-tap-best-score',
  laneSprintBest: 'lane-sprint-best-score',
};

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function readNumberStorage(key, fallback = 0) {
  const storage = getStorage();
  if (!storage) return fallback;

  const raw = Number(storage.getItem(key) || String(fallback));
  return Number.isFinite(raw) ? raw : fallback;
}

export function writeNumberStorage(key, value) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, String(value));
}

export function readJsonStorage(key, fallback) {
  const storage = getStorage();
  if (!storage) return fallback;

  try {
    return JSON.parse(storage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(key, value) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

export function readBooleanFlagStorage(key, fallback = true) {
  const storage = getStorage();
  if (!storage) return fallback;
  const saved = storage.getItem(key);
  return saved === null ? fallback : saved !== '0';
}

export function writeBooleanFlagStorage(key, value) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, value ? '1' : '0');
}
