import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Header from '../../components/Header';
import AddRecipe from '../AddRecipe';

function renderAddRecipe() {
  return render(
    <MemoryRouter>
      <AddRecipe />
    </MemoryRouter>,
  );
}

describe('recipe form accessibility', () => {
  it('gives every recipe form control an accessible Hungarian name', () => {
    renderAddRecipe();

    [
      'Receptkép kiválasztása',
      'Recept neve',
      'Kategória',
      'Kalória',
      'Fehérje',
      'Zsír',
      'Szénhidrát',
      'Hozzávalók',
      'Elkészítés',
    ].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it('gives the header settings button an accessible name', () => {
    render(
      <MemoryRouter>
        <Header title="Teszt" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Beállítások megnyitása' })).toBeInTheDocument();
  });
});
