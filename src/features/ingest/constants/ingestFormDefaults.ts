import type {
  IngestAssessmentMode,
  IngestContentDomain,
} from '@/features/ingest/api/adminIngestApi';
import {
  maxDigitsForLimit,
  parseCappedIntegerInput,
} from '@/utils/digitLimitedInteger';

export const INGEST_MODULE_COUNT_MIN = 1;
export const INGEST_MODULE_COUNT_MAX = 7;
export const INGEST_MODULE_COUNT_MAX_DIGITS = maxDigitsForLimit(
  INGEST_MODULE_COUNT_MAX,
);

export const INGEST_MODULE_COUNT_RANGE_LABEL = `Enter a number from ${INGEST_MODULE_COUNT_MIN} to ${INGEST_MODULE_COUNT_MAX}.`;

/** Matches platform `ingestion_instructions_max_length` default. */
export const INGESTION_INSTRUCTIONS_MAX_LENGTH = 2000;

/** Matches platform sanitizer `_MAX_LINES`. */
export const INGESTION_INSTRUCTIONS_MAX_LINES = 50;

export const INGESTION_INSTRUCTIONS_LIMIT_LABEL = `Max ${INGESTION_INSTRUCTIONS_MAX_LENGTH} characters · ${INGESTION_INSTRUCTIONS_MAX_LINES} lines.`;

export type IngestModuleCountInput = number | '';

/** UI defaults for admin ingest. */
export const INGEST_FORM_DEFAULTS = {
  content_domain: 'clinical' as IngestContentDomain,
  assessment_mode: 'with_quiz' as IngestAssessmentMode,
  sync_published_visible: false,
  quizzes_per_module: '' as IngestModuleCountInput,
  cards_per_module: '' as IngestModuleCountInput,
} as const;

/** Line count aligned with platform sanitizer (`count("\\n") + 1`). */
export function countIngestionInstructionLines(value: string): number {
  if (value.length === 0) return 0;
  let lines = 1;
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) === 10) lines += 1;
  }
  return lines;
}

export function isIngestionInstructionsValid(value: string): boolean {
  if (value.length === 0) return true;
  if (value.length > INGESTION_INSTRUCTIONS_MAX_LENGTH) return false;
  return (
    countIngestionInstructionLines(value) <= INGESTION_INSTRUCTIONS_MAX_LINES
  );
}

export function isIngestModuleCountInRange(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= INGEST_MODULE_COUNT_MIN &&
    value <= INGEST_MODULE_COUNT_MAX
  );
}

export function isOptionalIngestModuleCountValid(
  value: IngestModuleCountInput,
): boolean {
  if (value === '') return true;
  return isIngestModuleCountInRange(value);
}

export function ingestModuleCountForPayload(
  value: IngestModuleCountInput,
): number | undefined {
  if (value === '' || !isIngestModuleCountInRange(value)) return undefined;
  return value;
}

/** Optional 1–7 count: empty stays empty; extra digits are dropped. */
export function parseOptionalIngestModuleCountInput(
  raw: string,
): IngestModuleCountInput {
  if (raw.trim() === '') {
    return '';
  }

  const parsed = parseCappedIntegerInput(raw, INGEST_MODULE_COUNT_MAX_DIGITS);
  return Number.isFinite(parsed) ? parsed : '';
}
