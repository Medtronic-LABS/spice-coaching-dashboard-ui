import { describe, expect, it } from 'vitest';
import { hasCoachingSuiteAccess } from './hasCoachingSuiteAccess';

describe('hasCoachingSuiteAccess', () => {
  it('returns true when coaching is present in suiteAccess', () => {
    expect(hasCoachingSuiteAccess(['insights', 'admin', 'coaching'])).toBe(
      true,
    );
  });

  it('matches coaching case-insensitively', () => {
    expect(hasCoachingSuiteAccess(['COACHING'])).toBe(true);
  });

  it('returns false when coaching is missing or suiteAccess is invalid', () => {
    expect(hasCoachingSuiteAccess(['insights', 'admin'])).toBe(false);
    expect(hasCoachingSuiteAccess(null)).toBe(false);
    expect(hasCoachingSuiteAccess('coaching')).toBe(false);
  });
});
