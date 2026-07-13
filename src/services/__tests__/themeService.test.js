import { describe, expect, it, vi } from 'vitest';
import { getTestStorage } from '../../test/setup';
import {
  applyTheme,
  getTheme,
  resetTheme,
  THEME_STORAGE_KEY,
} from '../themeService';

describe('themeService', () => {
  it.each(['light', 'dark'])('loads a valid stored %s theme', (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    expect(getTheme()).toBe(theme);
  });

  it('falls back to dark for an invalid stored theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'violet');

    expect(getTheme()).toBe('dark');
  });

  it('falls back safely when storage reading fails', () => {
    vi.spyOn(getTestStorage(), 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    expect(getTheme()).toBe('dark');
  });

  it('applies the theme even when persistence fails and safely resets it', () => {
    getTestStorage().failOnWrite(1);

    expect(applyTheme('light')).toBe(false);
    expect(document.documentElement.dataset.theme).toBe('light');

    getTestStorage().failOnWrite(1);
    expect(resetTheme()).toBe(false);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
