import { describe, expect, it } from 'vitest';
import {
  getIngestAssessmentModeLabel,
  getIngestContentDomainLabel,
  INGEST_ASSESSMENT_MODE_OPTIONS,
  INGEST_CONTENT_DOMAIN_OPTIONS,
  INGEST_PRIMARY_LANGUAGE_OPTIONS,
} from './ingestFormOptions';

describe('ingestFormOptions', () => {
  it('uses display labels only in dropdown options', () => {
    expect(INGEST_ASSESSMENT_MODE_OPTIONS).toEqual([
      { label: 'With quiz', value: 'with_quiz' },
      { label: 'Content only', value: 'read_only' },
    ]);
    expect(INGEST_CONTENT_DOMAIN_OPTIONS[1]).toEqual({
      label: 'Clinical',
      value: 'clinical',
    });
    expect(INGEST_PRIMARY_LANGUAGE_OPTIONS[0]).toEqual({
      label: 'Bengali',
      value: 'bn',
    });
    expect(getIngestAssessmentModeLabel('read_only')).toBe('Content only');
    expect(getIngestContentDomainLabel('clinical')).toBe('Clinical');
  });
});
