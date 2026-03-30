export function createSignalTapTimers(timerApi = globalThis) {
  let roundTimer = 0;
  let missFlashTimer = 0;

  function clearRoundTimer() {
    timerApi.clearTimeout(roundTimer);
  }

  function clearMissFlashTimer() {
    timerApi.clearTimeout(missFlashTimer);
  }

  function scheduleMissFlashReset(callback, delay) {
    clearMissFlashTimer();
    missFlashTimer = timerApi.setTimeout(callback, delay);
  }

  function scheduleRound(callback, delay) {
    clearRoundTimer();
    roundTimer = timerApi.setTimeout(callback, delay);
  }

  function cancelAll() {
    clearRoundTimer();
    clearMissFlashTimer();
  }

  return {
    scheduleMissFlashReset,
    scheduleRound,
    cancelAll,
  };
}
