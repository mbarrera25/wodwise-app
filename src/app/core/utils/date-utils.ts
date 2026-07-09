// Date helpers that operate in the user's local timezone.
// `Date.prototype.toISOString()` converts to UTC, which shifts the calendar
// day for users west of UTC late at night; these helpers avoid that.

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parses a 'YYYY-MM-DD' string as local midnight. `new Date('YYYY-MM-DD')`
// would parse it as UTC midnight, shifting it to the previous local day
// in negative-offset timezones.
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}
