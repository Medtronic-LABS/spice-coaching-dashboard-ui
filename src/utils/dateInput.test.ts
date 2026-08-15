import { describe, expect, it } from 'vitest';
import {
  clampDateInputToToday,
  dateRangeValidationMessage,
  formatLocalDateInput,
  isDateRangeInvalid,
  todayDateInputValue,
} from '@/utils/dateInput';

describe('dateInput', () => {
  it('formats local calendar dates as YYYY-MM-DD', () => {
    expect(formatLocalDateInput(new Date(2026, 7, 15))).toBe('2026-08-15');
    expect(formatLocalDateInput(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('returns today from the provided clock', () => {
    expect(todayDateInputValue(new Date(2026, 7, 15))).toBe('2026-08-15');
  });

  it('clamps date input values after today', () => {
    expect(clampDateInputToToday('2026-08-16', '2026-08-15')).toBe(
      '2026-08-15',
    );
    expect(clampDateInputToToday('2026-08-15', '2026-08-15')).toBe(
      '2026-08-15',
    );
    expect(clampDateInputToToday('', '2026-08-15')).toBe('');
  });

  it('rejects a To date after today', () => {
    expect(
      dateRangeValidationMessage('2026-04-01', '2026-04-30', {
        today: '2026-04-15',
      }),
    ).toBe('To date cannot be in the future.');
    expect(
      isDateRangeInvalid('2026-04-01', '2026-04-30', { today: '2026-04-15' }),
    ).toBe(true);
    expect(
      dateRangeValidationMessage('2026-04-01', '2026-04-15', {
        today: '2026-04-15',
      }),
    ).toBeNull();
  });
});
