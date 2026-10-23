import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IngestDuplicateConflict } from '@/features/ingest/api/adminIngestApi';
import { DuplicateIngestConfirmDialog } from './DuplicateIngestConfirmDialog';

const mocks = vi.hoisted(() => ({
  fetchSourceDocuments: vi.fn(),
}));

vi.mock('@/features/modules/api/adminSourceDocumentsApi', () => ({
  useLazyFetchSourceDocumentsQuery: () => [
    mocks.fetchSourceDocuments,
    { isFetching: false },
  ],
}));

const conflicts: IngestDuplicateConflict[] = [
  {
    filename: 'guide.pdf',
    title: 'Guide',
    content_sha256: 'abc',
    existing_source_documents: [
      {
        source_document_id: 'src-1',
        title: 'Existing Guide',
        original_filename: 'guide.pdf',
        ingested_at: '2026-07-15T08:00:00Z',
        status: 'uploaded',
      },
    ],
  },
  {
    filename: 'protocol.pdf',
    title: 'Protocol',
    content_sha256: 'def',
    existing_source_documents: [
      {
        source_document_id: 'src-2',
        title: 'Existing Protocol',
        original_filename: 'protocol.pdf',
        ingested_at: '2026-07-16T08:00:00Z',
        status: 'uploaded',
      },
    ],
  },
];

describe('DuplicateIngestConfirmDialog', () => {
  beforeEach(() => {
    mocks.fetchSourceDocuments.mockReset();
    mocks.fetchSourceDocuments.mockImplementation((params: { q?: string }) => ({
      unwrap: async () => {
        if (params.q === 'guide.pdf') {
          return {
            source_documents: [
              {
                id: 'src-1',
                title: 'Existing Guide',
                uploaded_date: '2026-07-14T10:00:00Z',
                ingested_at: '2026-07-15T08:00:00Z',
                uploaded_by: { id: 101, name: 'Alice Admin' },
                ingested_by: { id: 201, name: 'Carol Ingester' },
              },
            ],
          };
        }
        if (params.q === 'protocol.pdf') {
          return {
            source_documents: [
              {
                id: 'src-2',
                title: 'Existing Protocol',
                uploaded_date: '2026-07-15T11:00:00Z',
                ingested_at: '2026-07-16T08:00:00Z',
                uploaded_by: { id: 102, name: 'Bob Reviewer' },
                ingested_by: { id: 202, name: 'Dave Ingester' },
              },
            ],
          };
        }
        return { source_documents: [] };
      },
    }));
  });

  it('shows upload duplicate modal with tooltip, table, and action buttons', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DuplicateIngestConfirmDialog
        open
        variant="upload"
        conflicts={conflicts}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Duplicate file detected' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'About duplicate file upload' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'File name' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Existing source' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Uploaded' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Uploaded by' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Ingested by' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('0/2')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'guide.pdf' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Existing Protocol' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Skip Upload' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Bob Reviewer')).toBeInTheDocument();
    });

    const uploadButton = screen.getByRole('button', {
      name: 'Upload as New Source',
    });
    expect(uploadButton).toBeDisabled();

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Select guide.pdf to upload as new source',
      }),
    );
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(uploadButton).toBeEnabled();

    await user.click(uploadButton);
    expect(onConfirm).toHaveBeenCalledWith(['guide.pdf']);
  });

  it('confirms with empty selection to reuse existing sources via Skip Upload', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DuplicateIngestConfirmDialog
        open
        variant="upload"
        conflicts={conflicts}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Skip Upload' }));
    expect(onConfirm).toHaveBeenCalledWith([]);
  });

  it('shows confirming labels while upload duplicate resolution is in progress', () => {
    render(
      <DuplicateIngestConfirmDialog
        open
        variant="upload"
        conflicts={conflicts}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        isConfirming
      />,
    );

    expect(screen.getAllByRole('button', { name: 'Uploading…' })).toHaveLength(
      2,
    );
    expect(
      screen.getByRole('checkbox', {
        name: 'Select guide.pdf to upload as new source',
      }),
    ).toBeDisabled();
  });

  it('shows ingest duplicate modal with catalog uploaded metadata', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DuplicateIngestConfirmDialog
        open
        variant="blocked"
        conflicts={[conflicts[0]]}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Document already ingested' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'About duplicate ingest' }),
    ).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Uploaded by' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Ingested by' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Keep Existing' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Carol Ingester')).toBeInTheDocument();
    });

    const reingestButton = screen.getByRole('button', { name: 'Re-ingest' });
    expect(reingestButton).toBeDisabled();

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Select guide.pdf to re-ingest',
      }),
    );
    expect(screen.getByText('1/1')).toBeInTheDocument();
    expect(reingestButton).toBeEnabled();

    await user.click(reingestButton);
    expect(onConfirm).toHaveBeenCalledWith(['guide.pdf']);
  });

  it('confirms with empty selection to keep existing ingested sources', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DuplicateIngestConfirmDialog
        open
        variant="blocked"
        conflicts={[conflicts[0]]}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Keep Existing' }));
    expect(onConfirm).toHaveBeenCalledWith([]);
  });

  it('uses plural ingest title for multiple duplicate documents', () => {
    render(
      <DuplicateIngestConfirmDialog
        open
        variant="blocked"
        conflicts={conflicts}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Documents already ingested' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'About duplicate ingest' }),
    ).toBeInTheDocument();
    expect(screen.getByText('0/2')).toBeInTheDocument();
  });

  it('shows skipped variant title and tooltip for documents not queued', () => {
    render(
      <DuplicateIngestConfirmDialog
        open
        variant="skipped"
        conflicts={[conflicts[0]]}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Document was skipped' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'About skipped duplicate ingest' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Keep Existing' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Re-ingest' })).toBeDisabled();
  });
});
