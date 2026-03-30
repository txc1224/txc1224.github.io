import test from 'node:test';
import assert from 'node:assert/strict';
import { getRemainingRoundTime, getResumeRoundTime } from '../docs/.vitepress/theme/utils/signal-tap-round.mjs';

test('remaining round time is reduced by elapsed time', () => {
  assert.equal(getRemainingRoundTime(1800, 1500), 300);
});

test('remaining round time never goes negative', () => {
  assert.equal(getRemainingRoundTime(1800, 2000), 0);
});

test('resume uses saved remaining time when available', () => {
  assert.equal(getResumeRoundTime(240, 1200), 240);
});

test('resume falls back to full duration when no remaining time was saved', () => {
  assert.equal(getResumeRoundTime(0, 1200), 1200);
});
