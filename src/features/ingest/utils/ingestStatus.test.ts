import { describe, expect, it } from 'vitest';
import {
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
});
