import { describe, expect, it } from 'vitest';
import type { IngestionRunSummary } from '@/features/ingest/api/adminIngestionRunsApi';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import {
  formatIngestRunDurationDisplay,
  formatIngestRunGeneratedCountParts,
  formatIngestRunStatusDisplay,
  formatIngestRunTimestamp,
  ingestRunStatusBadgeClassName,
  ingestRunStatusTone,
  shouldPollIngestionRunList,
} from './ingestRunHistoryUtils';

const baseRun: IngestionRunSummary = {
  id: 'run-1',
  source_document_id: 'doc-12345678-abcd',
  status: 'running',
  started_at: '2026-07-14T10:00:00.000Z',
  completed_at: null,
  error: null,
  document_label: 'TB Sceening.docx',
  generated_module_count: 0,
  generated_card_count: 0,
  generated_quiz_count: 0,
};

describe('ingestRunHistoryUtils', () => {
  it('title-cases the raw API status', () => {
    expect(formatIngestRunStatusDisplay('running')).toBe('Running');
    expect(formatIngestRunStatusDisplay('succeeded')).toBe('Succeeded');
    expect(formatIngestRunStatusDisplay('partially_succeeded')).toBe(
      'Partially Succeeded',
    );
    expect(formatIngestRunStatusDisplay('failed')).toBe('Failed');
    expect(formatIngestRunStatusDisplay('')).toBe('Unknown');
    expect(formatIngestRunStatusDisplay(undefined)).toBe('Unknown');
  });

  it('formats module, card, and quiz counts for succeeded runs', () => {
    expect(
      formatIngestRunGeneratedCountParts({
        ...baseRun,
        status: 'succeeded',
        completed_at: '2026-07-14T10:30:00.000Z',
        generated_module_count: 1,
        generated_card_count: 4,
        generated_quiz_count: 4,
      }),
    ).toEqual({
      modules: '1 module',
      cards: '4 cards',
      quizzes: '4 quizzes',
    });

    expect(
      formatIngestRunGeneratedCountParts({
        ...baseRun,
        status: 'succeeded',
        completed_at: '2026-07-14T10:30:00.000Z',
        generated_module_count: 2,
        generated_card_count: 8,
        generated_quiz_count: 6,
      }),
    ).toEqual({
      modules: '2 modules',
      cards: '8 cards',
      quizzes: '6 quizzes',
    });

    expect(
      formatIngestRunGeneratedCountParts({
        ...baseRun,
        status: 'succeeded',
        completed_at: '2026-07-14T10:30:00.000Z',
        generated_module_count: 0,
        generated_card_count: 0,
        generated_quiz_count: 0,
      }),
    ).toEqual({
      modules: '0 modules',
      cards: '0 cards',
      quizzes: '0 quizzes',
    });
  });

  it('formats reported counts regardless of ingestion status', () => {
    expect(
      formatIngestRunGeneratedCountParts({
        ...baseRun,
        status: 'running',
        generated_card_count: 0,
        generated_quiz_count: 0,
      }),
    ).toEqual({
      modules: '0 modules',
      cards: '0 cards',
      quizzes: '0 quizzes',
    });

    expect(
      formatIngestRunGeneratedCountParts({
        ...baseRun,
        status: 'failed',
        generated_card_count: 0,
        generated_quiz_count: 0,
      }),
    ).toEqual({
      modules: '0 modules',
      cards: '0 cards',
      quizzes: '0 quizzes',
    });

    expect(
      formatIngestRunGeneratedCountParts({
        ...baseRun,
        status: 'partially_succeeded',
        generated_module_count: 1,
        generated_card_count: 3,
        generated_quiz_count: 2,
      }),
    ).toEqual({
      modules: '1 module',
      cards: '3 cards',
      quizzes: '2 quizzes',
    });
  });

  it('formats timestamps and decides when to poll', () => {
    expect(formatIngestRunTimestamp(null)).toBe('—');
    expect(formatIngestRunTimestamp(undefined)).toBe('—');
    expect(formatIngestRunTimestamp('')).toBe('—');
    expect(formatIngestRunTimestamp('not-a-date')).toBe('not-a-date');
    expect(formatIngestRunTimestamp('2026-07-14T10:00:00.000Z')).toBe(
      formatDisplayDateTime('2026-07-14T10:00:00.000Z'),
    );

    expect(
      shouldPollIngestionRunList([{ ...baseRun, status: 'running' }]),
    ).toBe(true);
    expect(
      shouldPollIngestionRunList([{ ...baseRun, status: 'succeeded' }]),
    ).toBe(false);
    expect(shouldPollIngestionRunList([])).toBe(false);
  });

  it('formats duration between started and completed timestamps', () => {
    expect(
      formatIngestRunDurationDisplay(
        '2026-07-14T10:00:00.000Z',
        '2026-07-14T10:05:00.000Z',
      ),
    ).toBe('5m 0s');
    expect(
      formatIngestRunDurationDisplay('2026-07-14T10:00:00.000Z', null),
    ).toBe('—');
  });

  it('maps status tones and badge classes', () => {
    expect(ingestRunStatusTone('running')).toBe('processing');
    expect(ingestRunStatusTone('succeeded')).toBe('completed');
    expect(ingestRunStatusTone('partially_succeeded')).toBe('partial');
    expect(ingestRunStatusTone('failed')).toBe('failed');
    expect(ingestRunStatusTone('unknown_state')).toBe('neutral');

    expect(ingestRunStatusBadgeClassName('processing')).toContain(
      'text-spice-semantic-info',
    );
    expect(ingestRunStatusBadgeClassName('processing')).toContain(
      'bg-spice-semantic-infoBg',
    );
    expect(ingestRunStatusBadgeClassName('completed')).toContain(
      'text-spice-semantic-success',
    );
    expect(ingestRunStatusBadgeClassName('partial')).toContain(
      'text-spice-semantic-warning',
    );
    expect(ingestRunStatusBadgeClassName('failed')).toContain(
      'text-spice-semantic-error',
    );
    expect(ingestRunStatusBadgeClassName('neutral')).toContain(
      'text-spice-text-muted',
    );
  });
});
