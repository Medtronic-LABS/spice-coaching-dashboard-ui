import { describe, expect, it } from 'vitest';
import {
  getIngestAssessmentModeLabel,
  getIngestContentDomainLabel,
  INGEST_ASSESSMENT_MODE_OPTIONS,
  INGEST_CONTENT_DOMAIN_OPTIONS,
} from './ingestFormOptions';

describe('ingestFormOptions', () => {
  it('uses display labels only in dropdown options', () => {
    expect(INGEST_ASSESSMENT_MODE_OPTIONS).toEqual([
      { label: 'Cards and Quizzes', value: 'with_quiz' },
      { label: 'Cards Only', value: 'read_only' },
    ]);
    expect(INGEST_CONTENT_DOMAIN_OPTIONS).toEqual([
      { label: 'Clinical', value: 'clinical' },
      { label: 'Digital', value: 'digital' },
      { label: 'Operational', value: 'operational' },
      {
        label: 'Clinical with app workflows',
        value: 'clinical_with_app_workflows',
      },
    ]);
    expect(getIngestAssessmentModeLabel('read_only')).toBe('Cards Only');
    expect(getIngestContentDomainLabel('clinical')).toBe('Clinical');
    expect(getIngestContentDomainLabel('operational')).toBe('Operational');
  });
});
