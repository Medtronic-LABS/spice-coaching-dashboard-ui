/**
 * Parses API timestamps, including Python-style microsecond fractions
 * (e.g. `2026-07-21T12:45:13.192365+00:00`) that `Date` rejects natively.
 */
function parseDisplayDateTime(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const normalized = trimmed.replace(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.)(\d{3})\d+(.*)$/,
    '$1$2$3',
  );
  if (normalized !== trimmed) {
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

/**
 * Formats an ISO timestamp in the user's local timezone, e.g. `Jul 21 2026 • 5:34:34 PM`.
 */
export function formatDisplayDateTime(
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }

  const date = parseDisplayDateTime(value);
  if (!date) {
    return value;
  }

  const dateParts = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).formatToParts(date);

  const month = dateParts.find((part) => part.type === 'month')?.value ?? '';
  const day = dateParts.find((part) => part.type === 'day')?.value ?? '';
  const year = dateParts.find((part) => part.type === 'year')?.value ?? '';

  if (!month || !day || !year) {
    return value;
  }

  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

  return `${month} ${day} ${year} • ${time}`;
}
