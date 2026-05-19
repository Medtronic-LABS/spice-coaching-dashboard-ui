import type { PrimaryLanguage } from '@/features/module-library/api/adminIngestApi';

/** Temporary fixed ingest metadata until the upload form collects these fields. */
export const INGEST_FORM_DEFAULTS = {
  title: 'title',
  authority_kind: 'official_training',
  authority_label: 'BRAC',
  primary_language: 'bn' as PrimaryLanguage,
} as const;
