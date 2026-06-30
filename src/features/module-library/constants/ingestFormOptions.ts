import type { SelectOption } from '@/components/ui';
import type {
  IngestAssessmentMode,
  IngestContentDomain,
  PrimaryLanguage,
} from '@/features/module-library/api/adminIngestApi';

function ingestOption(label: string, value: string): SelectOption {
  return { label, value };
}

export const INGEST_ASSESSMENT_MODE_OPTIONS: SelectOption[] = [
  ingestOption('With quiz', 'with_quiz' satisfies IngestAssessmentMode),
  ingestOption('Content only', 'read_only' satisfies IngestAssessmentMode),
];

export const INGEST_CONTENT_DOMAIN_OPTIONS: SelectOption[] = [
  ingestOption('Digital', 'digital' satisfies IngestContentDomain),
  ingestOption('Clinical', 'clinical' satisfies IngestContentDomain),
  ingestOption(
    'Clinical with app action',
    'clinical_with_app_action' satisfies IngestContentDomain,
  ),
  ingestOption(
    'Supervisor update',
    'supervisor_update' satisfies IngestContentDomain,
  ),
];

export const INGEST_PRIMARY_LANGUAGE_OPTIONS: SelectOption[] = [
  ingestOption('Bengali', 'bn' satisfies PrimaryLanguage),
  ingestOption('English', 'en' satisfies PrimaryLanguage),
];

function findIngestOptionLabel(options: SelectOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function getIngestAssessmentModeLabel(
  value: IngestAssessmentMode,
): string {
  return findIngestOptionLabel(INGEST_ASSESSMENT_MODE_OPTIONS, value);
}

export function getIngestContentDomainLabel(
  value: IngestContentDomain,
): string {
  return findIngestOptionLabel(INGEST_CONTENT_DOMAIN_OPTIONS, value);
}

export function getIngestPrimaryLanguageLabel(value: PrimaryLanguage): string {
  return findIngestOptionLabel(INGEST_PRIMARY_LANGUAGE_OPTIONS, value);
}
