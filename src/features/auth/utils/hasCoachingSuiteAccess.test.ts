import { describe, expect, it, vi } from 'vitest';
import { hasCoachingSuiteAccess } from './hasCoachingSuiteAccess';

describe('hasCoachingSuiteAccess', () => {
  it('returns true when coaching is present in suiteAccess', () => {
    vi.stubEnv('VITE_COACHING_SUITE_ACCESS', 'coaching');
    expect(hasCoachingSuiteAccess(['insights', 'admin', 'coaching'])).toBe(
      true,
    );
    vi.unstubAllEnvs();
  });

  it('matches coaching case-insensitively', () => {
    vi.stubEnv('VITE_COACHING_SUITE_ACCESS', 'coaching');
    expect(hasCoachingSuiteAccess(['COACHING'])).toBe(true);
    vi.unstubAllEnvs();
  });

  it('returns false when coaching is missing or suiteAccess is invalid', () => {
    vi.stubEnv('VITE_COACHING_SUITE_ACCESS', 'coaching');
    expect(hasCoachingSuiteAccess(['insights', 'admin'])).toBe(false);
    expect(hasCoachingSuiteAccess(null)).toBe(false);
    expect(hasCoachingSuiteAccess('coaching')).toBe(false);
    vi.unstubAllEnvs();
  });
});
