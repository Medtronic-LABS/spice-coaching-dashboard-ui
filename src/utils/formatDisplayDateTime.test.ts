import { describe, expect, it } from 'vitest';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayDateTimeMultiline,
} from '@/utils/formatDisplayDateTime';

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

describe('formatDisplayDateTimeMultiline', () => {
  it('breaks before the bullet so date and time are on separate lines', () => {
    const iso = '2026-06-01T11:27:29.877549Z';
    const singleLine = formatDisplayDateTime(iso);
    const expected = singleLine.replace(' • ', '\n• ');

    expect(formatDisplayDateTimeMultiline(iso)).toBe(expected);
    expect(formatDisplayDateTimeMultiline(iso)).toContain('\n• ');
  });

  it('returns em dash for empty values without inserting a break', () => {
    expect(formatDisplayDateTimeMultiline(null)).toBe('—');
  });
});

describe('formatDisplayDate', () => {
  it('formats ISO date-only strings', () => {
    const date = new Date('2026-08-01T00:00:00');
    const expected = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

    expect(formatDisplayDate('2026-08-01')).toBe(expected);
  });

  it('returns em dash for empty values', () => {
    expect(formatDisplayDate(null)).toBe('—');
    expect(formatDisplayDate(undefined)).toBe('—');
    expect(formatDisplayDate('')).toBe('—');
  });
});
