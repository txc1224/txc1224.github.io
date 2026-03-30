import test from 'node:test';
import assert from 'node:assert/strict';
import { getLaneChange } from '../docs/.vitepress/theme/utils/lane-sprint-state.mjs';

test('pressing beyond the left edge should not count as a lane change', () => {
  assert.deepEqual(getLaneChange(0, -1, 4), {
    lane: 0,
    changed: false,
  });
});

test('pressing within bounds should move to the next lane', () => {
  assert.deepEqual(getLaneChange(1, 2, 4), {
    lane: 2,
    changed: true,
  });
});
