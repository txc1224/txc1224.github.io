import test from 'node:test';
import assert from 'node:assert/strict';
import { canMeteorHopJump } from '../docs/.vitepress/theme/utils/meteor-hop-state.mjs';

test('player can jump from the ground', () => {
  assert.equal(canMeteorHopJump(0, 0), true);
});

test('player cannot jump while still moving upward near the ground', () => {
  assert.equal(canMeteorHopJump(2, 120), false);
});

test('player can jump again only after descending back to the ground threshold', () => {
  assert.equal(canMeteorHopJump(4, -80), true);
});
