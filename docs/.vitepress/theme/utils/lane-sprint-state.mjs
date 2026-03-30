export function getLaneChange(currentLane, nextLane, laneCount) {
  const clampedLane = Math.max(0, Math.min(laneCount - 1, nextLane));

  return {
    lane: clampedLane,
    changed: clampedLane !== currentLane,
  };
}
