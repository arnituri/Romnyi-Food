import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationProvider } from '../NotificationProvider';
import { useNotifications } from '../../hooks/useNotifications';
import Home from '../../pages/Home';

const originalMatchMedia = window.matchMedia;

function NotificationTrigger({ type = 'success', message = 'Sikeres művelet' }) {
  const notify = useNotifications();

  return (
    <button type="button" onClick={() => notify[type](message)}>
      Értesítés küldése
    </button>
  );
}

function renderNotifications(element) {
  return render(<NotificationProvider>{element}</NotificationProvider>);
}

afterEach(() => {
  vi.useRealTimers();

  if (originalMatchMedia) {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  } else {
    delete window.matchMedia;
  }
});

describe('NotificationProvider', () => {
  it('renders a success notification as a politely announced status and allows dismissal', () => {
    renderNotifications(<NotificationTrigger />);

    fireEvent.click(screen.getByRole('button', { name: 'Értesítés küldése' }));

    expect(screen.getByRole('status')).toHaveTextContent('Sikeres művelet');
    fireEvent.click(screen.getByRole('button', { name: 'Értesítés bezárása' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders errors with an assertive alert role', () => {
    renderNotifications(<NotificationTrigger type="error" message="A mentés nem sikerült." />);

    fireEvent.click(screen.getByRole('button', { name: 'Értesítés küldése' }));

    expect(screen.getByRole('alert')).toHaveTextContent('A mentés nem sikerült.');
  });

  it('automatically dismisses a notification after the default duration', () => {
    vi.useFakeTimers();
    renderNotifications(<NotificationTrigger />);

    fireEvent.click(screen.getByRole('button', { name: 'Értesítés küldése' }));
    act(() => vi.advanceTimersByTime(5000));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps notifications functional when reduced motion is preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    renderNotifications(<NotificationTrigger />);

    fireEvent.click(screen.getByRole('button', { name: 'Értesítés küldése' }));

    expect(screen.getByRole('status')).toHaveTextContent('Sikeres művelet');
    fireEvent.click(screen.getByRole('button', { name: 'Értesítés bezárása' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('uses the shared warning notification in the empty random-recipe flow', () => {
    render(
      <NotificationProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </NotificationProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /mit főzzünk ma/i }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Még nincs elmentett recept. Először adj hozzá egy újat!'
    );
  });
});
