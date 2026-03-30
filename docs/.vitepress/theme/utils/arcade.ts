const SCORE_EVENT = 'arcade-score-update';
const AUDIO_EVENT = 'arcade-audio-change';
import { ARCADE_STORAGE_KEYS, readBooleanFlagStorage, writeBooleanFlagStorage } from './arcade-storage.mjs';

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;

  const AudioCtor =
    window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;

  if (!audioContext) {
    audioContext = new AudioCtor();
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  return audioContext;
}

export function dispatchArcadeScoreUpdate(game: string, storageKey: string, score: number) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(SCORE_EVENT, {
      detail: { game, score, storageKey },
    }),
  );
}

export function getArcadeAudioEnabled() {
  return readBooleanFlagStorage(ARCADE_STORAGE_KEYS.audioEnabled, true);
}

export function setArcadeAudioEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  writeBooleanFlagStorage(ARCADE_STORAGE_KEYS.audioEnabled, enabled);
  window.dispatchEvent(
    new CustomEvent(AUDIO_EVENT, {
      detail: { enabled },
    }),
  );
}

export function playArcadeTone(options: {
  frequency: number;
  duration?: number;
  gain?: number;
  type?: OscillatorType;
  sweepTo?: number;
}) {
  if (!getArcadeAudioEnabled()) return;
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = options.type ?? 'sine';
  oscillator.frequency.setValueAtTime(options.frequency, now);

  if (options.sweepTo) {
    oscillator.frequency.exponentialRampToValueAtTime(options.sweepTo, now + (options.duration ?? 0.18));
  }

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(options.gain ?? 0.05, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (options.duration ?? 0.18));

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + (options.duration ?? 0.18));
}

export { AUDIO_EVENT, SCORE_EVENT };
