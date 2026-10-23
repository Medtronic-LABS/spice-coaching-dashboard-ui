export function formatLocalDateInput(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayDateInputValue(now = new Date()): string {
  return formatLocalDateInput(now);
}

export function clampDateInputToToday(
  value: string,
  today = todayDateInputValue(),
): string {
  const trimmed = value.trim();
  if (!trimmed) return value;
  return trimmed > today ? today : trimmed;
}

export function dateRangeValidationMessage(
  dateFrom: string,
  dateTo: string,
  options?: { today?: string },
): string | null {
  const from = dateFrom.trim();
  const to = dateTo.trim();
  if (!from && !to) return null;
  if (!from || !to) return 'Both from and to dates are required.';
  if (from > to) return 'From date must be on or before to date.';
  const today = options?.today ?? todayDateInputValue();
  if (to > today) return 'To date cannot be in the future.';
  return null;
}

export function isDateRangeInvalid(
  dateFrom: string,
  dateTo: string,
  options?: { today?: string },
): boolean {
  return dateRangeValidationMessage(dateFrom, dateTo, options) !== null;
}
