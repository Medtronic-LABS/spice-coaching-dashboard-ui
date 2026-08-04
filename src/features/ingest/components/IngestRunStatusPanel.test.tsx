import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminV3IngestBatchStatusResponse } from '@/features/ingest/api/adminIngestApi';
import { IngestRunStatusPanel } from './IngestRunStatusPanel';

const mocks = vi.hoisted(() => ({
  useGetIngestBatchStatusQuery: vi.fn(),
  useSubmitIngestMergeDecisionMutation: vi.fn(),
  refetch: vi.fn(),
  submitMergeDecision: vi.fn(),
}));

vi.mock('@/features/ingest/api/adminIngestApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/ingest/api/adminIngestApi')
    >();
  return {
    ...actual,
    useGetIngestBatchStatusQuery: mocks.useGetIngestBatchStatusQuery,
    useSubmitIngestMergeDecisionMutation:
      mocks.useSubmitIngestMergeDecisionMutation,
  };
});

vi.mock('@/features/modules/api/adminModulesApi', () => ({
  useGetModuleDetailQuery: () => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: undefined,
  }),
}));

type QueryResult = {
  data?: AdminV3IngestBatchStatusResponse | null;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: unknown;
};

function mockQuery(result: QueryResult) {
  mocks.useGetIngestBatchStatusQuery.mockReturnValue({
    data: result.data ?? undefined,
    isLoading: result.isLoading ?? false,
    isFetching: result.isFetching ?? false,
    error: result.error,
    refetch: mocks.refetch,
  });
}

function makeStatus(
  overrides: Partial<AdminV3IngestBatchStatusResponse> = {},
): AdminV3IngestBatchStatusResponse {
  return {
    batch_id: 'batch-1',
    status: 'running',
    created_at: '2026-07-15T08:00:00Z',
    completed_at: null,
    error: null,
    sources: [
      {
        source_document_id: 'doc-1',
        run_id: 'run-1',
        document_label: 'HTN',
        status: 'running',
        started_at: '2026-07-15T08:00:00Z',
        completed_at: null,
        error: null,
        nodes: [],
      },
    ],
    ...overrides,
  };
}

describe('IngestRunStatusPanel', () => {
  beforeEach(() => {
    mocks.useGetIngestBatchStatusQuery.mockReset();
    mocks.useSubmitIngestMergeDecisionMutation.mockReset();
    mocks.refetch.mockReset();
    mocks.submitMergeDecision.mockReset();
    mocks.useSubmitIngestMergeDecisionMutation.mockReturnValue([
      mocks.submitMergeDecision,
      { isLoading: false },
    ]);
  });

  it('skips the query and shows the empty label without a batch id', () => {
    mockQuery({});
    render(<IngestRunStatusPanel batchId="" emptyLabel="Nothing yet" />);

    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    expect(mocks.useGetIngestBatchStatusQuery).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ skip: true }),
    );
  });

  it('renders batch details, timeline, and nodes for running status', () => {
    mockQuery({
      data: makeStatus({
        sources: [
          {
            source_document_id: 'doc-1',
            run_id: 'run-1',
            document_label: 'HTN',
            status: 'running',
            started_at: '2026-07-15T08:00:00Z',
            completed_at: null,
            error: null,
            nodes: [
              {
                key: 'extract',
                title: 'Extract content',
                status: 'succeeded',
                started_at: '2026-07-15T08:00:00Z',
                completed_at: '2026-07-15T08:01:00Z',
                children: [],
              },
            ],
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel batchId="batch-1" sourceTitle="HTN" />);

    expect(screen.getByText('Status · HTN')).toBeInTheDocument();
    expect(screen.getAllByText('batch-1').length).toBeGreaterThan(0);
    expect(screen.getByText('Extract content')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ingestion running. Pipeline nodes update below while processing.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the empty nodes message when there are no nodes', () => {
    mockQuery({ data: makeStatus() });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    expect(screen.getByText('No nodes yet.')).toBeInTheDocument();
  });

  it('renders failed node status with a tooltip trigger instead of raw error JSON', () => {
    mockQuery({
      data: makeStatus({
        status: 'failed',
        sources: [
          {
            source_document_id: 'doc-1',
            run_id: 'run-1',
            document_label: 'HTN',
            status: 'failed',
            started_at: null,
            completed_at: null,
            error: null,
            nodes: [
              {
                key: 'transcribe',
                title: 'Transcribe',
                status: 'failed',
                error: { message: 'boom' },
                children: [],
              },
            ],
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    expect(screen.getByRole('button', { name: 'boom' })).toBeInTheDocument();
    expect(screen.queryByText(/"message": "boom"/)).not.toBeInTheDocument();
    // Batch/source badges still show Failed; only errored nodes use the tooltip.
    expect(screen.getAllByText('Failed').length).toBeGreaterThan(0);
  });

  it('shows retry status when the query errors', async () => {
    const user = userEvent.setup();
    mockQuery({ error: { status: 500, data: { detail: 'fail' } } });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    await user.click(screen.getByRole('button', { name: /retry status/i }));
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it('delays polling until the initial delay elapses', () => {
    vi.useFakeTimers();
    mockQuery({});
    render(
      <IngestRunStatusPanel batchId="batch-1" initialPollDelayMs={5000} />,
    );

    expect(mocks.useGetIngestBatchStatusQuery).toHaveBeenCalledWith(
      'batch-1',
      expect.objectContaining({ skip: true }),
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mocks.useGetIngestBatchStatusQuery).toHaveBeenCalledWith(
      'batch-1',
      expect.objectContaining({ skip: false }),
    );
    vi.useRealTimers();
  });

  it('shows a persistent merge review banner when merge_decisions are present', async () => {
    const user = userEvent.setup();
    mockQuery({
      data: makeStatus({
        merge_decisions: [
          {
            decision_url: '/admin/ingest/batches/batch-1/merge-decision',
            run_id: 'run-1',
            candidate_id: 'cand-1',
            decision: 'accept_merge',
            module_title: 'HTN counselling',
            matched_module_id: 'mod-1',
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    expect(
      screen.getByText(
        'Some modules require your approval before ingestion can continue.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Merge review required before ingestion can continue.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View Details' }));
    expect(
      screen.getByRole('heading', { name: 'Review module merge decisions' }),
    ).toBeInTheDocument();
    expect(screen.getByText('HTN counselling')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Skip Merge' }),
    ).toBeInTheDocument();
  });
});
