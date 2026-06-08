import { describe, expect, it, vi } from 'vitest';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

describe('formatDisplayDateTime', () => {
  it('formats ISO string as month day year and time in local timezone', () => {
    const iso = '2026-06-01T11:27:29.877549Z';
    const date = new Date(iso);
    const result = formatDisplayDateTime(iso);

    const month = date.toLocaleString(undefined, { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    const time = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);

    expect(result).toBe(`${month} ${day} ${year}, ${time}`);
  });

  it('returns em dash for empty values', () => {
    expect(formatDisplayDateTime(null)).toBe('—');
    expect(formatDisplayDateTime(undefined)).toBe('—');
    expect(formatDisplayDateTime('')).toBe('—');
  });

  it('returns the original value when parsing fails', () => {
    expect(formatDisplayDateTime('not-a-date')).toBe('not-a-date');
  });

  it('returns the original value when date parts are incomplete', () => {
    const formatToPartsSpy = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'formatToParts')
      .mockReturnValue([{ type: 'month', value: 'June' }]);

    expect(formatDisplayDateTime('2026-06-01T11:27:29.877549Z')).toBe(
      '2026-06-01T11:27:29.877549Z',
    );

    formatToPartsSpy.mockRestore();
  });
});
