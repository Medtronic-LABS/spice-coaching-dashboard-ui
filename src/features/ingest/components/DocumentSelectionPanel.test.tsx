import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
      uploaded_by: null,
      updated_by: null,
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
      uploaded_by: null,
      updated_by: null,
      assigned: false,
      sync_published_visible: true,
    },
  ];

  return {
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
    uploadFiles: vi.fn(),
  };
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

function ControlledPanel() {
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
      />
      <div data-testid="selected-count">{selected.length}</div>
    </div>
  );
}

describe('DocumentSelectionPanel', () => {
  beforeEach(() => {
    mocks.useFetchSourceDocumentsQuery.mockClear();
    mocks.uploadFiles.mockClear();
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

  it('toggles selection and keeps selected count', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledPanel />);

    await user.click(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    );
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    expect(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    ).toBeChecked();
    expect(
      screen.queryByText('Selected for ingestion'),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('checkbox', { name: /select hypertension guide/i }),
    );
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
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
});
