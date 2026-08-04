import { describe, expect, it } from 'vitest';
import { formatEstimatedMinutesDisplay } from './formatEstimatedMinutesDisplay';

describe('formatEstimatedMinutesDisplay', () => {
  it('formats minutes only', () => {
    expect(formatEstimatedMinutesDisplay(0)).toBe('0 min');
    expect(formatEstimatedMinutesDisplay(45)).toBe('45 min');
  });

  it('formats hours and minutes', () => {
    expect(formatEstimatedMinutesDisplay(60)).toBe('1 hr');
    expect(formatEstimatedMinutesDisplay(90)).toBe('1 hr 30 min');
  });

  it('formats days, hours, and minutes', () => {
    expect(formatEstimatedMinutesDisplay(1440)).toBe('1 day');
    expect(formatEstimatedMinutesDisplay(1500)).toBe('1 day 1 hr');
    expect(formatEstimatedMinutesDisplay(1545)).toBe('1 day 1 hr 45 min');
    expect(formatEstimatedMinutesDisplay(2880)).toBe('2 days');
  });

  it('floors non-integer and treats invalid values as 0 min', () => {
    expect(formatEstimatedMinutesDisplay(90.9)).toBe('1 hr 30 min');
    expect(formatEstimatedMinutesDisplay(-10)).toBe('0 min');
    expect(formatEstimatedMinutesDisplay(Number.NaN)).toBe('0 min');
  });
});
