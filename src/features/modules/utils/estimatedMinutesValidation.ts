import {
  maxDigitsForLimit,
  parseCappedIntegerInput,
} from '@/utils/digitLimitedInteger';

/** Maximum allowed estimated duration in minutes for create/edit fields. */
export const MAX_ESTIMATED_MINUTES = 60;

/** Users cannot enter more than two digits (the value cap is 60). */
export const MAX_ESTIMATED_MINUTES_DIGITS = maxDigitsForLimit(
  MAX_ESTIMATED_MINUTES,
);

export const ESTIMATED_MINUTES_REQUIRED_ERROR =
  'Estimated minutes are required.';

export const ESTIMATED_MINUTES_MAX_VALIDATION_ERROR =
  'Estimated minutes cannot exceed 60.';

export function getEstimatedMinutesValidationError(
  value: number,
): string | null {
  if (!Number.isFinite(value) || value <= 0) {
    return ESTIMATED_MINUTES_REQUIRED_ERROR;
  }

  if (value > MAX_ESTIMATED_MINUTES) {
    return ESTIMATED_MINUTES_MAX_VALIDATION_ERROR;
  }

  return null;
}

/**
 * Parse estimated-minutes input text, stripping non-digits, keeping at most
 * two digits, and stripping leading zeros (e.g. "02" → 2). Empty input becomes
 * 0 (required validation).
 */
export function parseEstimatedMinutesInput(raw: string): number {
  const parsed = parseCappedIntegerInput(raw, MAX_ESTIMATED_MINUTES_DIGITS);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Controlled field display value; always without leading zeros. */
export function formatEstimatedMinutesFieldValue(value: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  return String(value);
}
