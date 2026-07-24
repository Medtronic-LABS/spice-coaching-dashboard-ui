import { describe, expect, it } from 'vitest';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

function expectedDisplayDateTime(date: Date): string {
  const dateParts = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).formatToParts(date);

  const month = dateParts.find((part) => part.type === 'month')?.value ?? '';
  const day = dateParts.find((part) => part.type === 'day')?.value ?? '';
  const year = dateParts.find((part) => part.type === 'year')?.value ?? '';

  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

  return `${month} ${day} ${year} • ${time}`;
}

describe('formatDisplayDateTime', () => {
  it('formats ISO string as `Mon DD YYYY • h:mm:ss AM/PM` in local timezone', () => {
    const iso = '2026-06-01T11:27:29.877549Z';
    const date = new Date(iso);

    expect(formatDisplayDateTime(iso)).toBe(expectedDisplayDateTime(date));
  });

  it('returns em dash for empty values', () => {
    expect(formatDisplayDateTime(null)).toBe('—');
    expect(formatDisplayDateTime(undefined)).toBe('—');
    expect(formatDisplayDateTime('')).toBe('—');
  });

  it('returns the original value when parsing fails', () => {
    expect(formatDisplayDateTime('not-a-date')).toBe('not-a-date');
  });

  it('formats Python-style microsecond timestamps with numeric offsets', () => {
    const iso = '2026-07-21T12:45:13.192365+00:00';
    const date = new Date('2026-07-21T12:45:13.192+00:00');

    expect(formatDisplayDateTime(iso)).toBe(expectedDisplayDateTime(date));
  });
});
