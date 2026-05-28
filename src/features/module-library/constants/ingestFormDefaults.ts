import type {
  IngestAssessmentMode,
  IngestBatchMode,
  IngestContentDomain,
  PrimaryLanguage,
} from '@/features/module-library/api/adminIngestApi';

/** UI defaults for admin ingest. */
export const INGEST_FORM_DEFAULTS = {
  authority_label: 'BRAC',
  primary_language: 'bn' as PrimaryLanguage,
  content_domain: 'clinical' as IngestContentDomain,
  assessment_mode: 'with_quiz' as IngestAssessmentMode,
  fuse_sources: false,
  mode: 'append' as IngestBatchMode,
} as const;
