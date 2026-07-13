import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
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

  it('keeps the image picker keyboard-focusable and opens the file input from its button', () => {
    const { container } = renderAddRecipe();
    const pickerButton = screen.getByRole('button', { name: 'Receptkép kiválasztása' });
    const fileInput = container.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(fileInput, 'click');

    pickerButton.focus();
    expect(document.activeElement).toBe(pickerButton);

    fireEvent.click(pickerButton);
    expect(clickSpy).toHaveBeenCalledOnce();
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
