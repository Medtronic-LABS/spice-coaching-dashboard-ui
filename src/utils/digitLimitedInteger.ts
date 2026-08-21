/** Digit budget for a closed integer upper bound (e.g. 365 → 3). */
export function maxDigitsForLimit(max: number): number {
  if (!Number.isFinite(max) || max < 1) {
    return 1;
  }

  return String(Math.trunc(max)).length;
}

/** Keep only digits, then at most `maxDigits` of them. */
export function capNumericDigits(raw: string, maxDigits: number): string {
  const digits = raw.replace(/\D/g, '');
  if (!Number.isFinite(maxDigits) || maxDigits < 1) {
    return '';
  }

  return digits.slice(0, Math.trunc(maxDigits));
}

/** "02" → "2"; a lone "0" stays "0". */
export function stripLeadingZeros(digits: string): string {
  return digits.replace(/^0+(?=\d)/, '');
}

/**
 * Parse a bounded integer field. Empty input becomes NaN (caller may map that
 * to 0 or an empty optional). Extra digits past `maxDigits` are dropped.
 */
export function parseCappedIntegerInput(
  raw: string,
  maxDigits: number,
): number {
  const digits = stripLeadingZeros(capNumericDigits(raw, maxDigits));
  if (digits === '') {
    return Number.NaN;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/**
 * Next display text for a 1-based page jumper.
 * Empty means the field was cleared. `null` means ignore the keystroke.
 */
export function nextBoundedPageInput(
  raw: string,
  maxPage: number,
): string | null {
  if (raw === '') {
    return '';
  }

  const limit = Math.max(maxPage, 1);
  const parsed = parseCappedIntegerInput(raw, maxDigitsForLimit(limit));
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  if (maxPage > 0 && parsed > maxPage) {
    return null;
  }

  return String(parsed);
}
