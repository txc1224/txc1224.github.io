export function getMissPlan(lives) {
  const nextLives = lives - 1;

  return {
    nextLives,
    shouldEndGame: nextLives <= 0,
    shouldScheduleFlashReset: nextLives > 0,
  };
}
