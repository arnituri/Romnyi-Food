const SCHEDULES_STORAGE_KEY = "romnyi-food-cheat-day-schedules";
const RESULTS_STORAGE_KEY = "romnyi-food-cheat-day-results";

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function getDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function getMonthKey(date) {
  return getDateKey(date).slice(0, 7);
}

function getWeekKey(year, month, day) {
  const date = new Date(Date.UTC(year, month, day));
  const weekDay = date.getUTCDay() || 7;

  date.setUTCDate(date.getUTCDate() + 4 - weekDay);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);

  return `${date.getUTCFullYear()}-${week}`;
}

function createMonthlySchedule(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const targets = [0.13, 0.38, 0.63, 0.88].map((position) =>
    Math.max(1, Math.round(daysInMonth * position))
  );

  function chooseDays(targetIndex, selectedDays, usedWeeks) {
    if (targetIndex === targets.length) {
      return selectedDays;
    }

    const rankedCandidates = days
      .map((day) => ({
        day,
        score: Math.abs(day - targets[targetIndex]) + Math.random() * 0.35,
      }))
      .sort((first, second) => first.score - second.score);

    for (const { day } of rankedCandidates) {
      const weekKey = getWeekKey(year, month, day);
      const isConsecutive = selectedDays.some(
        (selectedDay) => Math.abs(selectedDay - day) === 1
      );

      if (usedWeeks.has(weekKey) || isConsecutive) {
        continue;
      }

      const schedule = chooseDays(
        targetIndex + 1,
        [...selectedDays, day],
        new Set([...usedWeeks, weekKey])
      );

      if (schedule) {
        return schedule;
      }
    }

    return null;
  }

  return chooseDays(0, [], new Set()).sort((first, second) => first - second);
}

export function getMonthlyWinningDays(date = new Date()) {
  const schedules = readStorage(SCHEDULES_STORAGE_KEY);
  const monthKey = getMonthKey(date);

  if (Array.isArray(schedules[monthKey]) && schedules[monthKey].length === 4) {
    return schedules[monthKey];
  }

  const schedule = createMonthlySchedule(date.getFullYear(), date.getMonth());
  schedules[monthKey] = schedule;
  localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));

  return schedule;
}

export function getTodayCheatDayResult(date = new Date()) {
  const results = readStorage(RESULTS_STORAGE_KEY);

  return results[getDateKey(date)] || null;
}

export function createTodayCheatDayResult(date = new Date()) {
  const savedResult = getTodayCheatDayResult(date);

  if (savedResult) {
    return savedResult;
  }

  const winningDays = getMonthlyWinningDays(date);
  const isWinner = winningDays.includes(date.getDate());
  const dateNumber = Number(getDateKey(date).replaceAll("-", ""));
  const result = {
    isWinner,
    segmentIndex: isWinner ? 0 : (dateNumber % 5) + 1,
    spunAt: date.toISOString(),
  };
  const results = readStorage(RESULTS_STORAGE_KEY);

  results[getDateKey(date)] = result;
  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(results));

  return result;
}
