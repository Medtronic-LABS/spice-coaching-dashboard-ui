import type {
  IngestAssessmentMode,
  IngestBatchMode,
  IngestContentDomain,
} from '@/features/ingest/api/adminIngestApi';

export const INGEST_MODULE_COUNT_MIN = 3;
export const INGEST_MODULE_COUNT_MAX = 7;

export const INGEST_MODULE_COUNT_RANGE_LABEL = `Enter a number from ${INGEST_MODULE_COUNT_MIN} to ${INGEST_MODULE_COUNT_MAX}.`;

export type IngestModuleCountInput = number | '';

/** UI defaults for admin ingest. */
export const INGEST_FORM_DEFAULTS = {
  content_domain: 'clinical' as IngestContentDomain,
  assessment_mode: 'with_quiz' as IngestAssessmentMode,
  fuse_sources: false,
  sync_published_visible: false,
  quizzes_per_module: '' as IngestModuleCountInput,
  cards_per_module: '' as IngestModuleCountInput,
  mode: 'append' as IngestBatchMode,
} as const;

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
