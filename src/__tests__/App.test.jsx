import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App, { SPLASH_FADE_DURATION, SPLASH_VISIBLE_DURATION } from '../App';
import SplashScreen from '../pages/SplashScreen';
import { THEME_STORAGE_KEY } from '../services/themeService';

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  vi.useRealTimers();
  if (originalMatchMedia) {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  } else {
    delete window.matchMedia;
  }
});

describe('application splash screen', () => {
  it('shows at startup, fades out after the configured duration, and does not return during navigation', () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByAltText('Romnyi Food')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(SPLASH_VISIBLE_DURATION));
    expect(screen.getByAltText('Romnyi Food').closest('.splash')).toHaveClass('splash-exiting');

    act(() => vi.advanceTimersByTime(SPLASH_FADE_DURATION));
    expect(screen.queryByAltText('Romnyi Food')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /receptek/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /receptek/i }));
    expect(screen.getByRole('heading', { name: 'Receptek' })).toBeInTheDocument();
    expect(screen.queryByAltText('Romnyi Food')).not.toBeInTheDocument();
  });

  it.each(['light', 'dark'])('selects the saved %s theme splash artwork immediately', (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    render(<SplashScreen />);

    expect(screen.getByAltText('Romnyi Food')).toHaveAttribute(
      'src',
      expect.stringContaining(`romnyi-food-splash-${theme}`)
    );
  });

  it('skips the fade wait when reduced motion is preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    act(() => vi.advanceTimersByTime(SPLASH_VISIBLE_DURATION));

    expect(screen.queryByAltText('Romnyi Food')).not.toBeInTheDocument();
  });
});
