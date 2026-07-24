import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { paths } from '@/constants/routes';
import type {
  AdminV3IngestAcceptedResponse,
  AdminV3IngestStatusResponse,
} from '@/features/ingest/api/adminIngestApi';
import {
  readActiveVideoIngestSessions,
  writeActiveVideoIngestSessions,
} from '@/features/ingest/utils/videoIngestSessionStorage';
import { VideoUploadPage } from './VideoUploadPage';

type IngestAcceptedCallback = (
  response: AdminV3IngestAcceptedResponse,
  meta: { isReingest: boolean },
) => void;

const mocks = vi.hoisted(() => {
  const videoSourceDocument = {
    id: 'video-source-1',
    title: 'Existing video',
    source_type: 'video',
    status: 'ingested',
    content_domain: 'clinical',
    authority_label: '',
    original_filename: 'existing.mp4',
    ingested_at: '2026-07-15T08:00:00Z',
  };
  return {
    navigate: vi.fn(),
    submitIngest: vi.fn().mockResolvedValue(null),
    confirmDuplicate: vi.fn(),
    cancelDuplicate: vi.fn(),
    duplicateDialog: {
      open: false,
      variant: 'blocked' as 'blocked' | 'skipped',
      conflicts: [] as Array<{
        filename: string;
        title: string;
        content_sha256: string;
        existing_source_documents: [];
      }>,
    },
    // Captures the onAccepted callback the page passes to the ingest hook so a
    // test can simulate the backend accepting the upload.
    onAcceptedRef: { current: null as IngestAcceptedCallback | null },
    // When set, the mocked status panel reports this status to its parent,
    // driving the success/redirect flow.
    panelStatus: { current: null as AdminV3IngestStatusResponse | null },
    panelProps: {
      current: [] as Array<{ sourceDocumentId: string; sourceTitle?: string }>,
    },
    useFetchSourceDocumentsQuery: vi.fn(() => ({
      data: {
        source_documents: [videoSourceDocument],
        total_source_documents: 1,
        total_pages: 1,
        limit: 10,
        offset: 0,
      },
      isFetching: false,
      isError: false,
    })),
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

vi.mock('@/features/ingest/hooks/useIngestWithDuplicateHandling', () => ({
  useIngestWithDuplicateHandling: (options: {
    onAccepted: IngestAcceptedCallback;
  }) => {
    mocks.onAcceptedRef.current = options.onAccepted;
    return {
      submitIngest: mocks.submitIngest,
      confirmDuplicate: mocks.confirmDuplicate,
      cancelDuplicate: mocks.cancelDuplicate,
      duplicateDialog: mocks.duplicateDialog,
      isUploading: false,
      isConfirmingDuplicate: false,
    };
  },
}));

vi.mock('@/features/ingest/components/IngestRunStatusPanel', async () => {
  const { useEffect } = await import('react');
  return {
    IngestRunStatusPanel: ({
      sourceDocumentId,
      sourceTitle,
      onStatusChange,
      successAction,
    }: {
      sourceDocumentId: string;
      sourceTitle?: string;
      onStatusChange?: (
        sourceDocumentId: string,
        status: AdminV3IngestStatusResponse | null,
      ) => void;
      successAction?: React.ReactNode;
    }) => {
      useEffect(() => {
        mocks.panelProps.current.push({ sourceDocumentId, sourceTitle });
        return () => {
          mocks.panelProps.current = mocks.panelProps.current.filter(
            (panel) => panel.sourceDocumentId !== sourceDocumentId,
          );
        };
      }, [sourceDocumentId, sourceTitle]);
      useEffect(() => {
        if (mocks.panelStatus.current) {
          onStatusChange?.(sourceDocumentId, mocks.panelStatus.current);
        }
      }, [sourceDocumentId, onStatusChange]);
      const succeeded =
        mocks.panelStatus.current?.status?.toLowerCase() === 'succeeded';
      return succeeded && successAction ? <>{successAction}</> : null;
    },
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <VideoUploadPage />
    </MemoryRouter>,
  );
}

describe('VideoUploadPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.submitIngest.mockReset();
    mocks.submitIngest.mockResolvedValue(null);
    mocks.confirmDuplicate.mockReset();
    mocks.cancelDuplicate.mockReset();
    mocks.duplicateDialog.open = false;
    mocks.duplicateDialog.variant = 'blocked';
    mocks.duplicateDialog.conflicts = [];
    mocks.onAcceptedRef.current = null;
    mocks.panelStatus.current = null;
    mocks.panelProps.current = [];
    window.sessionStorage.clear();
  });

  it('stages a video and ingests it with the configured payload', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'new-video.mp4', { type: 'video/mp4' });

    await user.upload(
      screen.getByLabelText(/upload video/i, { selector: 'input' }),
      video,
    );
    await user.click(screen.getByRole('button', { name: /^upload$/i }));

    expect(screen.getByText('new-video.mp4')).toBeInTheDocument();
    expect(mocks.useFetchSourceDocumentsQuery).toHaveBeenCalledWith({
      source_type: 'video',
      limit: 10,
      offset: 0,
    });

    await user.click(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    );

    await waitFor(() => expect(mocks.submitIngest).toHaveBeenCalledOnce());
    expect(mocks.submitIngest).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [video],
        content_domain: 'clinical',
        assessment_mode: 'with_quiz',
        override_duplicates: undefined,
      }),
    );
  });

  it('warns before re-ingesting an existing video', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'existing.mp4', { type: 'video/mp4' });

    await user.upload(
      screen.getByLabelText(/upload video/i, { selector: 'input' }),
      video,
    );
    await user.click(screen.getByRole('button', { name: /^upload$/i }));
    await user.click(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Confirm video re-ingestion' }),
    ).toBeInTheDocument();
    expect(mocks.submitIngest).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(mocks.submitIngest).toHaveBeenCalledOnce());
    expect(mocks.submitIngest).toHaveBeenCalledWith(
      expect.objectContaining({ override_duplicates: [true] }),
    );
  });

  it('cancels client-side re-ingest confirmation without submitting', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'existing.mp4', { type: 'video/mp4' });

    await user.upload(
      screen.getByLabelText(/upload video/i, { selector: 'input' }),
      video,
    );
    await user.click(screen.getByRole('button', { name: /^upload$/i }));
    await user.click(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Confirm video re-ingestion' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.queryByRole('heading', { name: 'Confirm video re-ingestion' }),
    ).not.toBeInTheDocument();
    expect(mocks.submitIngest).not.toHaveBeenCalled();
    expect(mocks.cancelDuplicate).not.toHaveBeenCalled();
  });

  it('confirms backend duplicate conflicts via ReingestConfirmDialog', async () => {
    const user = userEvent.setup();
    mocks.duplicateDialog.open = true;
    mocks.duplicateDialog.conflicts = [
      {
        filename: 'backend-dup.mp4',
        title: 'Backend dup',
        content_sha256: 'abc',
        existing_source_documents: [],
      },
    ];

    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Confirm video re-ingestion' }),
    ).toBeInTheDocument();
    expect(screen.getByText('backend-dup.mp4')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(mocks.confirmDuplicate).toHaveBeenCalledOnce();
    expect(mocks.cancelDuplicate).not.toHaveBeenCalled();
  });

  it('cancels backend duplicate conflicts via ReingestConfirmDialog', async () => {
    const user = userEvent.setup();
    mocks.duplicateDialog.open = true;
    mocks.duplicateDialog.conflicts = [
      {
        filename: 'backend-dup.mp4',
        title: 'Backend dup',
        content_sha256: 'abc',
        existing_source_documents: [],
      },
    ];

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.cancelDuplicate).toHaveBeenCalledOnce();
    expect(mocks.confirmDuplicate).not.toHaveBeenCalled();
  });

  it('stages multiple videos and uploads them together', async () => {
    const user = userEvent.setup();
    renderPage();
    const first = new File(['a'], 'first.mp4', { type: 'video/mp4' });
    const second = new File(['bb'], 'second.mov', { type: 'video/quicktime' });

    await user.upload(
      screen.getByLabelText(/upload video/i, { selector: 'input' }),
      [first, second],
    );

    expect(screen.getByText('first.mp4')).toBeInTheDocument();
    expect(screen.getByText('second.mov')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Upload 2 videos' }));
    await user.click(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    );

    await waitFor(() => expect(mocks.submitIngest).toHaveBeenCalledOnce());
    expect(mocks.submitIngest).toHaveBeenCalledWith(
      expect.objectContaining({ files: [first, second] }),
    );
  });

  it('removes a single staged video from the pending list', async () => {
    const user = userEvent.setup();
    renderPage();
    const first = new File(['a'], 'first.mp4', { type: 'video/mp4' });
    const second = new File(['bb'], 'second.mov', { type: 'video/quicktime' });

    await user.upload(
      screen.getByLabelText(/upload video/i, { selector: 'input' }),
      [first, second],
    );
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    expect(screen.queryByText('first.mp4')).not.toBeInTheDocument();
    expect(screen.getByText('second.mov')).toBeInTheDocument();
  });

  it('stages a video dropped onto the upload area', () => {
    renderPage();
    const video = new File(['video'], 'dropped.mp4', { type: 'video/mp4' });
    const dropzone = screen.getByLabelText(/upload video/i, {
      selector: 'label',
    });

    fireEvent.drop(dropzone, { dataTransfer: { files: [video] } });

    expect(screen.getByText('dropped.mp4')).toBeInTheDocument();
  });

  it('rejects a dropped file with an unsupported extension', () => {
    renderPage();
    const doc = new File(['doc'], 'notes.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByLabelText(/upload video/i, {
      selector: 'label',
    });

    fireEvent.drop(dropzone, { dataTransfer: { files: [doc] } });

    expect(
      screen.getByText(/Unsupported file type: notes\.pdf/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^upload$/i })).toBeDisabled();
  });

  it('sends the typed filter text to the source-documents typeahead query', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('combobox', { name: /filter uploaded videos/i }),
    );
    await user.keyboard('danger');

    await waitFor(() =>
      expect(mocks.useFetchSourceDocumentsQuery).toHaveBeenCalledWith({
        source_type: 'video',
        q: 'danger',
        limit: 50,
        offset: 0,
      }),
    );
  });

  it('narrows the table to the video selected in the filter combobox', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'new-video.mp4', { type: 'video/mp4' });

    await user.upload(
      screen.getByLabelText(/upload video/i, { selector: 'input' }),
      video,
    );
    await user.click(screen.getByRole('button', { name: /^upload$/i }));
    expect(screen.getByText('new-video.mp4')).toBeInTheDocument();

    const combobox = screen.getByRole('combobox', {
      name: /filter uploaded videos/i,
    });
    await user.click(combobox);
    await user.click(
      await screen.findByRole('option', { name: 'existing.mp4' }),
    );

    await waitFor(() =>
      expect(screen.queryByText('new-video.mp4')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('existing.mp4')).toBeInTheDocument();

    await user.click(combobox);
    await user.click(screen.getByRole('option', { name: 'All videos' }));
    await waitFor(() =>
      expect(screen.getByText('new-video.mp4')).toBeInTheDocument(),
    );
  });

  it('narrows the table to a newly staged video selected in the filter combobox', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'new-video.mp4', { type: 'video/mp4' });

    await user.upload(
      screen.getByLabelText(/upload video/i, { selector: 'input' }),
      video,
    );
    await user.click(screen.getByRole('button', { name: /^upload$/i }));

    await user.click(
      screen.getByRole('combobox', { name: /filter uploaded videos/i }),
    );
    await user.click(
      await screen.findByRole('option', { name: 'new-video.mp4' }),
    );

    await waitFor(() =>
      expect(screen.queryByText('existing.mp4')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('new-video.mp4')).toBeInTheDocument();
  });

  it('opens Modules filtered to the selected video source', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'View modules' }));

    expect(mocks.navigate).toHaveBeenCalledWith(paths.moduleLibrary, {
      state: {
        tab: 'all',
        sourceDocumentId: 'video-source-1',
        sourceDocumentTitle: 'existing.mp4',
      },
    });
  });

  it('shows Go to Drafts after ingestion succeeds', async () => {
    const user = userEvent.setup();
    mocks.panelStatus.current = {
      run_id: 'run-1',
      source_document_id: 'video-source-1',
      status: 'succeeded',
      started_at: '2026-07-15T08:00:00Z',
      completed_at: '2026-07-15T08:05:00Z',
      error: null,
      steps: [],
      candidates: [],
    };
    mocks.submitIngest.mockImplementation(async () => {
      mocks.onAcceptedRef.current?.(
        {
          status: 'batch_queued',
          fuse_sources: false,
          mode: 'append',
          modules_retired: 0,
          sources: [
            {
              source_document_id: 'video-source-1',
              title: 'new-video.mp4',
              source_type: 'video',
              stored_path: '',
              poll_url: '',
            },
          ],
        },
        { isReingest: false },
      );
      return null;
    });

    renderPage();
    const video = new File(['video'], 'new-video.mp4', { type: 'video/mp4' });

    await user.upload(
      screen.getByLabelText(/upload video/i, { selector: 'input' }),
      video,
    );
    await user.click(screen.getByRole('button', { name: /^upload$/i }));
    await user.click(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    );

    expect(
      await screen.findByText(/ingestion succeeded\. review generated draft/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go to Drafts' }));
    expect(mocks.navigate).toHaveBeenCalledWith(paths.moduleLibrary, {
      state: {
        tab: 'drafts',
        sourceDocumentId: 'video-source-1',
        sourceDocumentTitle: 'new-video.mp4',
      },
    });
  });

  it('restores active ingest status panels after a refresh', () => {
    writeActiveVideoIngestSessions([
      { source_document_id: 'video-source-1', title: 'existing.mp4' },
    ]);

    renderPage();

    expect(mocks.panelProps.current).toEqual([
      { sourceDocumentId: 'video-source-1', sourceTitle: 'existing.mp4' },
    ]);
    expect(screen.getByText('Ingestion in progress')).toBeInTheDocument();
    expect(screen.queryByText('Already Ingested')).not.toBeInTheDocument();
  });

  it('prunes restored ingest sessions once status becomes terminal', async () => {
    writeActiveVideoIngestSessions([
      { source_document_id: 'video-source-1', title: 'existing.mp4' },
    ]);
    mocks.panelStatus.current = {
      run_id: 'run-1',
      source_document_id: 'video-source-1',
      status: 'succeeded',
      started_at: '2026-07-15T08:00:00Z',
      completed_at: '2026-07-15T08:05:00Z',
      error: null,
      steps: [],
      candidates: [],
    };

    renderPage();

    await waitFor(() => {
      expect(readActiveVideoIngestSessions()).toEqual([]);
      expect(mocks.panelProps.current).toEqual([]);
    });
  });
});
