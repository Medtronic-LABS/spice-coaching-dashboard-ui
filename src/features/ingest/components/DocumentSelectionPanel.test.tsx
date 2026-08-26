import { useState } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { paths } from '@/constants/routes';
import { DocumentSelectionPanel } from '@/features/ingest/components/DocumentSelectionPanel';
import type { DocumentSelectionPanelProps } from '@/features/ingest/components/DocumentSelectionPanel';
import { INGESTABLE_KNOWLEDGE_SOURCE_TYPES } from '@/features/ingest/constants/documentSelection';
import type { SelectedIngestDocument } from '@/features/ingest/types/documentSelection.types';
import { renderWithProviders } from '@/test-utils/render';

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
      uploaded_by: { id: 101, name: 'Alice Admin' },
      updated_by: null,
      ingested_by: null,
      assigned: false,
      sync_published_visible: true,
    },
    {
      id: 'doc-2',
      title: 'Protocol Deck',
      source_type: 'pptx',
      status: 'ingested',
      content_domain: 'clinical',
      authority_label: '',
      stored_path: '/docs/protocol.pptx',
      original_filename: 'protocol.pptx',
      description: null as string | null,
      thumbnail_storage_path: null as string | null,
      uploaded_date: '2026-07-20T09:00:00Z',
      ingested_at: '2026-07-20T09:30:00Z',
      updated_at: '2026-07-20T09:30:00Z',
      uploaded_by: { id: 422, name: 'Mudassar Raza' },
      updated_by: null,
      ingested_by: { id: 422, name: 'Mudassar Raza' },
      assigned: false,
      sync_published_visible: true,
    },
  ];

  return {
    sourceDocuments,
    navigate: vi.fn(),
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
    uploadFiles: vi.fn(),
  };
});

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

function ControlledPanel({
  keptExistingSourceIds = [],
}: {
  keptExistingSourceIds?: string[];
}) {
  const [selected, setSelected] = useState<SelectedIngestDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const uploadFiles: DocumentSelectionPanelProps['uploadFiles'] = async (
    payload,
  ) => {
    mocks.uploadFiles(payload);
    const response = {
      status: 'uploaded' as const,
      sources: [
        {
          source_document_id: 'doc-new',
          title: 'New Protocol',
          source_type: 'pdf' as const,
          stored_path: '/docs/new.pdf',
          status: 'uploaded',
        },
      ],
    };
    setSelected((previous) => [
      ...previous.filter((doc) => doc.id !== 'doc-new'),
      {
        id: 'doc-new',
        title: 'New Protocol',
        originalFilename: payload.files[0]?.name ?? null,
        sourceType: 'pdf',
        status: 'uploaded',
      },
    ]);
    return response;
  };

  return (
    <div>
      <DocumentSelectionPanel
        selectedDocuments={selected}
        onSelectedDocumentsChange={setSelected}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        uploadFiles={uploadFiles}
        keptExistingSourceIds={keptExistingSourceIds}
      />
      <div data-testid="selected-count">{selected.length}</div>
    </div>
  );
}

describe('DocumentSelectionPanel', () => {
  beforeEach(() => {
    mocks.useFetchSourceDocumentsQuery.mockClear();
    mocks.uploadFiles.mockClear();
    mocks.navigate.mockClear();
  });

  it('requests knowledge-visible ingestable documents and supports search q', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledPanel />);

    expect(mocks.useFetchSourceDocumentsQuery).toHaveBeenCalled();
    const initialArgs =
      mocks.useFetchSourceDocumentsQuery.mock.calls.at(-1)?.[0];
    expect(initialArgs).toMatchObject({
      source_type: INGESTABLE_KNOWLEDGE_SOURCE_TYPES,
    });
    expect(initialArgs).not.toHaveProperty('q');
    expect(initialArgs).not.toHaveProperty('sync_published_visible');

    await user.type(
      screen.getByRole('searchbox', { name: /search knowledge documents/i }),
      'hyper',
    );

    await waitFor(() => {
      const latest = mocks.useFetchSourceDocumentsQuery.mock.calls.at(-1)?.[0];
      expect(latest).toMatchObject({
        q: 'hyper',
      });
      expect(latest).not.toHaveProperty('sync_published_visible');
    });
  });

  it('toggles selection, locks available checkboxes, and shows selected table only when needed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledPanel />);

    expect(screen.getByText(/available documents/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/selected for ingestion/i),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    );
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    expect(
      screen.getByText(/selected for ingestion \(1\)/i),
    ).toBeInTheDocument();

    // Available list keeps the row, but the checkbox is locked.
    const availableCheckbox = screen.getByRole('checkbox', {
      name: /hypertension guide selected/i,
    });
    expect(availableCheckbox).toBeChecked();
    expect(availableCheckbox).toBeDisabled();

    // Unselect from the selected table.
    const selectedCheckbox = screen.getByRole('checkbox', {
      name: /select hypertension guide/i,
    });
    expect(selectedCheckbox).toBeChecked();
    expect(selectedCheckbox).toBeEnabled();
    await user.click(selectedCheckbox);

    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    expect(
      screen.queryByText(/selected for ingestion/i),
    ).not.toBeInTheDocument();
  });

  it('shows the dashed Select files picker above the table and uploads staged files', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledPanel />);

    expect(
      screen.getByRole('button', { name: /^select files$/i }),
    ).toBeInTheDocument();
    const uploadButton = screen.getByRole('button', { name: /^upload$/i });
    expect(uploadButton).toBeDisabled();

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const pdf = new File(['%PDF-1.4'], 'new-protocol.pdf', {
      type: 'application/pdf',
    });
    await user.upload(fileInput, pdf);

    expect(uploadButton).toBeEnabled();
    await user.click(uploadButton);

    await waitFor(() => {
      expect(mocks.uploadFiles).toHaveBeenCalledWith({
        files: [pdf],
        titles: ['new-protocol'],
        content_domains: ['clinical'],
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    });
  });

  it('shows uploaded by and ingested by columns', () => {
    renderWithProviders(<ControlledPanel />);

    expect(screen.getByText('Uploaded by')).toBeInTheDocument();
    expect(screen.getByText('Ingested by')).toBeInTheDocument();
    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getAllByText('Mudassar Raza')).toHaveLength(2);
  });

  it('supports changing rows per page', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledPanel />);

    await user.click(
      screen.getByRole('button', {
        name: /document selection rows per page/i,
      }),
    );
    await user.click(screen.getByRole('option', { name: '10' }));

    await waitFor(() => {
      expect(mocks.useFetchSourceDocumentsQuery).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 }),
      );
    });
  });

  it('shows View modules for kept existing sources during an active ingest batch', () => {
    renderWithProviders(<ControlledPanel keptExistingSourceIds={['doc-1']} />);

    const hypertensionRow = screen
      .getByText('Hypertension Guide')
      .closest('tr');
    expect(hypertensionRow).not.toBeNull();
    expect(
      within(hypertensionRow as HTMLElement).getByRole('button', {
        name: /view modules/i,
      }),
    ).toBeInTheDocument();
  });

  it('shows View modules for ingested docs and navigates with source filter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledPanel />);

    expect(screen.getByText('Not ingested')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /view modules/i }));

    expect(mocks.navigate).toHaveBeenCalledWith(paths.moduleLibrary, {
      state: {
        tab: 'all',
        sourceDocumentId: 'doc-2',
        sourceDocumentTitle: 'Protocol Deck',
      },
    });
  });
});
