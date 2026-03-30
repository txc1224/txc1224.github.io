import { getRemainingRoundTime } from './signal-tap-round.mjs';

export function getSignalTapPauseSnapshot({ status, roundDeadline, now }) {
  const wasRunning = status === 'running';

  return {
    wasRunning,
    roundRemaining: wasRunning ? getRemainingRoundTime(roundDeadline, now) : 0,
    flashMiss: false,
  };
}
