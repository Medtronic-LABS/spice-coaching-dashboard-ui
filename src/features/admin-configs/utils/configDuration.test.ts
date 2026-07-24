import { describe, expect, it } from 'vitest';
import {
  DURATION_MAX_DAYS,
  DURATION_MAX_VALIDATION_ERROR,
  DURATION_VALIDATION_ERROR,
  formatConfigDurationValue,
  getDurationValidationError,
  isDurationDaysInput,
  parseConfigDurationDays,
} from './configDuration';

describe('parseConfigDurationDays', () => {
  it('accepts whole numbers between 1 and the max allowed days', () => {
    expect(parseConfigDurationDays(1)).toBe(1);
    expect(parseConfigDurationDays(30)).toBe(30);
    expect(parseConfigDurationDays('7')).toBe(7);
    expect(parseConfigDurationDays(3.9)).toBe(3);
    expect(parseConfigDurationDays(DURATION_MAX_DAYS)).toBe(DURATION_MAX_DAYS);
    expect(parseConfigDurationDays(String(DURATION_MAX_DAYS))).toBe(
      DURATION_MAX_DAYS,
    );
  });

  it('rejects values above the max allowed days', () => {
    expect(parseConfigDurationDays(DURATION_MAX_DAYS + 1)).toBeNull();
    expect(parseConfigDurationDays(String(DURATION_MAX_DAYS + 1))).toBeNull();
  });

  it('rejects zero, empty, and non-digit values including e', () => {
    expect(parseConfigDurationDays(0)).toBeNull();
    expect(parseConfigDurationDays('0')).toBeNull();
    expect(parseConfigDurationDays('00')).toBeNull();
    expect(parseConfigDurationDays('')).toBeNull();
    expect(parseConfigDurationDays('1e2')).toBeNull();
    expect(parseConfigDurationDays('e')).toBeNull();
    expect(parseConfigDurationDays('-3')).toBeNull();
    expect(parseConfigDurationDays(-1)).toBeNull();
    expect(parseConfigDurationDays('12.5')).toBeNull();
    expect(parseConfigDurationDays(null)).toBeNull();
  });
});

describe('formatConfigDurationValue', () => {
  it('formats valid days and returns empty for invalid values', () => {
    expect(formatConfigDurationValue(14)).toBe('14');
    expect(formatConfigDurationValue(0)).toBe('');
    expect(formatConfigDurationValue('1e2')).toBe('');
    expect(formatConfigDurationValue(DURATION_MAX_DAYS + 1)).toBe('');
  });
});

describe('isDurationDaysInput', () => {
  it('allows empty and digit-only strings', () => {
    expect(isDurationDaysInput('')).toBe(true);
    expect(isDurationDaysInput('0')).toBe(true);
    expect(isDurationDaysInput('30')).toBe(true);
  });

  it('rejects letters, decimals, and scientific notation', () => {
    expect(isDurationDaysInput('e')).toBe(false);
    expect(isDurationDaysInput('1e2')).toBe(false);
    expect(isDurationDaysInput('12.5')).toBe(false);
    expect(isDurationDaysInput('-1')).toBe(false);
  });
});

describe('getDurationValidationError', () => {
  it('returns the shared error for invalid values and null when valid', () => {
    expect(getDurationValidationError('')).toBe(DURATION_VALIDATION_ERROR);
    expect(getDurationValidationError('0')).toBe(DURATION_VALIDATION_ERROR);
    expect(getDurationValidationError('e')).toBe(DURATION_VALIDATION_ERROR);
    expect(getDurationValidationError('14')).toBeNull();
    expect(getDurationValidationError(String(DURATION_MAX_DAYS))).toBeNull();
  });

  it('returns the max error when the value exceeds the allowed days', () => {
    expect(getDurationValidationError(String(DURATION_MAX_DAYS + 1))).toBe(
      DURATION_MAX_VALIDATION_ERROR,
    );
  });
});
