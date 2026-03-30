import test from 'node:test';
import assert from 'node:assert/strict';
import { getSignalTapPauseSnapshot } from '../docs/.vitepress/theme/utils/signal-tap-visibility.mjs';

test('pausing a running round preserves only remaining time and clears miss flash', () => {
  assert.deepEqual(
    getSignalTapPauseSnapshot({
      status: 'running',
      roundDeadline: 1800,
      now: 1500,
    }),
    {
      wasRunning: true,
      roundRemaining: 300,
      flashMiss: false,
    },
  );
});

test('pausing a non-running round clears timers without preserving time', () => {
  assert.deepEqual(
    getSignalTapPauseSnapshot({
      status: 'over',
      roundDeadline: 1800,
      now: 1500,
    }),
    {
      wasRunning: false,
      roundRemaining: 0,
      flashMiss: false,
    },
  );
});
