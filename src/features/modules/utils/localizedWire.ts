import type {
  LocalizedOptions,
  LocalizedRichBody,
  LocalizedString,
} from '@/types/localized';
import { emptyLocalizedString } from '@/types/localized';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isLocalizedStringMap(value: unknown): value is LocalizedString {
  if (!isPlainObject(value)) return false;
  return Object.values(value).every((entry) => typeof entry === 'string');
}

export function parseLocalizedStringField(
  record: Record<string, unknown>,
  field: string,
  legacyBnField?: string,
  legacyEnField?: string,
): LocalizedString {
  const raw = record[field];
  if (isLocalizedStringMap(raw)) {
    return { ...raw };
  }
  if (typeof raw === 'string') {
    return { en: raw };
  }

  const result = emptyLocalizedString();
  if (legacyBnField && typeof record[legacyBnField] === 'string') {
    result.bn = record[legacyBnField];
  }
  if (legacyEnField && typeof record[legacyEnField] === 'string') {
    result.en = record[legacyEnField];
  }
  return result;
}

export function parseLocalizedRichBodyField(
  record: Record<string, unknown>,
  field: string,
  normalizeBody: (value: unknown) => unknown[],
  legacyBnField?: string,
  legacyEnField?: string,
): LocalizedRichBody {
  const raw = record[field];
  if (isPlainObject(raw)) {
    const entries = Object.entries(raw);
    if (
      entries.length > 0 &&
      entries.every(
        ([, value]) => Array.isArray(value) || typeof value === 'string',
      )
    ) {
      const body: LocalizedRichBody = {};
      for (const [locale, value] of entries) {
        body[locale] = normalizeBody(value) as LocalizedRichBody[string];
      }
      return body;
    }
  }

  const result: LocalizedRichBody = {};
  if (legacyBnField && record[legacyBnField] !== undefined) {
    result.bn = normalizeBody(
      record[legacyBnField],
    ) as LocalizedRichBody[string];
  }
  if (
    legacyEnField &&
    record[legacyEnField] !== undefined &&
    record[legacyEnField] !== null
  ) {
    result.en = normalizeBody(
      record[legacyEnField],
    ) as LocalizedRichBody[string];
  }
  return result;
}

export function parseLocalizedOptionsField(
  record: Record<string, unknown>,
  field: string,
  legacyBnField?: string,
  legacyEnField?: string,
): LocalizedOptions {
  const raw = record[field];
  if (isPlainObject(raw)) {
    const entries = Object.entries(raw);
    if (
      entries.length > 0 &&
      entries.every(([, value]) => Array.isArray(value))
    ) {
      const options: LocalizedOptions = {};
      for (const [locale, value] of entries) {
        options[locale] = value.filter(
          (entry): entry is string => typeof entry === 'string',
        );
      }
      return options;
    }
  }

  const result: LocalizedOptions = {};
  if (legacyBnField && Array.isArray(record[legacyBnField])) {
    result.bn = record[legacyBnField].filter(
      (entry): entry is string => typeof entry === 'string',
    );
  }
  if (legacyEnField && Array.isArray(record[legacyEnField])) {
    result.en = record[legacyEnField].filter(
      (entry): entry is string => typeof entry === 'string',
    );
  }
  return result;
}

export function serializeLocalizedString(
  value: LocalizedString | null | undefined,
): LocalizedString {
  if (!value) return {};
  const result: LocalizedString = {};
  for (const [locale, text] of Object.entries(value)) {
    if (typeof text === 'string') {
      result[locale] = text;
    }
  }
  return result;
}

export function serializeLocalizedRichBody(
  value: LocalizedRichBody | null | undefined,
): LocalizedRichBody {
  if (!value) return {};
  return { ...value };
}

export function serializeLocalizedOptions(
  value: LocalizedOptions | null | undefined,
): LocalizedOptions {
  if (!value) return {};
  const result: LocalizedOptions = {};
  for (const [locale, options] of Object.entries(value)) {
    result[locale] = options.filter(
      (entry): entry is string => typeof entry === 'string',
    );
  }
  return result;
}
