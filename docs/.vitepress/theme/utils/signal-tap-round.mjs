export function getRemainingRoundTime(deadline, now) {
  return Math.max(0, deadline - now);
}

export function getResumeRoundTime(savedRemaining, fallbackDuration) {
  return savedRemaining > 0 ? savedRemaining : fallbackDuration;
}
