import type { LocalizedString } from '@/types/localized';
import { readLocaleText } from '@/types/localized';

const DEFAULT_PRIMARY_LOCALE = 'bn';

export const DEPLOYMENT_PRIMARY_LOCALE: string =
  import.meta.env.VITE_DEPLOYMENT_PRIMARY_LOCALE?.trim() ||
  DEFAULT_PRIMARY_LOCALE;

const SECONDARY_LOCALE = 'en';

export function resolveDisplayText(
  loc: LocalizedString | null | undefined,
  fallback = 'Untitled module',
): string {
  const text = readLocaleText(loc, DEPLOYMENT_PRIMARY_LOCALE, SECONDARY_LOCALE);
  return text || fallback;
}
