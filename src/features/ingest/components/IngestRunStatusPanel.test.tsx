import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminV3IngestBatchStatusResponse } from '@/features/ingest/api/adminIngestApi';
import { IngestRunStatusPanel } from './IngestRunStatusPanel';

const mocks = vi.hoisted(() => ({
  useGetIngestBatchStatusQuery: vi.fn(),
  useSubmitIngestMergeDecisionMutation: vi.fn(),
  useFetchIngestionRunByIdQuery: vi.fn(),
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

vi.mock(
  '@/features/ingest/api/adminIngestionRunsApi',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/features/ingest/api/adminIngestionRunsApi')
      >();
    return {
      ...actual,
      useFetchIngestionRunByIdQuery: mocks.useFetchIngestionRunByIdQuery,
    };
  },
);

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
    mocks.useFetchIngestionRunByIdQuery.mockReset();
    mocks.refetch.mockReset();
    mocks.submitMergeDecision.mockReset();
    mocks.useSubmitIngestMergeDecisionMutation.mockReturnValue([
      mocks.submitMergeDecision,
      { isLoading: false },
    ]);
    mocks.useFetchIngestionRunByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: undefined,
    });
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

  it('renders collapsed document progress for running status', () => {
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
              {
                key: 'transcribe',
                title: 'Transcribe',
                status: 'running',
                started_at: '2026-07-15T08:02:00Z',
                children: [],
              },
            ],
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel batchId="batch-1" sourceTitle="HTN" />);

    expect(screen.getByText('Ingestion status')).toBeInTheDocument();
    expect(screen.queryByText('Status · HTN')).not.toBeInTheDocument();
    expect(screen.getByText('HTN')).toBeInTheDocument();
    expect(screen.getAllByText('Running').length).toBeGreaterThan(0);
    expect(screen.getByText('Latest: Transcribe')).toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      'In progress',
    );
    expect(screen.queryByText('Extract content')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Ingestion running. Expand a document to inspect pipeline steps.',
      ),
    ).toBeInTheDocument();
  });

  it('expands only the selected document pipeline details', async () => {
    const user = userEvent.setup();
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
                children: [],
              },
            ],
          },
          {
            source_document_id: 'doc-2',
            run_id: 'run-2',
            document_label: 'Diabetes',
            status: 'queued',
            started_at: null,
            completed_at: null,
            error: null,
            nodes: [
              {
                key: 'extract',
                title: 'Diabetes extract',
                status: 'pending',
                children: [],
              },
            ],
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    expect(screen.queryByText('Extract content')).not.toBeInTheDocument();
    expect(screen.queryByText('Diabetes extract')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Expand pipeline for HTN' }),
    );

    expect(screen.getByText('Extract content')).toBeInTheDocument();
    expect(screen.queryByText('Diabetes extract')).not.toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Collapse pipeline for HTN' }),
    );
    expect(screen.queryByText('Extract content')).not.toBeInTheDocument();
  });

  it('hides skipped thumbnail steps from the expanded pipeline list', async () => {
    const user = userEvent.setup();
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
                children: [],
              },
              {
                key: 'thumbnail',
                title: 'Generating thumbnail',
                status: 'skipped',
                children: [],
              },
              {
                key: 'transcribe',
                title: 'Transcribe',
                status: 'running',
                children: [],
              },
            ],
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    await user.click(
      screen.getByRole('button', { name: 'Expand pipeline for HTN' }),
    );

    expect(screen.getByText('Extract content')).toBeInTheDocument();
    expect(screen.getByText('Transcribe')).toBeInTheDocument();
    expect(screen.queryByText('Generating thumbnail')).not.toBeInTheDocument();
  });

  it('renders Open Modules button on each completed document with modules', () => {
    const onGoToDrafts = vi.fn();
    mockQuery({
      data: makeStatus({
        status: 'succeeded',
        sources: [
          {
            source_document_id: 'doc-1',
            run_id: 'run-1',
            document_label: 'HTN',
            status: 'succeeded',
            started_at: null,
            completed_at: null,
            error: null,
            nodes: [
              {
                key: 'card_draft',
                title: 'Generate Module',
                status: 'succeeded',
                output_summary: { module_id: 'mod-1' },
              },
            ],
          },
        ],
      }),
    });
    render(
      <IngestRunStatusPanel batchId="batch-1" onGoToDrafts={onGoToDrafts} />,
    );

    const btn = screen.getByRole('button', { name: 'Open Modules (1)' });
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(onGoToDrafts).toHaveBeenCalledWith('doc-1', 'HTN');
  });

  it('renders Review Modules (X) on the document when similarity is detected', () => {
    const onGoToNeedsReview = vi.fn();
    mockQuery({
      data: makeStatus({
        status: 'succeeded',
        sources: [
          {
            source_document_id: 'doc-1',
            run_id: 'run-1',
            document_label: 'HTN',
            status: 'succeeded',
            started_at: null,
            completed_at: null,
            error: null,
            nodes: [
              {
                key: 'card_draft',
                title: 'Generate Review Module',
                status: 'succeeded',
                output_summary: {
                  module_id: 'mod-1',
                  has_similarity: true,
                },
              },
            ],
          },
        ],
      }),
    });
    render(
      <IngestRunStatusPanel
        batchId="batch-1"
        onGoToNeedsReview={onGoToNeedsReview}
      />,
    );

    const btn = screen.getByRole('button', { name: 'Review Modules (1)' });
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(onGoToNeedsReview).toHaveBeenCalledWith('doc-1', 'HTN');
  });

  it('renders Review Modules (X) when published_module_merge.was_merge is true', () => {
    const onGoToNeedsReview = vi.fn();
    mockQuery({
      data: makeStatus({
        status: 'succeeded',
        sources: [
          {
            source_document_id: 'doc-1',
            run_id: 'run-1',
            document_label: 'HTN',
            status: 'succeeded',
            started_at: null,
            completed_at: null,
            error: null,
            nodes: [
              {
                key: 'card_draft',
                title: 'Generate Review Module',
                status: 'succeeded',
                published_module_merge: { was_merge: true },
                output_summary: { module_id: 'mod-1' },
              },
            ],
          },
        ],
      }),
    });
    render(
      <IngestRunStatusPanel
        batchId="batch-1"
        onGoToNeedsReview={onGoToNeedsReview}
      />,
    );

    const btn = screen.getByRole('button', { name: 'Review Modules (1)' });
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(onGoToNeedsReview).toHaveBeenCalledWith('doc-1', 'HTN');
  });

  it('shows the empty nodes message when an empty document is expanded', async () => {
    const user = userEvent.setup();
    mockQuery({ data: makeStatus() });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    expect(screen.getByText('No pipeline steps yet')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Expand pipeline for HTN' }),
    );
    expect(screen.getByText('No nodes yet.')).toBeInTheDocument();
  });

  it('renders source-level error.message in the batch info tooltip when batch.error is null', () => {
    mockQuery({
      data: {
        ...makeStatus({ status: 'failed', error: null }),
        sources: [
          {
            source_document_id: 'doc-1',
            run_id: 'run-1',
            document_label: 'HTN',
            status: 'failed',
            started_at: null,
            completed_at: null,
            error: {
              message:
                "We couldn't extract content from this file. Try re-exporting it from the original source.",
              detail: 'Stage A: cannot count pages',
            },
            nodes: [],
          },
        ],
      },
    });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    expect(
      screen.getAllByRole('button', {
        name: "We couldn't extract content from this file. Try re-exporting it from the original source.",
      }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryByText('Stage A: cannot count pages'),
    ).not.toBeInTheDocument();
  });

  it('renders top-level node error_message in an info tooltip', async () => {
    const user = userEvent.setup();
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
                key: 'extract',
                title: 'Extracting content',
                status: 'failed',
                error: {
                  type: 'TextExtractionError',
                  detail: 'Stage A: cannot count pages',
                  reason: 'extract_failed',
                },
                error_code: 'extract_failed',
                error_message:
                  "We couldn't extract content from this file. Try re-exporting it from the original source.",
                children: [],
              },
            ],
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    expect(
      screen.getAllByRole('button', {
        name: "We couldn't extract content from this file. Try re-exporting it from the original source.",
      }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryByText('Stage A: cannot count pages'),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Expand pipeline for HTN' }),
    );

    expect(
      screen.getAllByRole('button', {
        name: "We couldn't extract content from this file. Try re-exporting it from the original source.",
      }).length,
    ).toBeGreaterThan(0);
  });

  it('renders nested error.detail in the tooltip when error_message is missing', async () => {
    const user = userEvent.setup();
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
                error: { detail: 'Connection reset by peer' },
                children: [],
              },
            ],
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    expect(
      screen.getByRole('button', { name: 'Connection reset by peer' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Expand pipeline for HTN' }),
    );

    expect(
      screen.getAllByRole('button', { name: 'Connection reset by peer' })
        .length,
    ).toBeGreaterThan(0);
  });

  it('shows 100% progress and timeline for completed documents while remaining expandable', async () => {
    const user = userEvent.setup();
    mockQuery({
      data: makeStatus({
        status: 'succeeded',
        sources: [
          {
            source_document_id: 'doc-1',
            run_id: 'run-1',
            document_label: 'HTN',
            status: 'succeeded',
            started_at: '2026-07-15T08:00:00Z',
            completed_at: '2026-07-15T08:07:00Z',
            error: null,
            nodes: [
              {
                key: 'card_draft',
                title: 'Generate Module',
                status: 'succeeded',
                output_summary: { module_id: 'mod-1' },
                children: [],
              },
            ],
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel batchId="batch-1" />);

    expect(screen.getAllByText('Succeeded').length).toBeGreaterThan(0);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/Started:/)).toBeInTheDocument();
    expect(screen.getByText(/Completed:/)).toBeInTheDocument();
    expect(screen.queryByText(/Latest:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Created:/)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Expand pipeline for HTN' }),
    );
    expect(screen.getByText('Generate Module')).toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
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
});
