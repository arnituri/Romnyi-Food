export const CHEAT_DAY_SCHEDULES_STORAGE_KEY = "romnyi-food-cheat-day-schedules";
export const CHEAT_DAY_RESULTS_STORAGE_KEY = "romnyi-food-cheat-day-results";

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

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isValidDateKey(dateKey) {
  if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidMonthKey(monthKey) {
  return typeof monthKey === "string" && /^\d{4}-\d{2}$/.test(monthKey) && isValidDateKey(`${monthKey}-01`);
}

function isValidSchedule(monthKey, days) {
  if (!isValidMonthKey(monthKey) || !Array.isArray(days) || days.length !== 4) {
    return false;
  }

  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const uniqueDays = new Set(days);
  const uniqueWeeks = new Set(days.map((day) => getWeekKey(year, month - 1, day)));

  return (
    uniqueDays.size === 4 &&
    uniqueWeeks.size === 4 &&
    days.every((day) => Number.isInteger(day) && day >= 1 && day <= daysInMonth) &&
    !days.some((day, index) =>
      days.slice(index + 1).some((otherDay) => Math.abs(day - otherDay) === 1)
    )
  );
}

export function isValidCheatDayBackupData(cheatDay) {
  if (!isPlainObject(cheatDay)) {
    return false;
  }

  const { schedules, results } = cheatDay;

  if (
    (schedules !== null && !isPlainObject(schedules)) ||
    (results !== null && !isPlainObject(results))
  ) {
    return false;
  }

  if (schedules && !Object.entries(schedules).every(([monthKey, days]) => isValidSchedule(monthKey, days))) {
    return false;
  }

  if (!results) {
    return true;
  }

  return Object.entries(results).every(([dateKey, result]) => {
    if (!isValidDateKey(dateKey) || !isPlainObject(result)) {
      return false;
    }

    const { isWinner, segmentIndex, spunAt } = result;
    const monthKey = dateKey.slice(0, 7);
    const day = Number(dateKey.slice(-2));
    const schedule = schedules?.[monthKey];

    return (
      Array.isArray(schedule) &&
      typeof isWinner === "boolean" &&
      Number.isInteger(segmentIndex) &&
      (isWinner ? segmentIndex === 0 : segmentIndex >= 1 && segmentIndex <= 5) &&
      typeof spunAt === "string" &&
      !Number.isNaN(new Date(spunAt).getTime()) &&
      isWinner === schedule.includes(day)
    );
  });
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
  const schedules = readStorage(CHEAT_DAY_SCHEDULES_STORAGE_KEY);
  const monthKey = getMonthKey(date);

  if (Array.isArray(schedules[monthKey]) && schedules[monthKey].length === 4) {
    return schedules[monthKey];
  }

  const schedule = createMonthlySchedule(date.getFullYear(), date.getMonth());
  schedules[monthKey] = schedule;
  localStorage.setItem(CHEAT_DAY_SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));

  return schedule;
}

export function getTodayCheatDayResult(date = new Date()) {
  const results = readStorage(CHEAT_DAY_RESULTS_STORAGE_KEY);

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
  const results = readStorage(CHEAT_DAY_RESULTS_STORAGE_KEY);

  results[getDateKey(date)] = result;
  localStorage.setItem(CHEAT_DAY_RESULTS_STORAGE_KEY, JSON.stringify(results));

  return result;
}
