import type { SelectOption } from '@/components/ui';
import type {
  IngestAssessmentMode,
  IngestContentDomain,
} from '@/features/ingest/api/adminIngestApi';

function ingestOption(label: string, value: string): SelectOption {
  return { label, value };
}

export const INGEST_ASSESSMENT_MODE_OPTIONS: SelectOption[] = [
  ingestOption('Cards and Quizzes', 'with_quiz' satisfies IngestAssessmentMode),
  ingestOption('Cards Only', 'read_only' satisfies IngestAssessmentMode),
];

export const INGEST_CONTENT_DOMAIN_OPTIONS: SelectOption[] = [
  ingestOption('Digital', 'digital' satisfies IngestContentDomain),
  ingestOption('Clinical', 'clinical' satisfies IngestContentDomain),
  ingestOption(
    'Clinical with app workflows',
    'clinical_with_app_workflows' satisfies IngestContentDomain,
  ),
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
