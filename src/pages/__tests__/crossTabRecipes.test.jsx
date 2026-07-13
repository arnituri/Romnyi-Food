import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Favorites from '../Favorites';
import Recipes from '../Recipes';
import AddRecipe from '../AddRecipe';
import { RECIPE_STORAGE_KEY } from '../../services/recipeService';
import { makeRecipe } from '../../test/setup';
import { NotificationProvider } from '../../components/NotificationProvider';

function storeExternalRecipes(recipes) {
  act(() => {
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
    window.dispatchEvent(new StorageEvent('storage', { key: RECIPE_STORAGE_KEY }));
  });
}

function renderEditRecipe() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/edit/recipe-1']}>
        <Routes>
          <Route path="/edit/:id" element={<AddRecipe />} />
          <Route path="/recipe/:id" element={<h1>Legfrissebb recept</h1>} />
          <Route path="/recipes" element={<h1>Receptek</h1>} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  );
}

describe('cross-tab recipe updates', () => {
  it('refreshes the Recipes page after an external recipe storage change', () => {
    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Még nincs recept.')).toBeInTheDocument();

    storeExternalRecipes([makeRecipe({ name: 'Másik ablak receptje' })]);

    expect(screen.getByText('Másik ablak receptje')).toBeInTheDocument();
  });

  it('refreshes Favorites after an external favorite change', () => {
    localStorage.setItem(
      RECIPE_STORAGE_KEY,
      JSON.stringify([makeRecipe({ favorite: false })]),
    );

    render(
      <MemoryRouter>
        <Favorites />
      </MemoryRouter>,
    );

    expect(screen.getByText('❤️ Még nincs kedvenc recept.')).toBeInTheDocument();

    storeExternalRecipes([makeRecipe({ favorite: true, name: 'Külső kedvenc' })]);

    expect(screen.getByText('Külső kedvenc')).toBeInTheDocument();
  });

  it('saves an edit when no external change occurred', () => {
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify([makeRecipe()]));
    renderEditRecipe();

    fireEvent.change(screen.getByLabelText('Recept neve'), {
      target: { value: 'Saját módosítás' },
    });
    fireEvent.click(screen.getByRole('button', { name: /recept mentése/i }));

    expect(screen.getByRole('heading', { name: 'Legfrissebb recept' })).toBeInTheDocument();
  });

  it('blocks a stale edit and preserves the unsaved form values', () => {
    localStorage.setItem(
      RECIPE_STORAGE_KEY,
      JSON.stringify([makeRecipe({ updatedAt: '2026-07-13T12:00:00.000Z' })]),
    );
    renderEditRecipe();

    fireEvent.change(screen.getByLabelText('Recept neve'), {
      target: { value: 'Saját módosítás' },
    });
    storeExternalRecipes([
      makeRecipe({
        name: 'Másik ablak módosítása',
        updatedAt: '2026-07-13T13:00:00.000Z',
      }),
    ]);
    fireEvent.click(screen.getByRole('button', { name: /recept mentése/i }));

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Ez a recept időközben módosult egy másik ablakban.',
    );
    expect(screen.getByLabelText('Recept neve')).toHaveValue('Saját módosítás');
  });

  it('blocks an edit when the recipe was deleted externally without losing form data', () => {
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify([makeRecipe()]));
    renderEditRecipe();

    fireEvent.change(screen.getByLabelText('Recept neve'), {
      target: { value: 'Megőrzött módosítás' },
    });
    storeExternalRecipes([]);
    fireEvent.click(screen.getByRole('button', { name: /recept mentése/i }));

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'A receptet közben törölték egy másik ablakban.',
    );
    expect(screen.getByLabelText('Recept neve')).toHaveValue('Megőrzött módosítás');
  });
});
