import type { RichBlock } from '@/features/modules/types/richText.types';

/** Locale code (ISO 639-1 / short BCP-47) → localized text. */
export type LocalizedString = Record<string, string>;

/** Locale code → list of option strings (quiz). */
export type LocalizedOptions = Record<string, string[]>;

/** Locale code → rich-text block list (card body). */
export type LocalizedRichBody = Record<string, RichBlock[]>;

export interface LocaleConfig {
  primary: string;
  supported: string[];
}

export function emptyLocalizedString(): LocalizedString {
  return {};
}

export function readLocaleText(
  loc: LocalizedString | null | undefined,
  locale: string,
  fallbackLocale?: string,
): string {
  if (!loc) return '';
  const primary = loc[locale]?.trim();
  if (primary) return primary;
  if (fallbackLocale) {
    const fallback = loc[fallbackLocale]?.trim();
    if (fallback) return fallback;
  }
  const first = Object.values(loc).find((v) => v?.trim());
  return first?.trim() ?? '';
}

export function setLocaleText(
  current: LocalizedString,
  locale: string,
  value: string,
): LocalizedString {
  return { ...current, [locale]: value };
}

export function patchLocaleField(
  current: LocalizedString,
  locale: string,
  value: string,
): LocalizedString {
  return setLocaleText(current, locale, value);
}

export function readLocaleRichBody(
  loc: LocalizedRichBody | null | undefined,
  locale: string,
  fallbackLocale?: string,
): RichBlock[] | undefined {
  if (!loc) return undefined;
  if (loc[locale]?.length) return loc[locale];
  if (fallbackLocale && loc[fallbackLocale]?.length) return loc[fallbackLocale];
  const first = Object.values(loc).find((blocks) => blocks?.length);
  return first;
}

export function setLocaleRichBody(
  current: LocalizedRichBody,
  locale: string,
  value: RichBlock[],
): LocalizedRichBody {
  return { ...current, [locale]: value };
}

export function readLocaleOptions(
  loc: LocalizedOptions | null | undefined,
  locale: string,
  fallbackLocale?: string,
): string[] {
  if (!loc) return [];
  const primary = loc[locale];
  if (primary?.length) return primary;
  if (fallbackLocale && loc[fallbackLocale]?.length) return loc[fallbackLocale];
  const first = Object.values(loc).find((opts) => opts?.length);
  return first ?? [];
}

export function setLocaleOptions(
  current: LocalizedOptions,
  locale: string,
  value: string[],
): LocalizedOptions {
  return { ...current, [locale]: value };
}
