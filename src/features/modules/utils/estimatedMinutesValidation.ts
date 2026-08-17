/** Maximum allowed estimated duration in minutes for create/edit fields. */
export const MAX_ESTIMATED_MINUTES = 60;

/** Users cannot enter more than two digits (the value cap is 60). */
export const MAX_ESTIMATED_MINUTES_DIGITS = 2;

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
  const digits = raw.trim().replace(/\D/g, '');
  if (digits === '') {
    return 0;
  }

  const capped = digits.slice(0, MAX_ESTIMATED_MINUTES_DIGITS);
  const normalized = capped.replace(/^0+(?=\d)/, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** Controlled field display value; always without leading zeros. */
export function formatEstimatedMinutesFieldValue(value: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  return String(value);
}
