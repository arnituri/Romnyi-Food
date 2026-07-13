import { readStorageValue, setStorageValue } from "./storageService";

export const CHEAT_DAY_SCHEDULES_STORAGE_KEY = "romnyi-food-cheat-day-schedules";
export const CHEAT_DAY_RESULTS_STORAGE_KEY = "romnyi-food-cheat-day-results";

const WINNING_DAYS_PER_MONTH = 4;
const LOSING_SEGMENT_COUNT = 5;

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function readStorageObject(key) {
  try {
    const storedResult = readStorageValue(key);
    if (!storedResult.success) return {};
    const rawValue = storedResult.value;
    if (!rawValue) return {};

    const parsedValue = JSON.parse(rawValue);
    return isPlainObject(parsedValue) ? parsedValue : {};
  } catch {
    return {};
  }
}

function writeStorageObject(key, value) {
  return setStorageValue(key, JSON.stringify(value));
}

export function getLocalDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function getMonthKey(date = new Date()) {
  return getLocalDateKey(date).slice(0, 7);
}

function getMonthParts(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, month };
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getDateParts(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

function getDateKeyFromParts(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getCalendarDayNumber(dateKey) {
  const { year, month, day } = getDateParts(dateKey);
  const adjustedYear = month <= 2 ? year - 1 : year;
  const era = Math.floor(adjustedYear / 400);
  const yearOfEra = adjustedYear - era * 400;
  const adjustedMonth = month + (month > 2 ? -3 : 9);
  const dayOfYear = Math.floor((153 * adjustedMonth + 2) / 5) + day - 1;

  return era * 146097 + yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
}

function areConsecutiveDateKeys(firstDateKey, secondDateKey) {
  return Math.abs(getCalendarDayNumber(firstDateKey) - getCalendarDayNumber(secondDateKey)) === 1;
}

// ISO-8601 week: Monday is the first day of the week and the week containing
// Thursday determines the week-year. Dates are created at local noon to avoid
// daylight-saving transitions affecting calendar arithmetic.
export function getCalendarWeekKey(year, month, day) {
  const date = new Date(year, month - 1, day, 12);
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday + 3);

  const weekYear = date.getFullYear();
  const firstThursday = new Date(weekYear, 0, 4, 12);
  const firstWeekday = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstWeekday + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / 604800000);

  return `${weekYear}-${String(week).padStart(2, "0")}`;
}

export function isValidLocalDateKey(dateKey) {
  if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  const { year, month, day } = getDateParts(dateKey);
  return month >= 1 && month <= 12 && day >= 1 && day <= getDaysInMonth(year, month);
}

function isValidMonthKey(monthKey) {
  return typeof monthKey === "string" && /^\d{4}-\d{2}$/.test(monthKey) && isValidLocalDateKey(`${monthKey}-01`);
}

function getScheduleDateKeys(monthKey, days) {
  const { year, month } = getMonthParts(monthKey);
  return days.map((day) => getDateKeyFromParts(year, month, day));
}

function isValidSchedule(monthKey, days) {
  if (!isValidMonthKey(monthKey) || !Array.isArray(days) || days.length !== WINNING_DAYS_PER_MONTH) {
    return false;
  }

  const { year, month } = getMonthParts(monthKey);
  const daysInMonth = getDaysInMonth(year, month);
  const uniqueDays = new Set(days);

  if (uniqueDays.size !== WINNING_DAYS_PER_MONTH || !days.every((day) => Number.isInteger(day) && day >= 1 && day <= daysInMonth)) {
    return false;
  }

  const dateKeys = getScheduleDateKeys(monthKey, days);
  const weekKeys = new Set(days.map((day) => getCalendarWeekKey(year, month, day)));

  return weekKeys.size === WINNING_DAYS_PER_MONTH && !dateKeys.some((dateKey, index) =>
    dateKeys.slice(index + 1).some((otherDateKey) => areConsecutiveDateKeys(dateKey, otherDateKey))
  );
}

function getPreviousMonthKey(monthKey) {
  const { year, month } = getMonthParts(monthKey);
  return getMonthKey(new Date(year, month - 2, 1, 12));
}

function getNextMonthKey(monthKey) {
  const { year, month } = getMonthParts(monthKey);
  return getMonthKey(new Date(year, month, 1, 12));
}

function getCompatibleNeighborDateKeys(monthKey, schedules) {
  return [getPreviousMonthKey(monthKey), getNextMonthKey(monthKey)].flatMap((neighborMonthKey) => {
    const schedule = schedules[neighborMonthKey];
    return isValidSchedule(neighborMonthKey, schedule)
      ? getScheduleDateKeys(neighborMonthKey, schedule)
      : [];
  });
}

function isCompatibleWithNeighbors(monthKey, days, schedules) {
  if (!isValidSchedule(monthKey, days)) return false;

  const dateKeys = getScheduleDateKeys(monthKey, days);
  const neighborDateKeys = getCompatibleNeighborDateKeys(monthKey, schedules);

  return !dateKeys.some((dateKey) => {
    const { year, month, day } = getDateParts(dateKey);
    const weekKey = getCalendarWeekKey(year, month, day);

    return neighborDateKeys.some((neighborDateKey) => {
      const neighbor = getDateParts(neighborDateKey);
      return (
        areConsecutiveDateKeys(dateKey, neighborDateKey) ||
        weekKey === getCalendarWeekKey(neighbor.year, neighbor.month, neighbor.day)
      );
    });
  });
}

function getDeterministicRank(day, target, seed) {
  const mixed = Math.sin((day + 1) * 12.9898 + (seed + 1) * 78.233) * 43758.5453;
  return Math.abs(day - target) + (mixed - Math.floor(mixed)) * 0.35;
}

function createMonthlySchedule(year, month, schedules) {
  const monthKey = getDateKeyFromParts(year, month + 1, 1).slice(0, 7);
  const daysInMonth = getDaysInMonth(year, month + 1);
  const allDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const targets = [0.13, 0.38, 0.63, 0.88].map((position) => Math.max(1, Math.round(daysInMonth * position)));
  const neighborDateKeys = getCompatibleNeighborDateKeys(monthKey, schedules);
  const seed = year * 100 + month + 1;

  const canUseDay = (day, selectedDays) => {
    const dateKey = getDateKeyFromParts(year, month + 1, day);
    const weekKey = getCalendarWeekKey(year, month + 1, day);
    const selectedDateKeys = selectedDays.map((selectedDay) => getDateKeyFromParts(year, month + 1, selectedDay));

    return ![...selectedDateKeys, ...neighborDateKeys].some((otherDateKey) => {
      const other = getDateParts(otherDateKey);
      return (
        areConsecutiveDateKeys(dateKey, otherDateKey) ||
        weekKey === getCalendarWeekKey(other.year, other.month, other.day)
      );
    });
  };

  const search = (position, selectedDays) => {
    if (position === WINNING_DAYS_PER_MONTH) {
      return selectedDays;
    }

    const rankedDays = allDays
      .filter((day) => !selectedDays.includes(day) && canUseDay(day, selectedDays))
      .sort((first, second) => getDeterministicRank(first, targets[position], seed) - getDeterministicRank(second, targets[position], seed));

    for (const day of rankedDays) {
      const schedule = search(position + 1, [...selectedDays, day]);
      if (schedule) return schedule;
    }

    return null;
  };

  const schedule = search(0, []);
  if (schedule) return schedule.sort((first, second) => first - second);

  return null;
}

function getValidSchedulesFromStorage() {
  const schedules = readStorageObject(CHEAT_DAY_SCHEDULES_STORAGE_KEY);

  return Object.fromEntries(
    Object.entries(schedules).filter(([monthKey, days]) => isValidSchedule(monthKey, days))
  );
}

function isValidDailyResult(result, dateKey, schedule) {
  if (!isPlainObject(result) || !isValidLocalDateKey(dateKey) || !Array.isArray(schedule)) {
    return false;
  }

  const { isWinner, segmentIndex, spunAt } = result;
  const day = getDateParts(dateKey).day;

  return (
    typeof isWinner === "boolean" &&
    Number.isInteger(segmentIndex) &&
    (isWinner ? segmentIndex === 0 : segmentIndex >= 1 && segmentIndex <= LOSING_SEGMENT_COUNT) &&
    typeof spunAt === "string" &&
    !Number.isNaN(new Date(spunAt).getTime()) &&
    isWinner === schedule.includes(day)
  );
}

export function isValidCheatDayBackupData(cheatDay) {
  if (!isPlainObject(cheatDay)) return false;

  const { schedules, results } = cheatDay;
  if ((schedules !== null && !isPlainObject(schedules)) || (results !== null && !isPlainObject(results))) {
    return false;
  }

  if (schedules && !Object.entries(schedules).every(([monthKey, days]) => isValidSchedule(monthKey, days))) {
    return false;
  }

  if (schedules && !Object.entries(schedules).every(([monthKey, days]) => isCompatibleWithNeighbors(monthKey, days, schedules))) {
    return false;
  }

  if (!results) return true;

  return Object.entries(results).every(([dateKey, result]) => {
    const schedule = schedules?.[dateKey.slice(0, 7)];
    return isValidDailyResult(result, dateKey, schedule);
  });
}

export function getCheatDayBackupData() {
  const storedSchedules = getValidSchedulesFromStorage();
  const schedules = Object.fromEntries(
    Object.entries(storedSchedules).filter(([monthKey, days]) =>
      isCompatibleWithNeighbors(monthKey, days, storedSchedules)
    )
  );
  const storedResults = readStorageObject(CHEAT_DAY_RESULTS_STORAGE_KEY);
  const results = Object.fromEntries(
    Object.entries(storedResults).filter(([dateKey, result]) =>
      isValidDailyResult(result, dateKey, schedules[dateKey.slice(0, 7)])
    )
  );

  return { schedules, results };
}

export function getMonthlyWinningDays(date = new Date()) {
  const monthKey = getMonthKey(date);
  const schedules = getValidSchedulesFromStorage();
  const existingSchedule = schedules[monthKey];

  if (isCompatibleWithNeighbors(monthKey, existingSchedule, schedules)) {
    return existingSchedule;
  }

  let schedule = createMonthlySchedule(date.getFullYear(), date.getMonth(), schedules);

  if (!schedule) {
    // A persisted adjacent schedule can be structurally valid but incompatible
    // as a pair. Recover only the neighboring schedules needed to make a safe
    // current-month schedule, then generate it deterministically.
    delete schedules[getPreviousMonthKey(monthKey)];
    delete schedules[getNextMonthKey(monthKey)];
    schedule = createMonthlySchedule(date.getFullYear(), date.getMonth(), schedules);
  }

  if (!schedule) {
    schedule = [1, 8, 15, 22];
  }

  schedules[monthKey] = schedule;
  writeStorageObject(CHEAT_DAY_SCHEDULES_STORAGE_KEY, schedules);
  return schedule;
}

export function getTodayCheatDayResult(date = new Date()) {
  const dateKey = getLocalDateKey(date);
  const schedule = getMonthlyWinningDays(date);
  const results = readStorageObject(CHEAT_DAY_RESULTS_STORAGE_KEY);
  const result = results[dateKey];

  if (isValidDailyResult(result, dateKey, schedule)) {
    return result;
  }

  if (result !== undefined) {
    delete results[dateKey];
    writeStorageObject(CHEAT_DAY_RESULTS_STORAGE_KEY, results);
  }

  return null;
}

export function createTodayCheatDayResult(date = new Date()) {
  const savedResult = getTodayCheatDayResult(date);
  if (savedResult) return savedResult;

  const dateKey = getLocalDateKey(date);
  const winningDays = getMonthlyWinningDays(date);
  const isWinner = winningDays.includes(date.getDate());
  const dateNumber = Number(dateKey.replaceAll("-", ""));
  const result = {
    isWinner,
    segmentIndex: isWinner ? 0 : (dateNumber % LOSING_SEGMENT_COUNT) + 1,
    spunAt: new Date().toISOString(),
  };
  const results = readStorageObject(CHEAT_DAY_RESULTS_STORAGE_KEY);
  results[dateKey] = result;
  if (!writeStorageObject(CHEAT_DAY_RESULTS_STORAGE_KEY, results)) {
    return null;
  }

  return result;
}
