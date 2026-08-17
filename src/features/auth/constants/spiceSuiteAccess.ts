function readEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const DEFAULT_COACHING_SUITE_ACCESS = 'coaching';

/**
 * Suite access key required for the coaching dashboard
 * (`VITE_COACHING_SUITE_ACCESS`, case-insensitive; default `coaching`).
 */
export function getCoachingSuiteAccess(): string {
  return (
    readEnv('VITE_COACHING_SUITE_ACCESS') ?? DEFAULT_COACHING_SUITE_ACCESS
  ).toLowerCase();
}
