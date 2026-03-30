import test from 'node:test';
import assert from 'node:assert/strict';
import { ARCADE_STORAGE_KEYS } from '../docs/.vitepress/theme/utils/arcade-storage.mjs';

test('arcade storage keys stay stable and explicit', () => {
  assert.deepEqual(ARCADE_STORAGE_KEYS, {
    audioEnabled: 'arcade-audio-enabled',
    achievements: 'arcade-achievement-state',
    streak: 'arcade-daily-streak',
    meteorHopBest: 'meteor-hop-best-score',
    signalTapBest: 'signal-tap-best-score',
    laneSprintBest: 'lane-sprint-best-score',
  });
});
