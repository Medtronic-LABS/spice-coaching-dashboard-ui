/** Maximum value for a signed 32-bit integer backend field. */
export const MAX_ESTIMATED_MINUTES = 2_147_483_647;

export const ESTIMATED_MINUTES_MAX_VALIDATION_ERROR =
  'Estimated minutes cannot exceed 2,147,483,647.';

export function getEstimatedMinutesValidationError(
  value: number,
): string | null {
  if (!Number.isFinite(value)) {
    return ESTIMATED_MINUTES_MAX_VALIDATION_ERROR;
  }

  if (value > MAX_ESTIMATED_MINUTES) {
    return ESTIMATED_MINUTES_MAX_VALIDATION_ERROR;
  }

  return null;
}
