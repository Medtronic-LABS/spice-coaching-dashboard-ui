import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AdminV3IngestAcceptedResponse,
  AdminV3IngestBatchStatusResponse,
} from '@/features/ingest/api/adminIngestApi';
import {
  readActiveIngestSession,
  writeActiveIngestSession,
} from '@/features/ingest/utils/ingestSessionStorage';
import { IngestDocumentPage } from './IngestDocumentPage';

type IngestAcceptedCallback = (
  response: AdminV3IngestAcceptedResponse,
  meta: { isReingest: boolean },
) => void;

function acceptedSource(
  sourceDocumentId: string,
  title: string,
): AdminV3IngestAcceptedResponse['sources'][number] {
  return {
    source_document_id: sourceDocumentId,
    run_id: `run-${sourceDocumentId}`,
    title,
    source_type: 'pdf',
    stored_path: `/docs/${sourceDocumentId}.pdf`,
  };
}

function acceptedResponse(
  batchId: string,
  sources: AdminV3IngestAcceptedResponse['sources'],
): AdminV3IngestAcceptedResponse {
  return {
    status: 'batch_queued',
    batch_id: batchId,
    poll_url: `/admin/v3/ingest/batches/${batchId}`,
    sources,
  };
}

const mocks = vi.hoisted(() => {
  const sourceDocuments = [
    {
      id: 'doc-1',
      title: 'Hypertension Guide',
      source_type: 'pdf',
      status: 'uploaded',
      content_domain: 'clinical',
      authority_label: '',
      stored_path: '/docs/hypertension.pdf',
      original_filename: 'hypertension.pdf',
      description: null as string | null,
      thumbnail_storage_path: null as string | null,
      uploaded_date: '2026-07-21T09:00:00Z',
      ingested_at: '2026-07-21T09:00:00Z',
      updated_at: '2026-07-21T09:00:00Z',
      uploaded_by: null,
      updated_by: null,
      assigned: false,
      sync_published_visible: true,
    },
    {
      id: 'doc-2',
      title: 'Diabetes Guide',
      source_type: 'pdf',
      status: 'uploaded',
      content_domain: 'clinical',
      authority_label: '',
      stored_path: '/docs/diabetes.pdf',
      original_filename: 'diabetes.pdf',
      description: null as string | null,
      thumbnail_storage_path: null as string | null,
      uploaded_date: '2026-07-21T10:00:00Z',
      ingested_at: '2026-07-21T10:00:00Z',
      updated_at: '2026-07-21T10:00:00Z',
      uploaded_by: null,
      updated_by: null,
      assigned: false,
      sync_published_visible: true,
    },
  ];

  return {
    navigate: vi.fn(),
    uploadFiles: vi.fn().mockResolvedValue(null),
    startIngest: vi.fn().mockResolvedValue(null),
    confirmDuplicate: vi.fn(),
    cancelDuplicate: vi.fn(),
    duplicateDialog: {
      open: false,
      variant: 'blocked' as const,
      conflicts: [],
    },
    onAcceptedRef: { current: null as IngestAcceptedCallback | null },
    panelStatus: { current: null as AdminV3IngestBatchStatusResponse | null },
    sourceDocuments,
    useFetchSourceDocumentsQuery: vi.fn(() => ({
      data: {
        source_documents: mocks.sourceDocuments,
        total_source_documents: mocks.sourceDocuments.length,
        total_pages: 1,
        limit: 5,
        offset: 0,
      },
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    })),
  };
});

vi.mock('@/features/ingest/components/DuplicateIngestConfirmDialog', () => ({
  DuplicateIngestConfirmDialog: () => null,
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock(
  '@/features/modules/api/adminSourceDocumentsApi',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/features/modules/api/adminSourceDocumentsApi')
      >();
    return {
      ...actual,
      useFetchSourceDocumentsQuery: mocks.useFetchSourceDocumentsQuery,
    };
  },
);

vi.mock('@/features/ingest/hooks/useIngestWithDuplicateHandling', () => ({
  useIngestWithDuplicateHandling: (options: {
    onAccepted?: IngestAcceptedCallback;
    onUploaded?: (response: unknown) => void;
  }) => {
    mocks.onAcceptedRef.current = options.onAccepted ?? null;
    return {
      uploadFiles: mocks.uploadFiles,
      startIngest: mocks.startIngest,
      confirmDuplicate: mocks.confirmDuplicate,
      cancelDuplicate: mocks.cancelDuplicate,
      duplicateDialog: mocks.duplicateDialog,
      isUploading: false,
      isStartingIngest: false,
      isConfirmingDuplicate: false,
      reusedUploadNotice: null,
      keptExistingIngestNotice: null,
    };
  },
}));

vi.mock('@/features/ingest/components/IngestRunStatusPanel', async () => {
  const { useEffect } = await import('react');
  return {
    IngestRunStatusPanel: ({
      batchId,
      onStatusChange,
    }: {
      batchId: string;
      onStatusChange?: (
        batchId: string,
        status: AdminV3IngestBatchStatusResponse | null,
      ) => void;
    }) => {
      useEffect(() => {
        if (mocks.panelStatus.current) {
          onStatusChange?.(batchId, mocks.panelStatus.current);
        }
      }, [batchId, onStatusChange]);
      return <div data-testid="ingest-status">Batch {batchId}</div>;
    },
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <IngestDocumentPage />
    </MemoryRouter>,
  );
}

describe('IngestDocumentPage', () => {
  beforeEach(() => {
    mocks.startIngest.mockReset().mockResolvedValue(null);
    mocks.useFetchSourceDocumentsQuery.mockClear();
    mocks.panelStatus.current = null;
    sessionStorage.clear();
  });

  it('renders Ingest Document title and document selection section collapsed by default', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: 'Ingest Document' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Document Selection')).toBeInTheDocument();
    expect(
      screen.getByText('Expand to select documents or upload new files'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('searchbox', { name: /search knowledge documents/i }),
    ).not.toBeInTheDocument();
  });

  it('keeps the document list open after selection and only uses checkboxes', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: 'Expand Document Selection' }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/selected for ingestion \(1\)/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    ).toBeChecked();
  });

  it('starts ingestion with selected source_document_ids without ingest upload', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: 'Expand Document Selection' }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    );

    const startButton = screen.getByRole('button', {
      name: /start ingestion/i,
    });
    expect(startButton).toBeEnabled();
    await user.click(startButton);

    await waitFor(() => {
      expect(mocks.startIngest).toHaveBeenCalledWith(
        expect.objectContaining({
          source_document_ids: ['doc-1'],
        }),
      );
    });
  });

  it('keeps selected documents checked while ingestion is in progress', async () => {
    const user = userEvent.setup();
    mocks.startIngest.mockImplementation(async () => {
      mocks.onAcceptedRef.current?.(
        acceptedResponse('batch-running', [
          acceptedSource('doc-1', 'Hypertension Guide'),
        ]),
        { isReingest: false },
      );
      return null;
    });
    mocks.panelStatus.current = {
      batch_id: 'batch-running',
      status: 'running',
      created_at: null,
      completed_at: null,
      error: null,
      sources: [
        {
          source_document_id: 'doc-1',
          run_id: 'run-1',
          document_label: 'Hypertension Guide',
          status: 'running',
          started_at: null,
          completed_at: null,
          error: null,
          nodes: [],
        },
      ],
    };

    renderPage();

    await user.click(
      screen.getByRole('button', { name: 'Expand Document Selection' }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    );
    expect(
      screen.getByText(/selected for ingestion \(1\)/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /start ingestion/i }));

    await waitFor(() => {
      expect(screen.getByTestId('ingest-status')).toHaveTextContent(
        'Batch batch-running',
      );
    });
    expect(
      screen.getByText(/selected for ingestion \(1\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    ).toBeChecked();
  });

  it('restores checkbox selection from session source ids while batch is active', async () => {
    writeActiveIngestSession({
      batch_id: 'batch-running',
      source_document_id: 'doc-1',
      title: 'Hypertension Guide',
      kept_existing_sources: [
        {
          source_document_id: 'doc-existing',
          title: 'Existing Guide',
          filename: 'existing.pdf',
        },
      ],
    });
    mocks.panelStatus.current = {
      batch_id: 'batch-running',
      status: 'running',
      created_at: null,
      completed_at: null,
      error: null,
      sources: [
        {
          source_document_id: 'doc-1',
          run_id: 'run-1',
          document_label: 'Hypertension Guide',
          status: 'running',
          started_at: null,
          completed_at: null,
          error: null,
          nodes: [],
        },
      ],
    };

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/selected for ingestion \(2\)/i),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('ingest-status')).toHaveTextContent(
        'Batch batch-running',
      );
    });
    expect(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    ).toBeChecked();
  });

  it('keeps session storage after a terminal batch status until the page is left', async () => {
    writeActiveIngestSession({
      batch_id: 'batch-failed',
      source_document_id: 'doc-1',
      title: 'Hypertension Guide',
      kept_existing_sources: [
        {
          source_document_id: 'doc-existing',
          title: 'Existing Guide',
          filename: 'existing.pdf',
        },
      ],
    });
    mocks.panelStatus.current = {
      batch_id: 'batch-failed',
      status: 'failed',
      created_at: null,
      completed_at: '2026-07-21T10:00:00Z',
      error: 'Pipeline error',
      sources: [
        {
          source_document_id: 'doc-1',
          run_id: 'run-1',
          document_label: 'Hypertension Guide',
          status: 'failed',
          started_at: null,
          completed_at: null,
          error: 'Pipeline error',
          nodes: [],
        },
      ],
    };
    const view = renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('ingest-status')).toHaveTextContent(
        'Batch batch-failed',
      );
    });
    await waitFor(() => {
      expect(readActiveIngestSession()).toEqual({
        batch_id: 'batch-failed',
      });
    });

    view.unmount();

    expect(readActiveIngestSession()).toBeNull();
  });

  it('does not restore the previous batch selection after a terminal ingest', async () => {
    const user = userEvent.setup();
    mocks.startIngest.mockImplementation(async () => {
      mocks.onAcceptedRef.current?.(
        acceptedResponse('batch-done', [
          acceptedSource('doc-1', 'Hypertension Guide'),
        ]),
        { isReingest: false },
      );
      return null;
    });
    mocks.panelStatus.current = {
      batch_id: 'batch-done',
      status: 'succeeded',
      created_at: null,
      completed_at: '2026-07-21T10:00:00Z',
      error: null,
      sources: [
        {
          source_document_id: 'doc-1',
          run_id: 'run-1',
          document_label: 'Hypertension Guide',
          status: 'succeeded',
          started_at: null,
          completed_at: '2026-07-21T10:00:00Z',
          error: null,
          nodes: [],
        },
      ],
    };

    renderPage();

    await user.click(
      screen.getByRole('button', { name: 'Expand Document Selection' }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    );
    await user.click(screen.getByRole('button', { name: /start ingestion/i }));

    await waitFor(() => {
      expect(screen.getByTestId('ingest-status')).toHaveTextContent(
        'Batch batch-done',
      );
    });

    await user.click(
      screen.getByRole('checkbox', { name: /select diabetes guide/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/selected for ingestion \(1\)/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: /select diabetes guide/i }),
    ).toBeChecked();
  });

  it('starts the next ingestion with only the newly selected documents', async () => {
    const user = userEvent.setup();
    mocks.startIngest.mockImplementation(async () => {
      mocks.onAcceptedRef.current?.(
        acceptedResponse('batch-done', [
          acceptedSource('doc-1', 'Hypertension Guide'),
        ]),
        { isReingest: false },
      );
      return null;
    });
    mocks.panelStatus.current = {
      batch_id: 'batch-done',
      status: 'succeeded',
      created_at: null,
      completed_at: '2026-07-21T10:00:00Z',
      error: null,
      sources: [
        {
          source_document_id: 'doc-1',
          run_id: 'run-1',
          document_label: 'Hypertension Guide',
          status: 'succeeded',
          started_at: null,
          completed_at: '2026-07-21T10:00:00Z',
          error: null,
          nodes: [],
        },
      ],
    };

    renderPage();

    await user.click(
      screen.getByRole('button', { name: 'Expand Document Selection' }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    );
    await user.click(screen.getByRole('button', { name: /start ingestion/i }));

    await waitFor(() => {
      expect(screen.getByTestId('ingest-status')).toHaveTextContent(
        'Batch batch-done',
      );
    });

    mocks.startIngest.mockClear();
    mocks.startIngest.mockResolvedValue(null);

    await user.click(
      screen.getByRole('checkbox', { name: /select diabetes guide/i }),
    );
    await user.click(screen.getByRole('button', { name: /start ingestion/i }));

    await waitFor(() => {
      expect(mocks.startIngest).toHaveBeenCalledWith(
        expect.objectContaining({
          source_document_ids: ['doc-2'],
        }),
      );
    });
  });

  it('loads terminal batch status immediately after refresh without the start delay', async () => {
    writeActiveIngestSession({
      batch_id: 'batch-done',
      source_document_id: 'doc-1',
      title: 'Hypertension Guide',
    });
    mocks.panelStatus.current = {
      batch_id: 'batch-done',
      status: 'succeeded',
      created_at: null,
      completed_at: '2026-07-21T10:00:00Z',
      error: null,
      sources: [
        {
          source_document_id: 'doc-1',
          run_id: 'run-1',
          document_label: 'Hypertension Guide',
          status: 'succeeded',
          started_at: null,
          completed_at: '2026-07-21T10:00:00Z',
          error: null,
          nodes: [],
        },
      ],
    };

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('ingest-status')).toHaveTextContent(
        'Batch batch-done',
      );
    });
    expect(
      screen.queryByText(/selected for ingestion \(\d+\)/i),
    ).not.toBeInTheDocument();
  });
});
