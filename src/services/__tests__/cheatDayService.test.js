import { describe, expect, it } from 'vitest';
import {
  CHEAT_DAY_RESULTS_STORAGE_KEY,
  CHEAT_DAY_SCHEDULES_STORAGE_KEY,
  createTodayCheatDayResult,
  getCalendarWeekKey,
  getLocalDateKey,
  getMonthlyWinningDays,
  getTodayCheatDayResult,
} from '../cheatDayService';

function toDate(year, month, day) {
  return new Date(year, month - 1, day, 12);
}

describe('cheatDayService', () => {
  it('creates exactly four winning days for a month', () => {
    const days = getMonthlyWinningDays(toDate(2026, 7, 13));

    expect(days).toHaveLength(4);
    expect(new Set(days).size).toBe(4);
  });

  it('never schedules consecutive winning days or two days in the same ISO week', () => {
    const days = getMonthlyWinningDays(toDate(2026, 7, 13));
    const weekKeys = days.map((day) => getCalendarWeekKey(2026, 7, day));

    expect(new Set(weekKeys).size).toBe(4);
    expect(days.every((day, index) => index === 0 || day - days[index - 1] > 1)).toBe(true);
  });

  it('keeps a daily spin result stable after repeated reads', () => {
    const date = toDate(2026, 7, 13);
    const first = createTodayCheatDayResult(date);

    expect(createTodayCheatDayResult(date)).toEqual(first);
    expect(getTodayCheatDayResult(date)).toEqual(first);
  });

  it('uses local calendar date keys instead of UTC dates', () => {
    const localDate = new Date(2026, 6, 13, 0, 30);

    expect(getLocalDateKey(localDate)).toBe('2026-07-13');
  });

  it('generates and stores a valid fresh schedule after a month transition', () => {
    const july = getMonthlyWinningDays(toDate(2026, 7, 13));
    const august = getMonthlyWinningDays(toDate(2026, 8, 1));
    const storedSchedules = JSON.parse(localStorage.getItem(CHEAT_DAY_SCHEDULES_STORAGE_KEY));

    expect(july).toHaveLength(4);
    expect(august).toHaveLength(4);
    expect(storedSchedules).toHaveProperty('2026-07');
    expect(storedSchedules).toHaveProperty('2026-08');
  });

  it('recovers from malformed persisted schedules and results', () => {
    localStorage.setItem(CHEAT_DAY_SCHEDULES_STORAGE_KEY, '{bad');
    localStorage.setItem(CHEAT_DAY_RESULTS_STORAGE_KEY, JSON.stringify({ '2026-07-13': { isWinner: 'yes' } }));
    const date = toDate(2026, 7, 13);

    expect(getMonthlyWinningDays(date)).toHaveLength(4);
    expect(getTodayCheatDayResult(date)).toBeNull();
  });
});
