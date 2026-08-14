import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AdminV3IngestBatchStatusResponse } from '@/features/ingest/api/adminIngestApi';
import { useClearIngestSessionOnTerminalLeave } from './useClearIngestSessionOnTerminalLeave';

function terminalStatus(
  overrides?: Partial<AdminV3IngestBatchStatusResponse>,
): AdminV3IngestBatchStatusResponse {
  return {
    batch_id: 'batch-1',
    status: 'succeeded',
    created_at: null,
    completed_at: '2026-07-15T09:00:00Z',
    error: null,
    sources: [],
    ...overrides,
  };
}

describe('useClearIngestSessionOnTerminalLeave', () => {
  it('clears when unmounting after a terminal batch status', () => {
    const onClear = vi.fn();
    const { unmount } = renderHook(
      ({ status }) =>
        useClearIngestSessionOnTerminalLeave({
          batchId: 'batch-1',
          status,
          onClear,
        }),
      { initialProps: { status: terminalStatus() } },
    );

    unmount();
    expect(onClear).toHaveBeenCalledWith('batch-1', terminalStatus());
  });

  it('does not clear while ingestion is still running', () => {
    const onClear = vi.fn();
    const { unmount } = renderHook(() =>
      useClearIngestSessionOnTerminalLeave({
        batchId: 'batch-1',
        status: terminalStatus({ status: 'running' }),
        onClear,
      }),
    );

    unmount();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('does not clear when merge decisions are still pending', () => {
    const onClear = vi.fn();
    const { unmount } = renderHook(() =>
      useClearIngestSessionOnTerminalLeave({
        batchId: 'batch-1',
        status: terminalStatus({
          merge_decisions: [
            {
              decision_url: '/admin/ingest/merge/1',
              run_id: 'run-1',
              candidate_id: 'candidate-1',
            },
          ],
        }),
        onClear,
      }),
    );

    unmount();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('clears for failed terminal statuses', () => {
    const onClear = vi.fn();
    const status = terminalStatus({ status: 'failed' });
    const { unmount } = renderHook(() =>
      useClearIngestSessionOnTerminalLeave({
        batchId: 'batch-1',
        status,
        onClear,
      }),
    );

    unmount();
    expect(onClear).toHaveBeenCalledWith('batch-1', status);
  });
});
