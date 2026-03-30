export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPreviousDateKey(dateKey) {
  const current = new Date(`${dateKey}T00:00:00`);
  current.setDate(current.getDate() - 1);
  return getLocalDateKey(current);
}

export function normalizeStreakState(streak, todayKey) {
  if (!streak.lastCompletedDate) {
    return streak;
  }

  if (streak.lastCompletedDate === todayKey || streak.lastCompletedDate === getPreviousDateKey(todayKey)) {
    return streak;
  }

  return {
    ...streak,
    current: 0,
  };
}
