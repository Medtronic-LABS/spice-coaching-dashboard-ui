import { COACHING_SUITE_ACCESS } from '@/features/auth/constants/spiceSuiteAccess';

export function hasCoachingSuiteAccess(suiteAccess: unknown): boolean {
  if (!Array.isArray(suiteAccess)) return false;

  return suiteAccess.some(
    (entry) =>
      typeof entry === 'string' &&
      entry.trim().toLowerCase() === COACHING_SUITE_ACCESS,
  );
}
