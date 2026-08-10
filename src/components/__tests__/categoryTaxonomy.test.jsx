import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RECIPE_CATEGORY_NAMES } from '../../constants/recipeCategories';
import AddRecipe from '../../pages/AddRecipe';
import Recipes from '../../pages/Recipes';
import { RECIPE_STORAGE_KEY } from '../../services/recipeService';
import { makeRecipe } from '../../test/setup';
import Categories from '../Categories';

describe('recipe category taxonomy', () => {
  it('uses every canonical category in both the recipe form and filter', () => {
    render(
      <MemoryRouter>
        <AddRecipe />
        <Categories />
      </MemoryRouter>,
    );

    const categorySelect = screen.getByLabelText('Kategória');
    const optionValues = Array.from(categorySelect.options)
      .map((option) => option.value)
      .filter(Boolean);

    expect(optionValues).toEqual(RECIPE_CATEGORY_NAMES);
    RECIPE_CATEGORY_NAMES.forEach((category) => {
      expect(screen.getByRole('button', { name: new RegExp(category, 'i') })).toBeInTheDocument();
    });
  });

  it('filters legacy category casing through the canonical category selection', () => {
    localStorage.setItem(
      RECIPE_STORAGE_KEY,
      JSON.stringify([
        makeRecipe({ id: 'tizorai', name: 'Tízórai recept', category: 'tízórai' }),
        makeRecipe({ id: 'ebed', name: 'Ebéd recept', category: 'Ebéd' }),
      ]),
    );

    render(
      <MemoryRouter initialEntries={['/recipes?category=T%C3%ADz%C3%B3rai']}>
        <Recipes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Tízórai recept')).toBeInTheDocument();
    expect(screen.queryByText('Ebéd recept')).not.toBeInTheDocument();
  });

  it('scrolls to the updated results only after a category selection', async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    localStorage.setItem(
      RECIPE_STORAGE_KEY,
      JSON.stringify([
        makeRecipe({ id: 'uzsonna', name: 'Uzsonna recept', category: 'Uzsonna' }),
        makeRecipe({ id: 'ebed', name: 'Ebéd recept', category: 'Ebéd' }),
      ]),
    );

    render(
      <MemoryRouter initialEntries={['/recipes']}>
        <Recipes />
      </MemoryRouter>,
    );

    expect(scrollIntoView).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Uzsonna/i }));

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });
});
