export function hasNutritionValue(value) {
  if (value === "" || value === null || value === undefined) {
    return false;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0;
}
