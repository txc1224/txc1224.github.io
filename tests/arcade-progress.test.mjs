import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLocalDateKey,
  getPreviousDateKey,
  normalizeStreakState,
} from '../docs/.vitepress/theme/utils/arcade-progress.mjs';

test('normalizeStreakState resets expired streaks after a missed day', () => {
  const streak = {
    current: 4,
    longest: 7,
    lastCompletedDate: '2026-03-27',
  };

  const normalized = normalizeStreakState(streak, '2026-03-30');

  assert.deepEqual(normalized, {
    current: 0,
    longest: 7,
    lastCompletedDate: '2026-03-27',
  });
});

test('normalizeStreakState keeps active streak if last completion was yesterday', () => {
  const streak = {
    current: 4,
    longest: 7,
    lastCompletedDate: '2026-03-29',
  };

  assert.deepEqual(normalizeStreakState(streak, '2026-03-30'), streak);
});

test('getPreviousDateKey follows local calendar days', () => {
  assert.equal(getPreviousDateKey('2026-03-01'), '2026-02-28');
});

test('getLocalDateKey uses local date parts instead of UTC serialization', () => {
  const localMidnightPlus = new Date(2026, 2, 30, 0, 30, 0);
  assert.equal(getLocalDateKey(localMidnightPlus), '2026-03-30');
});
