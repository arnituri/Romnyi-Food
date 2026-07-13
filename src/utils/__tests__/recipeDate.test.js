import { describe, expect, it } from 'vitest';
import {
  isValidRecipeCreatedAt,
  parseStrictRecipeCreatedAt,
} from '../recipeDate';

describe('recipe createdAt validation', () => {
  it.each([
    '2026-02-28',
    '2024-02-29',
    '2026-07-13T12:00:00.000Z',
  ])('accepts valid calendar dates: %s', (createdAt) => {
    expect(isValidRecipeCreatedAt(createdAt)).toBe(true);
    expect(parseStrictRecipeCreatedAt(createdAt)).toBeInstanceOf(Date);
  });

  it.each([
    '2025-02-29',
    '2026-02-30',
    '2026-04-31',
    '',
    'not-a-date',
  ])('rejects invalid or missing calendar dates: %s', (createdAt) => {
    expect(isValidRecipeCreatedAt(createdAt)).toBe(false);
    expect(parseStrictRecipeCreatedAt(createdAt)).toBeNull();
  });
});
