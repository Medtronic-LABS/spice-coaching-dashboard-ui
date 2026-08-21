import { describe, expect, it } from 'vitest';
import {
  capNumericDigits,
  maxDigitsForLimit,
  nextBoundedPageInput,
  parseCappedIntegerInput,
  stripLeadingZeros,
} from './digitLimitedInteger';

describe('maxDigitsForLimit', () => {
  it('uses the decimal length of the inclusive max', () => {
    expect(maxDigitsForLimit(7)).toBe(1);
    expect(maxDigitsForLimit(60)).toBe(2);
    expect(maxDigitsForLimit(365)).toBe(3);
    expect(maxDigitsForLimit(12)).toBe(2);
  });

  it('falls back to 1 for non-positive or non-finite maxima', () => {
    expect(maxDigitsForLimit(0)).toBe(1);
    expect(maxDigitsForLimit(-4)).toBe(1);
    expect(maxDigitsForLimit(Number.NaN)).toBe(1);
  });
});

describe('capNumericDigits', () => {
  it('strips non-digits and slices to the budget', () => {
    expect(capNumericDigits('9999', 3)).toBe('999');
    expect(capNumericDigits('6a01', 2)).toBe('60');
    expect(capNumericDigits('17', 1)).toBe('1');
    expect(capNumericDigits('abc', 2)).toBe('');
  });

  it('returns empty when the digit budget is invalid', () => {
    expect(capNumericDigits('12', 0)).toBe('');
    expect(capNumericDigits('12', -1)).toBe('');
    expect(capNumericDigits('12', Number.NaN)).toBe('');
  });
});

describe('stripLeadingZeros', () => {
  it('keeps a lone zero and strips zeros before other digits', () => {
    expect(stripLeadingZeros('0')).toBe('0');
    expect(stripLeadingZeros('02')).toBe('2');
    expect(stripLeadingZeros('010')).toBe('10');
  });
});

describe('parseCappedIntegerInput', () => {
  it('returns NaN for empty or non-digit input', () => {
    expect(parseCappedIntegerInput('', 2)).toBeNaN();
    expect(parseCappedIntegerInput('   ', 2)).toBeNaN();
    expect(parseCappedIntegerInput('abc', 2)).toBeNaN();
  });

  it('parses capped digits without leading zeros', () => {
    expect(parseCappedIntegerInput('05', 2)).toBe(5);
    expect(parseCappedIntegerInput('123', 2)).toBe(12);
  });
});

describe('nextBoundedPageInput', () => {
  it('allows clearing and in-range digits', () => {
    expect(nextBoundedPageInput('', 5)).toBe('');
    expect(nextBoundedPageInput('3', 5)).toBe('3');
  });

  it('caps extra digits then rejects values above max', () => {
    expect(nextBoundedPageInput('12', 5)).toBe('1');
    expect(nextBoundedPageInput('99', 5)).toBeNull();
    expect(nextBoundedPageInput('abc', 5)).toBeNull();
    expect(nextBoundedPageInput('0', 5)).toBeNull();
  });

  it('keeps two-digit pages when the table has them', () => {
    expect(nextBoundedPageInput('12', 20)).toBe('12');
    expect(nextBoundedPageInput('21', 20)).toBeNull();
  });

  it('treats a zero-page table as a single-digit budget', () => {
    expect(nextBoundedPageInput('1', 0)).toBe('1');
    expect(nextBoundedPageInput('12', 0)).toBe('1');
  });
});
