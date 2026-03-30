import test from 'node:test';
import assert from 'node:assert/strict';
import { getMissPlan } from '../docs/.vitepress/theme/utils/signal-tap-state.mjs';

test('final miss should end the game without keeping a pending flash reset', () => {
  assert.deepEqual(getMissPlan(1), {
    nextLives: 0,
    shouldEndGame: true,
    shouldScheduleFlashReset: false,
  });
});

test('non-final miss should continue the game and schedule flash reset', () => {
  assert.deepEqual(getMissPlan(3), {
    nextLives: 2,
    shouldEndGame: false,
    shouldScheduleFlashReset: true,
  });
});
