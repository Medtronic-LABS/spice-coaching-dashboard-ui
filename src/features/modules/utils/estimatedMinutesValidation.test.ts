import { describe, expect, it } from 'vitest';
import {
  ESTIMATED_MINUTES_MAX_VALIDATION_ERROR,
  getEstimatedMinutesValidationError,
  MAX_ESTIMATED_MINUTES,
} from './estimatedMinutesValidation';

describe('getEstimatedMinutesValidationError', () => {
  it('accepts values within the signed 32-bit integer range', () => {
    expect(getEstimatedMinutesValidationError(0)).toBeNull();
    expect(getEstimatedMinutesValidationError(10)).toBeNull();
    expect(
      getEstimatedMinutesValidationError(MAX_ESTIMATED_MINUTES),
    ).toBeNull();
  });

  it('rejects values above the signed 32-bit integer max', () => {
    expect(getEstimatedMinutesValidationError(MAX_ESTIMATED_MINUTES + 1)).toBe(
      ESTIMATED_MINUTES_MAX_VALIDATION_ERROR,
    );
  });

  it('rejects non-finite values', () => {
    expect(getEstimatedMinutesValidationError(Number.NaN)).toBe(
      ESTIMATED_MINUTES_MAX_VALIDATION_ERROR,
    );
    expect(getEstimatedMinutesValidationError(Number.POSITIVE_INFINITY)).toBe(
      ESTIMATED_MINUTES_MAX_VALIDATION_ERROR,
    );
  });
});
