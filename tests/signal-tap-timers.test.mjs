import test from 'node:test';
import assert from 'node:assert/strict';
import { createSignalTapTimers } from '../docs/.vitepress/theme/utils/signal-tap-timers.mjs';

function createFakeTimers() {
  let now = 0;
  let nextId = 1;
  const queue = new Map();

  return {
    setTimeout(callback, delay) {
      const id = nextId++;
      queue.set(id, { callback, time: now + delay });
      return id;
    },
    clearTimeout(id) {
      queue.delete(id);
    },
    tick(ms) {
      now += ms;
      const ready = [...queue.entries()].filter(([, job]) => job.time <= now).sort((a, b) => a[1].time - b[1].time);

      for (const [id, job] of ready) {
        queue.delete(id);
        job.callback();
      }
    },
  };
}

test('scheduling the next round should not cancel miss flash reset', () => {
  const timers = createFakeTimers();
  const coordinator = createSignalTapTimers(timers);
  const events = [];

  coordinator.scheduleMissFlashReset(() => {
    events.push('flash-reset');
  }, 220);
  coordinator.scheduleRound(() => {
    events.push('next-round');
  }, 1200);

  timers.tick(220);

  assert.deepEqual(events, ['flash-reset']);
});
