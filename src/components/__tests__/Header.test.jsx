import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Header from '../Header';

describe('Header', () => {
  it('uses Hungarian home wording and keeps navigation and settings accessible', () => {
    render(
      <MemoryRouter initialEntries={['/recipes']}>
        <Routes>
          <Route path="/recipes" element={<Header title="Receptek" />} />
          <Route path="/" element={<h1>Főoldal</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /főoldal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beállítások megnyitása' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /főoldal/i }));

    expect(screen.getByRole('heading', { name: 'Főoldal' })).toBeInTheDocument();
  });
});
