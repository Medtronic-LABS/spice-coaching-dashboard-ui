import { describe, expect, it } from 'vitest';
import {
  isIngestInProgress,
  isIngestRunning,
  isIngestSucceeded,
  isTerminalIngestStatus,
  shouldPollIngestStatus,
} from './ingestStatus';

describe('ingestStatus', () => {
  it('treats succeeded as terminal', () => {
    expect(isTerminalIngestStatus('succeeded')).toBe(true);
    expect(isIngestSucceeded('succeeded')).toBe(true);
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
});
