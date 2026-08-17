import type { ReactNode } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import type {
  AdminV3IngestAcceptedResponse,
  AdminV3IngestBatchStatusResponse,
  AdminV3IngestUploadResponse,
} from '@/features/ingest/api/adminIngestApi';
import { isIngestSucceeded } from '@/features/ingest/utils/ingestStatus';
import {
  readActiveVideoIngestSessions,
  writeActiveVideoIngestSessions,
} from '@/features/ingest/utils/videoIngestSessionStorage';
import { VideoUploadPage } from './VideoUploadPage';
import { renderWithProviders } from '@/test-utils/render';

type IngestAcceptedCallback = (
  response: AdminV3IngestAcceptedResponse,
  meta: { isReingest: boolean },
) => void;

type IngestUploadedCallback = (
  response: AdminV3IngestUploadResponse,
  meta: { isReupload: boolean },
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
    description: null as string | null,
    thumbnail_storage_path: null as string | null,
    thumbnail_presigned_url: null as string | null,
  };
  return {
    navigate: vi.fn(),
    uploadFiles: vi.fn().mockResolvedValue(null),
    startIngest: vi.fn().mockResolvedValue(null),
    confirmDuplicate: vi.fn(),
    cancelDuplicate: vi.fn(),
    updateSourceDocumentThumbnail: vi.fn().mockResolvedValue({ data: {} }),
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
    onAcceptedRef: { current: null as IngestAcceptedCallback | null },
    onUploadedRef: { current: null as IngestUploadedCallback | null },
    panelStatus: { current: null as AdminV3IngestBatchStatusResponse | null },
    panelProps: {
      current: [] as Array<{ batchId: string }>,
    },
    sourceDocuments: [videoSourceDocument] as Array<typeof videoSourceDocument>,
    refetchSourceDocuments: vi.fn().mockResolvedValue(undefined),
    useFetchSourceDocumentsQuery: vi.fn(() => ({
      data: {
        source_documents: mocks.sourceDocuments,
        total_source_documents: mocks.sourceDocuments.length,
        total_pages: 1,
        limit: 10,
        offset: 0,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: mocks.refetchSourceDocuments,
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

vi.mock('@/features/ingest/utils/videoThumbnail', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/ingest/utils/videoThumbnail')
    >();
  return {
    ...actual,
    captureVideoFirstFrame: vi.fn().mockResolvedValue(null),
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
      useUpdateSourceDocumentThumbnailMutation: () => [
        mocks.updateSourceDocumentThumbnail,
        { isLoading: false },
      ],
      useUpdateSourceDocumentMetadataMutation: () => [
        vi.fn().mockResolvedValue({ data: {} }),
        { isLoading: false },
      ],
    };
  },
);

vi.mock('@/features/ingest/hooks/useIngestWithDuplicateHandling', () => ({
  useIngestWithDuplicateHandling: (options: {
    onAccepted?: IngestAcceptedCallback;
    onUploaded?: IngestUploadedCallback;
  }) => {
    mocks.onAcceptedRef.current = options.onAccepted ?? null;
    mocks.onUploadedRef.current = options.onUploaded ?? null;
    return {
      uploadFiles: mocks.uploadFiles,
      startIngest: mocks.startIngest,
      confirmDuplicate: mocks.confirmDuplicate,
      cancelDuplicate: mocks.cancelDuplicate,
      duplicateDialog: mocks.duplicateDialog,
      isUploading: false,
      isStartingIngest: false,
      isConfirmingDuplicate: false,
    };
  },
}));

vi.mock('@/features/ingest/components/IngestRunStatusPanel', async () => {
  const { useEffect } = await import('react');
  return {
    IngestRunStatusPanel: ({
      batchId,
      onStatusChange,
      onGoToDrafts,
      onGoToNeedsReview,
      successAction,
    }: {
      batchId: string;
      onStatusChange?: (
        batchId: string,
        status: AdminV3IngestBatchStatusResponse | null,
      ) => void;
      onGoToDrafts?: (sourceDocumentId: string, documentLabel: string) => void;
      onGoToNeedsReview?: (
        sourceDocumentId: string,
        documentLabel: string,
      ) => void;
      successAction?: ReactNode;
    }) => {
      useEffect(() => {
        mocks.panelProps.current.push({ batchId });
        return () => {
          mocks.panelProps.current = mocks.panelProps.current.filter(
            (panel) => panel.batchId !== batchId,
          );
        };
      }, [batchId]);
      useEffect(() => {
        if (mocks.panelStatus.current) {
          onStatusChange?.(batchId, mocks.panelStatus.current);
        }
      }, [batchId, onStatusChange]);
      const status = mocks.panelStatus.current;
      const succeeded = isIngestSucceeded(status?.status);
      const sourceId = status?.sources[0]?.source_document_id ?? '';
      const sourceLabel = status?.sources[0]?.document_label ?? '';
      if (!succeeded) return null;
      if (onGoToNeedsReview) {
        return (
          <button
            type="button"
            onClick={() => onGoToNeedsReview(sourceId, sourceLabel)}
          >
            Review Modules
          </button>
        );
      }
      if (onGoToDrafts) {
        return (
          <button
            type="button"
            onClick={() => onGoToDrafts(sourceId, sourceLabel)}
          >
            Go to Drafts
          </button>
        );
      }
      return successAction ? <>{successAction}</> : null;
    },
  };
});

function renderPage() {
  return renderWithProviders(<VideoUploadPage />);
}

function latestUploadedVideosQuery() {
  const calls = mocks.useFetchSourceDocumentsQuery.mock.calls
    .map(([params]) => params)
    .filter(
      (params) =>
        params &&
        typeof params === 'object' &&
        params.source_type === 'video' &&
        params.limit === 10,
    );
  return calls.length > 0 ? calls[calls.length - 1] : undefined;
}

function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

async function stageAndApiUpload(
  user: ReturnType<typeof userEvent.setup>,
  video: File,
  sourceId = 'uploaded-source-1',
) {
  await user.upload(
    screen.getByLabelText(/upload video/i, { selector: 'input' }),
    video,
  );
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: `Remove ${video.name}` }),
    ).toBeInTheDocument();
  });

  mocks.uploadFiles.mockImplementation(async () => {
    const existingDocument = mocks.sourceDocuments.find(
      (document) => document.id === sourceId,
    );
    const title = titleFromFileName(video.name);
    const response: AdminV3IngestUploadResponse = {
      status: 'uploaded',
      sources: [
        {
          source_document_id: sourceId,
          title,
          source_type: 'video',
          stored_path: 'path',
          status: 'uploaded',
        },
      ],
    };
    mocks.sourceDocuments = [
      {
        id: sourceId,
        title,
        source_type: 'video',
        status: existingDocument?.status ?? 'uploaded',
        content_domain: 'clinical',
        authority_label: '',
        original_filename: video.name,
        ingested_at: existingDocument?.ingested_at ?? '2026-07-16T08:00:00Z',
        description: existingDocument?.description ?? null,
        thumbnail_storage_path:
          existingDocument?.thumbnail_storage_path ?? null,
        thumbnail_presigned_url:
          existingDocument?.thumbnail_presigned_url ?? null,
      },
      ...mocks.sourceDocuments.filter((document) => document.id !== sourceId),
    ];
    mocks.onUploadedRef.current?.(response, { isReupload: false });
    return response;
  });

  await user.click(screen.getByRole('button', { name: /^upload$/i }));
  await waitFor(() => expect(mocks.uploadFiles).toHaveBeenCalled());
}

async function selectVideoRow(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
) {
  const checkbox = await screen.findByRole('checkbox', {
    name: `Select ${title}`,
  });
  expect(checkbox).not.toBeChecked();
  await user.click(checkbox);
  expect(checkbox).toBeChecked();
}

describe('VideoUploadPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.uploadFiles.mockReset();
    mocks.uploadFiles.mockResolvedValue(null);
    mocks.startIngest.mockReset();
    mocks.startIngest.mockResolvedValue(null);
    mocks.confirmDuplicate.mockReset();
    mocks.cancelDuplicate.mockReset();
    mocks.updateSourceDocumentThumbnail.mockReset();
    mocks.updateSourceDocumentThumbnail.mockResolvedValue({ data: {} });
    mocks.duplicateDialog.open = false;
    mocks.duplicateDialog.variant = 'blocked';
    mocks.duplicateDialog.conflicts = [];
    mocks.onAcceptedRef.current = null;
    mocks.onUploadedRef.current = null;
    mocks.panelStatus.current = null;
    mocks.panelProps.current = [];
    mocks.sourceDocuments = [
      {
        id: 'video-source-1',
        title: 'Existing video',
        source_type: 'video',
        status: 'ingested',
        content_domain: 'clinical',
        authority_label: '',
        original_filename: 'existing.mp4',
        ingested_at: '2026-07-15T08:00:00Z',
        description: null,
        thumbnail_storage_path: null,
        thumbnail_presigned_url: null,
      },
    ];
    mocks.refetchSourceDocuments.mockReset();
    mocks.refetchSourceDocuments.mockResolvedValue(undefined);
    window.sessionStorage.clear();
  });

  it('caps staged video titles at the document title limit', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'new-video.mp4', { type: 'video/mp4' });

    await user.upload(
      screen.getByLabelText(/upload video/i, { selector: 'input' }),
      video,
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: `Remove ${video.name}` }),
      ).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('new-video')).toHaveAttribute(
      'maxLength',
      String(FIELD_LIMITS.documentTitle),
    );
  });

  it('stages a video, uploads it, then starts ingest with source ids', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'new-video.mp4', { type: 'video/mp4' });

    await stageAndApiUpload(user, video);

    expect(
      screen.getByText('Video uploaded successfully.'),
    ).toBeInTheDocument();
    expect(mocks.uploadFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [video],
        titles: ['new-video'],
        descriptions: [null],
        content_domains: ['clinical'],
        sync_published_visible: [false],
      }),
    );
    expect(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    ).toBeDisabled();

    await selectVideoRow(user, 'new-video');
    await user.click(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    );

    await waitFor(() => expect(mocks.startIngest).toHaveBeenCalledOnce());
    expect(mocks.startIngest).toHaveBeenCalledWith(
      expect.objectContaining({
        source_document_ids: ['uploaded-source-1'],
        assessment_mode: 'with_quiz',
        override_duplicates: null,
      }),
    );
  });

  it('shows backend-driven status/date columns and allows selecting ingested rows', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByRole('columnheader', { name: 'Status' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Uploaded' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Uploaded By' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Ingested Date' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Ingested By' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Date/time' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Upload status' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Ingestion status' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'About uploaded videos' }),
    ).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', {
      name: 'Select Existing video',
    });
    expect(checkbox).toBeEnabled();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    expect(screen.getByText('Ingested')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View modules' }),
    ).toBeInTheDocument();
  });

  it('shows Assign button for listed videos', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Assign' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('hides View modules when status is not ingested', () => {
    mocks.sourceDocuments = [
      {
        id: 'video-source-uploaded',
        title: 'Pending video',
        source_type: 'video',
        status: 'uploaded',
        content_domain: 'clinical',
        authority_label: '',
        original_filename: 'pending.mp4',
        ingested_at: '2026-07-15T08:00:00Z',
        description: null,
        thumbnail_storage_path: null,
        thumbnail_presigned_url: null,
      },
    ];
    renderPage();

    expect(
      screen.getByRole('columnheader', { name: 'Uploaded' }),
    ).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('Uploaded').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Assign' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    const notIngested = screen.getByText('Not ingested');
    expect(notIngested).toBeInTheDocument();
    expect(notIngested.className).toContain('bg-spice-bg-tint');
    expect(
      screen.queryByRole('button', { name: 'View modules' }),
    ).not.toBeInTheDocument();
  });

  it('shows plural success message when multiple videos upload', async () => {
    const user = userEvent.setup();
    renderPage();
    const videos = [
      new File(['video-a'], 'first-video.mp4', { type: 'video/mp4' }),
      new File(['video-b'], 'second-video.mp4', { type: 'video/mp4' }),
    ];

    await user.upload(
      screen.getByLabelText(/upload video/i, { selector: 'input' }),
      videos,
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Remove first-video.mp4' }),
      ).toBeInTheDocument();
    });

    mocks.uploadFiles.mockImplementation(async () => {
      const response: AdminV3IngestUploadResponse = {
        status: 'uploaded',
        sources: [
          {
            source_document_id: 'uploaded-source-1',
            title: 'first-video',
            source_type: 'video',
            stored_path: 'path-1',
            status: 'uploaded',
          },
          {
            source_document_id: 'uploaded-source-2',
            title: 'second-video',
            source_type: 'video',
            stored_path: 'path-2',
            status: 'uploaded',
          },
        ],
      };
      mocks.onUploadedRef.current?.(response, { isReupload: false });
      return response;
    });

    await user.click(screen.getByRole('button', { name: /upload 2 videos/i }));
    await waitFor(() =>
      expect(
        screen.getByText('Videos uploaded successfully.'),
      ).toBeInTheDocument(),
    );
  });

  it('shows View modules for succeeded status alias', () => {
    mocks.sourceDocuments = [
      {
        id: 'video-source-succeeded',
        title: 'Succeeded video',
        source_type: 'video',
        status: 'succeeded',
        content_domain: 'clinical',
        authority_label: '',
        original_filename: 'succeeded.mp4',
        ingested_at: '2026-07-15T08:00:00Z',
        description: null,
        thumbnail_storage_path: null,
        thumbnail_presigned_url: null,
      },
    ];
    renderPage();

    expect(screen.getByText('Succeeded')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View modules' }),
    ).toBeInTheDocument();
  });

  it('applies and clears uploaded video status filters through the settings drawer', async () => {
    const user = userEvent.setup();
    mocks.sourceDocuments = [
      {
        id: 'video-source-1',
        title: 'Existing video',
        source_type: 'video',
        status: 'ingested',
        content_domain: 'clinical',
        authority_label: '',
        original_filename: 'existing.mp4',
        ingested_at: '2026-07-15T08:00:00Z',
        description: null,
        thumbnail_storage_path: null,
        thumbnail_presigned_url: null,
      },
      {
        id: 'video-source-2',
        title: 'Failed video',
        source_type: 'video',
        status: 'failed',
        content_domain: 'clinical',
        authority_label: '',
        original_filename: 'failed.mp4',
        ingested_at: '2026-07-15T09:00:00Z',
        description: null,
        thumbnail_storage_path: null,
        thumbnail_presigned_url: null,
      },
    ];

    renderPage();

    expect(latestUploadedVideosQuery()).toEqual(
      expect.objectContaining({
        source_type: 'video',
        status: ['uploaded', 'ingesting', 'ingested', 'failed'],
        limit: 10,
        offset: 0,
      }),
    );
    expect(latestUploadedVideosQuery()).not.toHaveProperty('uploaded_from');
    expect(latestUploadedVideosQuery()).not.toHaveProperty('uploaded_to');
    expect(
      screen.queryByRole('combobox', { name: /filter uploaded videos/i }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /open video filters/i }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    await user.click(within(dialog).getByLabelText('Failed'));
    await user.click(within(dialog).getByLabelText('Ingested'));
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    await waitFor(() =>
      expect(latestUploadedVideosQuery()).toEqual(
        expect.objectContaining({
          source_type: 'video',
          status: ['failed', 'ingested'],
          limit: 10,
          offset: 0,
        }),
      ),
    );
    await user.click(
      screen.getByRole('button', { name: /open video filters/i }),
    );
    const reopenedDialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(within(reopenedDialog).getByLabelText('Failed')).toBeChecked();
    expect(within(reopenedDialog).getByLabelText('Ingested')).toBeChecked();
    await user.click(
      within(reopenedDialog).getByRole('button', { name: 'Clear All' }),
    );
    expect(within(reopenedDialog).getByLabelText('Failed')).not.toBeChecked();
    expect(within(reopenedDialog).getByLabelText('Ingested')).not.toBeChecked();

    await waitFor(() => {
      expect(latestUploadedVideosQuery()).toEqual(
        expect.objectContaining({
          source_type: 'video',
          status: ['uploaded', 'ingesting', 'ingested', 'failed'],
          limit: 10,
          offset: 0,
        }),
      );
    });
  });

  it('applies uploaded date filters as ISO uploaded_from / uploaded_to', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(latestUploadedVideosQuery()).not.toHaveProperty('uploaded_from');
    expect(latestUploadedVideosQuery()).not.toHaveProperty('uploaded_to');

    await user.click(
      screen.getByRole('button', { name: /open video filters/i }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    await user.type(
      within(dialog).getByLabelText('Uploaded from'),
      '2026-01-01',
    );
    await user.type(within(dialog).getByLabelText('Uploaded to'), '2026-01-31');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(latestUploadedVideosQuery()).toEqual(
        expect.objectContaining({
          source_type: 'video',
          uploaded_from: '2026-01-01T00:00:00.000Z',
          uploaded_to: '2026-01-31T23:59:59.999Z',
        }),
      );
    });

    await user.click(
      screen.getByRole('button', { name: /open video filters/i }),
    );
    const reopenedDialog = screen.getByRole('dialog', { name: 'Filters' });
    await user.click(
      within(reopenedDialog).getByRole('button', { name: 'Clear All' }),
    );

    await waitFor(() => {
      expect(latestUploadedVideosQuery()).not.toHaveProperty('uploaded_from');
      expect(latestUploadedVideosQuery()).not.toHaveProperty('uploaded_to');
    });
  });

  it('sends geography assignment filters with the uploaded videos query', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: /open video filters/i }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    await user.click(within(dialog).getByLabelText(/^division$/i));
    await user.click(await screen.findByRole('option', { name: 'Rangpur' }));
    await user.click(within(dialog).getByLabelText(/^district$/i));
    await user.click(
      await screen.findByRole('option', { name: 'Lalmonirhat' }),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(latestUploadedVideosQuery()).toEqual(
        expect.objectContaining({
          source_type: 'video',
          division_id: 1,
          district_id: 10,
        }),
      );
    });
  });

  it('warns before re-ingesting an existing video using the shared duplicate dialog', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'existing.mp4', { type: 'video/mp4' });

    await stageAndApiUpload(user, video, 'video-source-1');
    await selectVideoRow(user, 'existing');

    mocks.startIngest.mockImplementationOnce(async () => {
      mocks.duplicateDialog.open = true;
      mocks.duplicateDialog.variant = 'blocked';
      mocks.duplicateDialog.conflicts = [
        {
          filename: 'existing.mp4',
          title: 'Existing video',
          content_sha256: 'video-source-1',
          existing_source_documents: [
            {
              source_document_id: 'video-source-1',
              title: 'Existing video',
              original_filename: 'existing.mp4',
              ingested_at: '2026-07-15T08:00:00Z',
              status: 'ingested',
            },
          ],
        },
      ];
      return null;
    });

    await user.click(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Document already ingested' }),
      ).toBeInTheDocument(),
    );
    expect(mocks.startIngest).toHaveBeenCalledWith(
      expect.objectContaining({ override_duplicates: null }),
    );

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Select existing.mp4 to re-ingest',
      }),
    );
    await user.click(screen.getByRole('button', { name: /^re-ingest$/i }));
    expect(mocks.confirmDuplicate).toHaveBeenCalledWith(['existing.mp4']);
  });

  it('cancels re-ingest confirmation without submitting', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'existing.mp4', { type: 'video/mp4' });

    await stageAndApiUpload(user, video, 'video-source-1');
    await selectVideoRow(user, 'existing');

    mocks.startIngest.mockImplementationOnce(async () => {
      mocks.duplicateDialog.open = true;
      mocks.duplicateDialog.variant = 'blocked';
      mocks.duplicateDialog.conflicts = [
        {
          filename: 'existing.mp4',
          title: 'Existing video',
          content_sha256: 'video-source-1',
          existing_source_documents: [
            {
              source_document_id: 'video-source-1',
              title: 'Existing video',
              original_filename: 'existing.mp4',
              ingested_at: '2026-07-15T08:00:00Z',
              status: 'ingested',
            },
          ],
        },
      ];
      return null;
    });

    await user.click(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Document already ingested' }),
      ).toBeInTheDocument(),
    );
    await user.keyboard('{Escape}');

    expect(mocks.cancelDuplicate).toHaveBeenCalled();
  });

  it('keeps ingest disabled until uploaded videos are selected', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'new-video.mp4', { type: 'video/mp4' });

    await stageAndApiUpload(user, video);

    expect(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: 'Select new-video' }),
    ).not.toBeChecked();

    await selectVideoRow(user, 'new-video');
    expect(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    ).toBeEnabled();
  });

  it('restores batch status panels from session storage', () => {
    writeActiveVideoIngestSessions([
      {
        batch_id: 'batch-1',
        source_document_id: 'video-source-1',
        title: 'existing.mp4',
      },
    ]);
    renderPage();
    expect(mocks.panelProps.current).toEqual([{ batchId: 'batch-1' }]);
  });

  it('prunes restored sessions when batch status is terminal', async () => {
    writeActiveVideoIngestSessions([
      {
        batch_id: 'batch-1',
        source_document_id: 'video-source-1',
        title: 'existing.mp4',
      },
    ]);
    mocks.panelStatus.current = {
      batch_id: 'batch-1',
      status: 'succeeded',
      created_at: null,
      completed_at: '2026-07-15T09:00:00Z',
      error: null,
      sources: [
        {
          source_document_id: 'video-source-1',
          run_id: 'run-1',
          document_label: 'existing.mp4',
          status: 'succeeded',
          started_at: null,
          completed_at: null,
          error: null,
          nodes: [],
        },
      ],
    };
    renderPage();
    await waitFor(() => {
      expect(readActiveVideoIngestSessions()).toEqual([]);
    });
  });

  it('clears session storage when leaving after a terminal failed batch status', async () => {
    writeActiveVideoIngestSessions([
      {
        batch_id: 'batch-1',
        source_document_id: 'video-source-1',
        title: 'existing.mp4',
      },
    ]);
    mocks.panelStatus.current = {
      batch_id: 'batch-1',
      status: 'failed',
      created_at: null,
      completed_at: '2026-07-15T09:00:00Z',
      error: 'Pipeline error',
      sources: [
        {
          source_document_id: 'video-source-1',
          run_id: 'run-1',
          document_label: 'existing.mp4',
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
      expect(readActiveVideoIngestSessions()).toEqual([]);
    });

    writeActiveVideoIngestSessions([
      {
        batch_id: 'batch-1',
        source_document_id: 'video-source-1',
        title: 'existing.mp4',
      },
    ]);
    view.unmount();

    expect(readActiveVideoIngestSessions()).toEqual([]);
  });

  it('queues ingest after upload and stores batch session', async () => {
    const user = userEvent.setup();
    renderPage();
    const video = new File(['video'], 'new-video.mp4', { type: 'video/mp4' });

    await stageAndApiUpload(user, video);

    mocks.startIngest.mockImplementation(async () => {
      const response: AdminV3IngestAcceptedResponse = {
        status: 'batch_queued',
        batch_id: 'batch-1',
        poll_url: '/admin/ingest/batches/batch-1',
        sources: [
          {
            source_document_id: 'uploaded-source-1',
            run_id: 'run-1',
            title: 'new-video',
            source_type: 'video',
            stored_path: '',
          },
        ],
      };
      mocks.onAcceptedRef.current?.(response, { isReingest: false });
      return response;
    });

    await selectVideoRow(user, 'new-video');
    await user.click(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    );

    await waitFor(() =>
      expect(readActiveVideoIngestSessions()).toEqual([
        {
          batch_id: 'batch-1',
          source_document_id: 'uploaded-source-1',
          title: 'new-video',
        },
      ]),
    );
    expect(mocks.panelProps.current).toEqual([{ batchId: 'batch-1' }]);
  });

  it('does not set status to Running for unrelated videos when batch status is running', () => {
    writeActiveVideoIngestSessions([
      {
        batch_id: 'batch-active',
        source_document_id: 'video-source-1',
        title: 'existing.mp4',
      },
    ]);
    mocks.sourceDocuments = [
      {
        id: 'video-source-1',
        title: 'Existing video',
        source_type: 'video',
        status: 'ingested',
        content_domain: 'clinical',
        authority_label: '',
        original_filename: 'existing.mp4',
        ingested_at: '2026-07-15T08:00:00Z',
        description: null,
        thumbnail_storage_path: null,
        thumbnail_presigned_url: null,
      },
      {
        id: 'video-source-2',
        title: 'Unrelated video',
        source_type: 'video',
        status: 'uploaded',
        content_domain: 'clinical',
        authority_label: '',
        original_filename: 'unrelated.mp4',
        ingested_at: '2026-07-15T09:00:00Z',
        description: null,
        thumbnail_storage_path: null,
        thumbnail_presigned_url: null,
      },
    ];
    mocks.panelStatus.current = {
      batch_id: 'batch-active',
      status: 'running',
      created_at: null,
      completed_at: null,
      error: null,
      sources: [
        {
          source_document_id: 'video-source-1',
          run_id: 'run-1',
          document_label: 'existing.mp4',
          status: 'running',
          started_at: null,
          completed_at: null,
          error: null,
          nodes: [],
        },
      ],
    };
    renderPage();

    const table = screen.getByRole('table');
    // Status badge + renamed "Uploaded" date column header both say Uploaded.
    expect(within(table).getAllByText('Uploaded').length).toBeGreaterThan(1);
  });

  it('triggers duplicate confirmation flow via API and confirms selective re-ingest', async () => {
    const user = userEvent.setup();
    mocks.sourceDocuments = [
      {
        id: 'video-source-1',
        title: 'Video One',
        source_type: 'video',
        status: 'ingested',
        content_domain: 'clinical',
        authority_label: '',
        original_filename: 'video1.mp4',
        ingested_at: '2026-07-15T08:00:00Z',
        description: null,
        thumbnail_storage_path: null,
        thumbnail_presigned_url: null,
      },
      {
        id: 'video-source-2',
        title: 'Video Two',
        source_type: 'video',
        status: 'ingested',
        content_domain: 'clinical',
        authority_label: '',
        original_filename: 'video2.mp4',
        ingested_at: '2026-07-15T09:00:00Z',
        description: null,
        thumbnail_storage_path: null,
        thumbnail_presigned_url: null,
      },
    ];
    renderPage();

    await selectVideoRow(user, 'Video One');
    await selectVideoRow(user, 'Video Two');

    mocks.startIngest.mockImplementationOnce(async () => {
      mocks.duplicateDialog.open = true;
      mocks.duplicateDialog.variant = 'blocked';
      mocks.duplicateDialog.conflicts = [
        {
          filename: 'video1.mp4',
          title: 'Video One',
          content_sha256: 'video-source-1',
          existing_source_documents: [
            {
              source_document_id: 'video-source-1',
              title: 'Video One',
              original_filename: 'video1.mp4',
              ingested_at: '2026-07-15T08:00:00Z',
              status: 'ingested',
            },
          ],
        },
        {
          filename: 'video2.mp4',
          title: 'Video Two',
          content_sha256: 'video-source-2',
          existing_source_documents: [
            {
              source_document_id: 'video-source-2',
              title: 'Video Two',
              original_filename: 'video2.mp4',
              ingested_at: '2026-07-15T09:00:00Z',
              status: 'ingested',
            },
          ],
        },
      ];
      return null;
    });

    await user.click(
      screen.getByRole('button', { name: 'Ingest Selected Videos' }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Documents already ingested' }),
      ).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Select video1.mp4 to re-ingest',
      }),
    );
    await user.click(screen.getByRole('button', { name: /^re-ingest$/i }));

    expect(mocks.confirmDuplicate).toHaveBeenCalledWith(['video1.mp4']);
  });
});
