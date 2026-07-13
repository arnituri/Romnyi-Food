import { describe, expect, it } from "vitest";
import { makeRecipe } from "../../test/setup";
import { getRecentRecipes } from "../../utils/recentRecipes";

describe("recent recipe statistics", () => {
  it("excludes recipes with null, missing, empty, or malformed creation dates", () => {
    const missingCreatedAt = makeRecipe({ id: "missing-date" });
    delete missingCreatedAt.createdAt;

    const recentRecipes = getRecentRecipes([
      makeRecipe({ id: "null-date", createdAt: null }),
      missingCreatedAt,
      makeRecipe({ id: "empty-date", createdAt: "" }),
      makeRecipe({ id: "invalid-date", createdAt: "not-a-date" }),
    ]);

    expect(recentRecipes).toEqual([]);
  });

  it("keeps valid creation dates and sorts recent recipes by newest first", () => {
    const recentRecipes = getRecentRecipes([
      makeRecipe({ id: "older", createdAt: "2026-07-10T12:00:00.000Z" }),
      makeRecipe({ id: "newer", createdAt: "2026-07-12T12:00:00.000Z" }),
    ]);

    expect(recentRecipes.map((recipe) => recipe.id)).toEqual(["newer", "older"]);
    expect(recentRecipes[0].createdDate).toBeInstanceOf(Date);
  });
});
