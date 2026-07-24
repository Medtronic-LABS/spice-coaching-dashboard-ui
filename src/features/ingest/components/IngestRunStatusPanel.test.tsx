import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminV3IngestStatusResponse } from '@/features/ingest/api/adminIngestApi';
import { IngestRunStatusPanel } from './IngestRunStatusPanel';

const mocks = vi.hoisted(() => ({
  useGetIngestStatusByDocumentQuery: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@/features/ingest/api/adminIngestApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/ingest/api/adminIngestApi')
    >();
  return {
    ...actual,
    useGetIngestStatusByDocumentQuery: mocks.useGetIngestStatusByDocumentQuery,
  };
});

type QueryResult = {
  data?: AdminV3IngestStatusResponse | null;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: unknown;
};

function mockQuery(result: QueryResult) {
  mocks.useGetIngestStatusByDocumentQuery.mockReturnValue({
    data: result.data ?? undefined,
    isLoading: result.isLoading ?? false,
    isFetching: result.isFetching ?? false,
    error: result.error,
    refetch: mocks.refetch,
  });
}

function makeStatus(
  overrides: Partial<AdminV3IngestStatusResponse> = {},
): AdminV3IngestStatusResponse {
  return {
    run_id: 'run-1',
    source_document_id: 'doc-1',
    status: 'running',
    started_at: '2026-07-15T08:00:00Z',
    completed_at: null,
    error: null,
    steps: [],
    candidates: [],
    ...overrides,
  };
}

describe('IngestRunStatusPanel', () => {
  beforeEach(() => {
    mocks.useGetIngestStatusByDocumentQuery.mockReset();
    mocks.refetch.mockReset();
  });

  it('skips the query and shows the empty label without a source document', () => {
    mockQuery({});
    render(
      <IngestRunStatusPanel sourceDocumentId="" emptyLabel="Nothing yet" />,
    );

    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    expect(mocks.useGetIngestStatusByDocumentQuery).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ skip: true }),
    );
  });

  it('renders run details, timeline, and steps for running status', () => {
    mockQuery({
      data: makeStatus({
        steps: [
          {
            stage: 'extract',
            status: 'succeeded',
            started_at: '2026-07-15T08:00:00Z',
            completed_at: '2026-07-15T08:01:00Z',
            input_summary: null,
            output_summary: null,
            error: null,
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel sourceDocumentId="doc-1" sourceTitle="HTN" />);

    expect(screen.getByText('Status · HTN')).toBeInTheDocument();
    expect(screen.getByText('run-1')).toBeInTheDocument();
    expect(screen.getByText('extract')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ingestion running. Pipeline steps update below while processing.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the empty steps message when there are no steps', () => {
    mockQuery({ data: makeStatus() });
    render(<IngestRunStatusPanel sourceDocumentId="doc-1" />);

    expect(screen.getByText('No steps yet.')).toBeInTheDocument();
  });

  it('renders a step error payload', () => {
    mockQuery({
      data: makeStatus({
        status: 'failed',
        steps: [
          {
            stage: 'transcribe',
            status: 'failed',
            started_at: null,
            completed_at: null,
            input_summary: null,
            output_summary: null,
            error: { message: 'boom' },
          },
        ],
      }),
    });
    render(<IngestRunStatusPanel sourceDocumentId="doc-1" />);

    expect(screen.getByText(/"message": "boom"/)).toBeInTheDocument();
  });

  it('renders the success action only when ingestion succeeded', () => {
    mockQuery({ data: makeStatus({ status: 'succeeded' }) });
    render(
      <IngestRunStatusPanel
        sourceDocumentId="doc-1"
        successAction={<button type="button">Go to Drafts</button>}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Go to Drafts' }),
    ).toBeInTheDocument();
  });

  it('shows the error state and retries on demand', async () => {
    const user = userEvent.setup();
    mockQuery({ error: { status: 500, data: 'nope' } });
    render(<IngestRunStatusPanel sourceDocumentId="doc-1" />);

    await user.click(screen.getByRole('button', { name: 'Retry status' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('shows the upload loader while uploading', () => {
    mockQuery({});
    render(
      <IngestRunStatusPanel
        sourceDocumentId="doc-1"
        isUploading
        uploadLabel="Uploading document…"
      />,
    );

    expect(screen.getByText('Uploading document…')).toBeInTheDocument();
  });

  it('reports status changes to the parent', () => {
    const onStatusChange = vi.fn();
    const status = makeStatus({ status: 'succeeded' });
    mockQuery({ data: status });
    render(
      <IngestRunStatusPanel
        sourceDocumentId="doc-1"
        onStatusChange={onStatusChange}
      />,
    );

    expect(onStatusChange).toHaveBeenCalledWith('doc-1', status);
  });

  it('delays the status query until initialPollDelayMs elapses', () => {
    vi.useFakeTimers();
    mockQuery({ data: makeStatus() });

    render(
      <IngestRunStatusPanel
        sourceDocumentId="doc-1"
        initialPollDelayMs={5000}
      />,
    );

    expect(mocks.useGetIngestStatusByDocumentQuery).toHaveBeenLastCalledWith(
      'doc-1',
      expect.objectContaining({ skip: true }),
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mocks.useGetIngestStatusByDocumentQuery).toHaveBeenLastCalledWith(
      'doc-1',
      expect.objectContaining({ skip: false }),
    );

    vi.useRealTimers();
  });

  it('enables polling while status is non-terminal', () => {
    mockQuery({ data: makeStatus({ status: 'running' }) });
    render(<IngestRunStatusPanel sourceDocumentId="doc-1" />);

    expect(mocks.useGetIngestStatusByDocumentQuery).toHaveBeenLastCalledWith(
      'doc-1',
      expect.objectContaining({ pollingInterval: 2000 }),
    );
  });

  it('stops polling once status is terminal', () => {
    mockQuery({ data: makeStatus({ status: 'succeeded' }) });
    render(<IngestRunStatusPanel sourceDocumentId="doc-1" />);

    expect(mocks.useGetIngestStatusByDocumentQuery).toHaveBeenLastCalledWith(
      'doc-1',
      expect.objectContaining({ pollingInterval: 0 }),
    );
  });
});
