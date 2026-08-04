import { describe, expect, it } from 'vitest';
import {
  canCompleteIngestFlow,
  countGeneratedModulesFromIngestStatus,
  hasGeneratedIngestModules,
  isIngestInProgress,
  isIngestRunning,
  isIngestSucceeded,
  isTerminalIngestStatus,
  shouldPollIngestStatus,
} from './ingestStatus';

describe('ingestStatus', () => {
  it('treats complete success states as terminal', () => {
    expect(isTerminalIngestStatus('succeeded')).toBe(true);
    expect(isIngestSucceeded('succeeded')).toBe(true);
    expect(isTerminalIngestStatus('partially_succeeded')).toBe(true);
    expect(isIngestSucceeded('partially_succeeded')).toBe(true);
    expect(shouldPollIngestStatus('doc-id', 'partially_succeeded')).toBe(false);
  });

  it('treats failed states as terminal', () => {
    expect(isTerminalIngestStatus('failed')).toBe(true);
    expect(isTerminalIngestStatus('pipeline_failed')).toBe(true);
  });

  it('treats queued and running states as in progress', () => {
    expect(isTerminalIngestStatus('pipeline_queued')).toBe(false);
    expect(isTerminalIngestStatus('running')).toBe(false);
    expect(isIngestRunning('running')).toBe(true);
    expect(isIngestInProgress('doc-id', 'pipeline_queued')).toBe(true);
    expect(isIngestInProgress('doc-id', 'running')).toBe(true);
    expect(shouldPollIngestStatus('doc-id', 'running')).toBe(true);
    expect(shouldPollIngestStatus('doc-id', 'succeeded')).toBe(false);
  });

  it('keeps polling and blocks completion while merge decisions are pending', () => {
    expect(
      shouldPollIngestStatus('doc-id', 'succeeded', {
        hasPendingMergeDecisions: true,
      }),
    ).toBe(true);
    expect(
      isIngestInProgress('doc-id', 'succeeded', {
        hasPendingMergeDecisions: true,
      }),
    ).toBe(true);
    expect(
      canCompleteIngestFlow('succeeded', { hasPendingMergeDecisions: true }),
    ).toBe(false);
    expect(
      canCompleteIngestFlow('succeeded', { hasPendingMergeDecisions: false }),
    ).toBe(true);
  });

  it('is not in progress without a document id', () => {
    expect(isIngestInProgress('', 'pipeline_queued')).toBe(false);
    expect(isIngestInProgress('doc-id', 'succeeded')).toBe(false);
  });

  it('only reports generated modules for positive finite counts', () => {
    expect(hasGeneratedIngestModules(2)).toBe(true);
    expect(hasGeneratedIngestModules(0)).toBe(false);
    expect(hasGeneratedIngestModules(undefined)).toBe(false);
    expect(hasGeneratedIngestModules(Number.NaN)).toBe(false);
  });

  it('prefers top-level generated_module_count when present', () => {
    expect(
      countGeneratedModulesFromIngestStatus({
        generated_module_count: 2,
        steps: [
          {
            stage: 'card_draft',
            status: 'succeeded',
            started_at: null,
            completed_at: null,
            input_summary: null,
            output_summary: { module_id: 'mod-1' },
            error: null,
          },
        ],
      }),
    ).toBe(2);
  });

  it('counts distinct card_draft module_ids when top-level count is absent', () => {
    expect(countGeneratedModulesFromIngestStatus(null)).toBe(0);
    expect(
      countGeneratedModulesFromIngestStatus({
        steps: [
          {
            stage: 'extract',
            status: 'succeeded',
            started_at: null,
            completed_at: null,
            input_summary: null,
            output_summary: {},
            error: null,
          },
          {
            stage: 'card_draft',
            status: 'succeeded',
            started_at: null,
            completed_at: null,
            input_summary: null,
            output_summary: {
              module_id: null,
              insufficient_reason: 'validator_dropped_too_many_cards',
            },
            error: null,
          },
        ],
      }),
    ).toBe(0);
    expect(
      countGeneratedModulesFromIngestStatus({
        steps: [
          {
            stage: 'card_draft',
            status: 'succeeded',
            started_at: null,
            completed_at: null,
            input_summary: null,
            output_summary: { module_id: 'mod-a' },
            error: null,
          },
          {
            stage: 'card_draft',
            status: 'succeeded',
            started_at: null,
            completed_at: null,
            input_summary: null,
            output_summary: { module_id: 'mod-a' },
            error: null,
          },
          {
            stage: 'card_draft',
            status: 'succeeded',
            started_at: null,
            completed_at: null,
            input_summary: null,
            output_summary: { module_id: 'mod-b' },
            error: null,
          },
        ],
      }),
    ).toBe(2);
  });
});
