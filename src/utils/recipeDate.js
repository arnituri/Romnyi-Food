const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/;

export function parseStrictRecipeCreatedAt(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const createdAt = value.trim();
  const calendarMatch = createdAt.match(CALENDAR_DATE_PATTERN);

  if (!calendarMatch) {
    return null;
  }

  const [, yearText, monthText, dayText] = calendarMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  const parsedDate = new Date(createdAt);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function isValidRecipeCreatedAt(value) {
  return parseStrictRecipeCreatedAt(value) !== null;
}
