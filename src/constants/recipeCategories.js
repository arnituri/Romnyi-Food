export const RECIPE_CATEGORIES = Object.freeze([
  { name: "Reggeli", icon: "🍳" },
  { name: "Tízórai", icon: "🥪" },
  { name: "Ebéd", icon: "🥘" },
  { name: "Uzsonna", icon: "☕" },
  { name: "Vacsora", icon: "🍝" },
  { name: "Saláta", icon: "🥗" },
  { name: "Desszert", icon: "🍰" },
  { name: "Ital", icon: "🥤" },
  { name: "Snack", icon: "🥜" },
]);

export const RECIPE_CATEGORY_NAMES = Object.freeze(
  RECIPE_CATEGORIES.map(({ name }) => name),
);

const categoryByNormalizedName = new Map(
  RECIPE_CATEGORY_NAMES.map((name) => [
    name.toLocaleLowerCase("hu-HU"),
    name,
  ]),
);

export function normalizeSupportedRecipeCategory(value) {
  if (typeof value !== "string") {
    return null;
  }

  return categoryByNormalizedName.get(value.trim().toLocaleLowerCase("hu-HU")) ?? null;
}

export function isSupportedRecipeCategory(value) {
  return normalizeSupportedRecipeCategory(value) !== null;
}

export function getCanonicalRecipeCategory(value) {
  if (typeof value !== "string") {
    return "";
  }

  return normalizeSupportedRecipeCategory(value) ?? value.trim();
}
