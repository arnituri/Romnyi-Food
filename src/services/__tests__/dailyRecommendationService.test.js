import { describe, expect, it } from 'vitest';
import { makeRecipe } from '../../test/setup';
import {
  DAILY_RECOMMENDATION_STORAGE_KEY,
  getDailyRecommendation,
} from '../dailyRecommendationService';
import { RECIPE_STORAGE_KEY } from '../recipeService';

function storeRecipes(recipes) {
  localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
}

describe('dailyRecommendationService', () => {
  it('keeps the same recommendation throughout a local calendar day', () => {
    storeRecipes([makeRecipe({ id: 'one' }), makeRecipe({ id: 'two' })]);
    const morning = new Date(2026, 6, 13, 9);
    const evening = new Date(2026, 6, 13, 22);

    expect(getDailyRecommendation(morning).id).toBe(getDailyRecommendation(evening).id);
  });

  it('selects a new persisted recommendation after the day changes', () => {
    storeRecipes([makeRecipe({ id: 'one' }), makeRecipe({ id: 'two' })]);
    const first = getDailyRecommendation(new Date(2026, 6, 13, 12));
    const second = getDailyRecommendation(new Date(2026, 6, 14, 12));

    expect(second.id).not.toBe(first.id);
    expect(JSON.parse(localStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY))).toMatchObject({ date: '2026-07-14', recipeId: second.id });
  });

  it('replaces a stale recommendation after the selected recipe is deleted', () => {
    storeRecipes([makeRecipe({ id: 'one' }), makeRecipe({ id: 'two' })]);
    localStorage.setItem(DAILY_RECOMMENDATION_STORAGE_KEY, JSON.stringify({ date: '2026-07-13', recipeId: 'deleted' }));

    const recommendation = getDailyRecommendation(new Date(2026, 6, 13, 12));

    expect(['one', 'two']).toContain(recommendation.id);
    expect(JSON.parse(localStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY)).recipeId).toBe(recommendation.id);
  });

  it('returns no recommendation and clears stale state when there are no recipes', () => {
    localStorage.setItem(DAILY_RECOMMENDATION_STORAGE_KEY, JSON.stringify({ date: '2026-07-13', recipeId: 'old' }));

    expect(getDailyRecommendation(new Date(2026, 6, 13, 12))).toBeNull();
    expect(localStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY)).toBeNull();
  });

  it('recovers safely from malformed persisted recommendation data', () => {
    storeRecipes([makeRecipe()]);
    localStorage.setItem(DAILY_RECOMMENDATION_STORAGE_KEY, '{broken');

    expect(getDailyRecommendation(new Date(2026, 6, 13, 12))).toMatchObject({ id: 'recipe-1' });
    expect(JSON.parse(localStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY))).toMatchObject({ date: '2026-07-13' });
  });
});
