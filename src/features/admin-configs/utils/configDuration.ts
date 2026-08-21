import {
  capNumericDigits,
  maxDigitsForLimit,
  stripLeadingZeros,
} from '@/utils/digitLimitedInteger';

export const DURATION_VALIDATION_ERROR = 'Please enter a valid number of days.';
export const DURATION_MAX_DAYS = 365;
export const DURATION_MAX_DIGITS = maxDigitsForLimit(DURATION_MAX_DAYS);
export const DURATION_MAX_VALIDATION_ERROR = `Duration cannot exceed ${DURATION_MAX_DAYS} days.`;

export function parseConfigDurationDays(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    const days = Math.trunc(value);
    return days <= DURATION_MAX_DAYS ? days : null;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const days = Number(value);
    return days >= 1 && days <= DURATION_MAX_DAYS ? days : null;
  }

  return null;
}

export function formatConfigDurationValue(value: unknown): string {
  const days = parseConfigDurationDays(value);
  return days !== null ? String(days) : '';
}

export function isDurationDaysInput(value: string): boolean {
  return value === '' || /^\d+$/.test(value);
}

/** Controlled duration field text: digits only, at most 3, no leading zeros. */
export function parseDurationDaysInput(raw: string): string {
  return stripLeadingZeros(capNumericDigits(raw, DURATION_MAX_DIGITS));
}

export function getDurationValidationError(value: string): string | null {
  if (!isDurationDaysInput(value) || value === '') {
    return DURATION_VALIDATION_ERROR;
  }

  const days = Number(value);
  if (days < 1) {
    return DURATION_VALIDATION_ERROR;
  }

  if (days > DURATION_MAX_DAYS) {
    return DURATION_MAX_VALIDATION_ERROR;
  }

  return null;
}
