import { describe, expect, it, vi } from 'vitest';
import { getTestStorage, makeRecipe } from '../../test/setup';
import { RECIPE_CATEGORY_NAMES } from '../../constants/recipeCategories';
import {
  addRecipe,
  deleteRecipe,
  generateUniqueRecipeId,
  getRecipeById,
  getRecipes,
  RECIPE_RECOVERY_KEY_PREFIX,
  RECIPE_STORAGE_KEY,
  toggleFavorite,
  updateRecipe,
} from '../recipeService';

function storeRecipes(recipes) {
  localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
}

describe('recipeService', () => {
  it('loads valid saved recipes without changing their data', () => {
    const recipe = makeRecipe();
    storeRecipes([recipe]);

    expect(getRecipes()).toEqual([recipe]);
  });

  it('recovers from corrupted JSON and preserves the raw data separately', () => {
    localStorage.setItem(RECIPE_STORAGE_KEY, '{not valid json');

    expect(getRecipes()).toEqual([]);
    expect(localStorage.getItem(RECIPE_STORAGE_KEY)).toBe('[]');
    const recoveryKey = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .find((key) => key.startsWith(RECIPE_RECOVERY_KEY_PREFIX));
    expect(localStorage.getItem(recoveryKey)).toBe('{not valid json');
  });

  it('normalizes malformed records and discards non-record entries', () => {
    storeRecipes([null, 4, 'recipe', { id: null, name: 17, calories: -4, protein: 'bad' }]);

    expect(getRecipes()).toEqual([
      expect.objectContaining({
        id: 'recovered-4',
        name: '',
        calories: null,
        protein: null,
        category: '',
        favorite: false,
      }),
    ]);
  });

  it('keeps recipes with impossible legacy dates while removing the unusable date', () => {
    storeRecipes([makeRecipe({ createdAt: '2026-02-30T12:00:00.000Z' })]);

    expect(getRecipes()).toEqual([
      expect.objectContaining({ id: 'recipe-1', createdAt: null }),
    ]);

    expect(updateRecipe(makeRecipe({ name: 'Frissített recept', createdAt: null })))
      .toMatchObject({ success: true, recipe: { createdAt: null } });
  });

  it('adds a valid normalized recipe with a unique id', () => {
    const result = addRecipe({ ...makeRecipe({ id: undefined, name: '  Új recept  ' }) });

    expect(result.success).toBe(true);
    expect(result.recipe.name).toBe('Új recept');
    expect(result.recipe.id).toBeTruthy();
    expect(getRecipes()).toHaveLength(1);
  });

  it('accepts every supported category, including Tízórai and Uzsonna', () => {
    RECIPE_CATEGORY_NAMES.forEach((category, index) => {
      const result = addRecipe(
        makeRecipe({ id: undefined, name: `${category} recept`, category }),
      );

      expect(result).toMatchObject({ success: true, recipe: { category } });
      expect(result.recipe.id).toBeTruthy();
      expect(getRecipes()[index]).toMatchObject({ category });
    });
  });

  it('rejects unsupported categories for new recipes', () => {
    const result = addRecipe(makeRecipe({ category: 'Családi kedvenc' }));

    expect(result).toMatchObject({ success: false, error: 'INVALID_CATEGORY' });
    expect(getRecipes()).toEqual([]);
  });

  it('preserves an existing legacy category while updating its other fields', () => {
    storeRecipes([makeRecipe({ category: 'Családi kedvenc' })]);

    const result = updateRecipe(
      makeRecipe({ name: 'Frissített családi kedvenc', category: 'Családi kedvenc' }),
    );

    expect(result).toMatchObject({
      success: true,
      recipe: {
        name: 'Frissített családi kedvenc',
        category: 'Családi kedvenc',
      },
    });
    expect(getRecipes()).toEqual([
      expect.objectContaining({ category: 'Családi kedvenc' }),
    ]);
  });

  it('does not save invalid recipes', () => {
    const result = addRecipe(makeRecipe({ name: '   ', calories: -1 }));

    expect(result).toMatchObject({ success: false, error: 'MISSING_NAME' });
    expect(getRecipes()).toEqual([]);
  });

  it('creates collision-safe ids even when randomUUID repeats an existing id', () => {
    storeRecipes([makeRecipe({ id: 'existing-id' })]);
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('existing-id')
      .mockReturnValueOnce('new-id');

    expect(generateUniqueRecipeId()).toBe('new-id');
  });

  it('updates an existing recipe without creating a duplicate', () => {
    storeRecipes([makeRecipe()]);

    const result = updateRecipe(makeRecipe({ name: 'Frissített recept', favorite: true }));

    expect(result.success).toBe(true);
    expect(getRecipes()).toEqual([expect.objectContaining({ id: 'recipe-1', name: 'Frissített recept', favorite: false })]);
  });

  it('refuses to update a missing recipe', () => {
    const result = updateRecipe(makeRecipe({ id: 'missing' }));

    expect(result).toMatchObject({ success: false, error: 'MISSING_RECIPE' });
    expect(getRecipes()).toEqual([]);
  });

  it('deletes an existing recipe', () => {
    storeRecipes([makeRecipe()]);

    expect(deleteRecipe('recipe-1')).toMatchObject({ success: true, recipe: { id: 'recipe-1' } });
    expect(getRecipeById('recipe-1')).toBeUndefined();
  });

  it('toggles a favorite and persists the new state', () => {
    storeRecipes([makeRecipe()]);

    expect(toggleFavorite('recipe-1')).toMatchObject({ success: true, recipe: { favorite: true } });
    expect(getRecipeById('recipe-1')).toMatchObject({ favorite: true });
  });

  it('keeps the original data when deletion storage fails', () => {
    storeRecipes([makeRecipe()]);
    getTestStorage().failOnWrite(1);

    expect(deleteRecipe('recipe-1')).toMatchObject({ success: false, error: 'STORAGE_WRITE_FAILED' });
    expect(getRecipeById('recipe-1')).toMatchObject({ id: 'recipe-1' });
  });

  it('keeps the original favorite state when storage fails', () => {
    storeRecipes([makeRecipe()]);
    getTestStorage().failOnWrite(1);

    expect(toggleFavorite('recipe-1')).toMatchObject({ success: false, error: 'STORAGE_WRITE_FAILED' });
    expect(getRecipeById('recipe-1')).toMatchObject({ favorite: false });
  });
});
