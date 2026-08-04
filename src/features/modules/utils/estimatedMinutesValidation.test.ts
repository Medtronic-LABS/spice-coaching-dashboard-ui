import { describe, expect, it } from 'vitest';
import {
  ESTIMATED_MINUTES_MAX_VALIDATION_ERROR,
  ESTIMATED_MINUTES_REQUIRED_ERROR,
  formatEstimatedMinutesFieldValue,
  getEstimatedMinutesValidationError,
  MAX_ESTIMATED_MINUTES,
  parseEstimatedMinutesInput,
} from './estimatedMinutesValidation';

describe('getEstimatedMinutesValidationError', () => {
  it('accepts values from 1 through the 60-minute limit', () => {
    expect(getEstimatedMinutesValidationError(1)).toBeNull();
    expect(getEstimatedMinutesValidationError(10)).toBeNull();
    expect(
      getEstimatedMinutesValidationError(MAX_ESTIMATED_MINUTES),
    ).toBeNull();
  });

  it('rejects zero and non-positive values as required', () => {
    expect(getEstimatedMinutesValidationError(0)).toBe(
      ESTIMATED_MINUTES_REQUIRED_ERROR,
    );
    expect(getEstimatedMinutesValidationError(-1)).toBe(
      ESTIMATED_MINUTES_REQUIRED_ERROR,
    );
  });

  it('rejects values above 60 minutes', () => {
    expect(getEstimatedMinutesValidationError(MAX_ESTIMATED_MINUTES + 1)).toBe(
      ESTIMATED_MINUTES_MAX_VALIDATION_ERROR,
    );
  });

  it('rejects non-finite values as required', () => {
    expect(getEstimatedMinutesValidationError(Number.NaN)).toBe(
      ESTIMATED_MINUTES_REQUIRED_ERROR,
    );
    expect(getEstimatedMinutesValidationError(Number.POSITIVE_INFINITY)).toBe(
      ESTIMATED_MINUTES_REQUIRED_ERROR,
    );
  });
});

describe('parseEstimatedMinutesInput', () => {
  it('strips leading zeros when a digit is typed after 0', () => {
    expect(parseEstimatedMinutesInput('01')).toBe(1);
    expect(parseEstimatedMinutesInput('02')).toBe(2);
    expect(parseEstimatedMinutesInput('010')).toBe(10);
  });

  it('treats empty input as 0', () => {
    expect(parseEstimatedMinutesInput('')).toBe(0);
    expect(parseEstimatedMinutesInput('   ')).toBe(0);
  });

  it('parses plain numeric values and ignores non-digits', () => {
    expect(parseEstimatedMinutesInput('5')).toBe(5);
    expect(parseEstimatedMinutesInput('60')).toBe(60);
    expect(parseEstimatedMinutesInput('6a0')).toBe(60);
  });
});

describe('formatEstimatedMinutesFieldValue', () => {
  it('renders the numeric value without leading zeros', () => {
    expect(formatEstimatedMinutesFieldValue(0)).toBe('0');
    expect(formatEstimatedMinutesFieldValue(2)).toBe('2');
    expect(formatEstimatedMinutesFieldValue(10)).toBe('10');
  });

  it('renders empty string for non-finite values', () => {
    expect(formatEstimatedMinutesFieldValue(Number.NaN)).toBe('');
  });
});
