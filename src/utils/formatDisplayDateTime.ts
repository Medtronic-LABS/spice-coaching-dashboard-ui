/**
 * Formats an ISO timestamp in the user's local timezone, e.g. `June 1 2026, 4:57 pm`.
 */
export function formatDisplayDateTime(
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const dateParts = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(date);

  const day = dateParts.find((part) => part.type === 'day')?.value ?? '';
  const month = dateParts.find((part) => part.type === 'month')?.value ?? '';
  const year = dateParts.find((part) => part.type === 'year')?.value ?? '';

  if (!day || !month || !year) {
    return value;
  }

  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return `${month} ${day} ${year}, ${time}`;
}
