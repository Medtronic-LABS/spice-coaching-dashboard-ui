import { getCoachingSuiteAccess } from '@/features/auth/constants/spiceSuiteAccess';

export function hasCoachingSuiteAccess(suiteAccess: unknown): boolean {
  if (!Array.isArray(suiteAccess)) return false;

  const required = getCoachingSuiteAccess();
  return suiteAccess.some(
    (entry) =>
      typeof entry === 'string' && entry.trim().toLowerCase() === required,
  );
}
