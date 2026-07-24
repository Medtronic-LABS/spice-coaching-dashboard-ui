import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, type ColumnDef } from '@/components/common/Table';
import {
  Button,
  Card,
  Combobox,
  Loader,
  Select,
  StatusBadge,
  type ComboboxOption,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  type AdminV3IngestAcceptedSource,
  type AdminV3IngestStatusResponse,
} from '@/features/ingest/api/adminIngestApi';
import { useFetchSourceDocumentsQuery } from '@/features/modules/api/adminSourceDocumentsApi';
import { IngestRunStatusPanel } from '@/features/ingest/components/IngestRunStatusPanel';
import { ReingestConfirmDialog } from '@/features/ingest/components/ReingestConfirmDialog';
import {
  INGEST_FORM_DEFAULTS,
  INGEST_MODULE_COUNT_MAX,
  INGEST_MODULE_COUNT_MIN,
  INGEST_MODULE_COUNT_RANGE_LABEL,
  type IngestModuleCountInput,
  ingestModuleCountForPayload,
  isIngestModuleCountInRange,
  isOptionalIngestModuleCountValid,
} from '@/features/ingest/constants/ingestFormDefaults';
import {
  INGEST_ASSESSMENT_MODE_OPTIONS,
  INGEST_CONTENT_DOMAIN_OPTIONS,
} from '@/features/ingest/constants/ingestFormOptions';
import {
  mergeActiveVideoIngestSessions,
  pruneActiveVideoIngestSession,
  readActiveVideoIngestSessions,
} from '@/features/ingest/utils/videoIngestSessionStorage';
import {
  VIDEO_ACCEPTED_FILE_TYPES_LABEL,
  VIDEO_FILE_INPUT_ACCEPT,
  formatVideoFileRejectionError,
  isAcceptedVideoFile,
} from '@/features/ingest/constants/videoAcceptedFileTypes';
import { useIngestWithDuplicateHandling } from '@/features/ingest/hooks/useIngestWithDuplicateHandling';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';
import {
  isIngestInProgress,
  isIngestSucceeded,
} from '@/features/ingest/utils/ingestStatus';

type VideoRow = {
  id: string;
  selection: string;
  name: string;
  uploadedAt: string;
  uploadStatus: string;
  ingestionStatus: string;
  actions: string;
  sourceDocumentId?: string;
  file?: File;
  syncPublishedVisible: boolean;
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50].map((value) => ({
  label: String(value),
  value: String(value),
}));

/** Page size for the server-side video typeahead in the filter combobox. */
const VIDEO_FILTER_SEARCH_LIMIT = 50;

const ALL_VIDEOS_OPTION: ComboboxOption = { label: 'All videos', value: '' };

function formatDateTime(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function serverStatusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'ingested' || normalized === 'succeeded') {
    return 'Already Ingested';
  }
  if (normalized.includes('fail') || normalized.includes('error')) {
    return 'Failed';
  }
  if (normalized.includes('ingest') || normalized.includes('queue')) {
    return 'Ingestion in progress';
  }
  return status || 'Not ingested';
}

function tableIngestionStatusLabel(
  pipelineStatus: string | undefined,
  options?: { assumeInProgress?: boolean },
): string | null {
  if (pipelineStatus) {
    if (isIngestSucceeded(pipelineStatus)) return 'Already Ingested';
    const normalized = pipelineStatus.toLowerCase();
    if (normalized.includes('fail') || normalized.includes('error')) {
      return 'Failed';
    }
    return 'Ingestion in progress';
  }
  if (options?.assumeInProgress) return 'Ingestion in progress';
  return null;
}

function statusBadgeProps(status: string): {
  status: 'success' | 'warning' | 'critical' | 'info' | 'neutral';
  label: string;
} {
  if (status === 'Already Ingested') {
    return { status: 'success', label: status };
  }
  if (status === 'Failed') return { status: 'critical', label: status };
  if (status === 'Ingestion in progress') {
    return { status: 'info', label: status };
  }
  return { status: 'neutral', label: status };
}

export const VideoUploadPage = () => {
  const navigate = useNavigate();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sessionRows, setSessionRows] = useState<VideoRow[]>([]);
  const [restoredAcceptedSources, setRestoredAcceptedSources] = useState<
    AdminV3IngestAcceptedSource[]
  >(() =>
    readActiveVideoIngestSessions().map((session) => ({
      source_document_id: session.source_document_id,
      title: session.title ?? session.source_document_id,
      source_type: 'video',
      stored_path: '',
      poll_url: '',
    })),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const [actionError, setActionError] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [videoFilterSearch, setVideoFilterSearch] = useState('');
  const debouncedVideoFilterSearch = useDebouncedValue(videoFilterSearch, 300);
  const videoFilterSearchQ = debouncedVideoFilterSearch.trim();
  const [selectedVideo, setSelectedVideo] =
    useState<ComboboxOption>(ALL_VIDEOS_OPTION);
  const [contentDomain, setContentDomain] = useState(
    INGEST_FORM_DEFAULTS.content_domain,
  );
  const [assessmentMode, setAssessmentMode] = useState(
    INGEST_FORM_DEFAULTS.assessment_mode,
  );
  const [quizzesPerModule, setQuizzesPerModule] =
    useState<IngestModuleCountInput>(INGEST_FORM_DEFAULTS.quizzes_per_module);
  const [cardsPerModule, setCardsPerModule] = useState<IngestModuleCountInput>(
    INGEST_FORM_DEFAULTS.cards_per_module,
  );
  const [fuseSources, setFuseSources] = useState<boolean>(
    INGEST_FORM_DEFAULTS.fuse_sources,
  );
  const [ingestionInstructions, setIngestionInstructions] = useState('');

  const stageVideoFiles = useCallback((files: ArrayLike<File> | null) => {
    const picked = Array.from(files ?? []);
    if (!picked.length) return;

    const accepted = picked.filter(isAcceptedVideoFile);
    const rejected = picked.filter((file) => !isAcceptedVideoFile(file));
    setFileError(
      rejected.map((file) => formatVideoFileRejectionError(file)).join(' '),
    );
    if (!accepted.length) return;

    setPendingFiles((previous) => {
      const staged = new Set(
        previous.map(
          (file) => `${file.name}:${file.size}:${file.lastModified}`,
        ),
      );
      const additions = accepted.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (staged.has(key)) return false;
        staged.add(key);
        return true;
      });
      return [...previous, ...additions];
    });
  }, []);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((previous) => previous.filter((_, i) => i !== index));
  }, []);
  const [acceptedSources, setAcceptedSources] = useState<
    AdminV3IngestAcceptedSource[]
  >([]);
  const [statusesBySourceId, setStatusesBySourceId] = useState<
    Record<string, AdminV3IngestStatusResponse | null>
  >({});
  const [precheckVideoNames, setPrecheckVideoNames] = useState<string[]>([]);
  const submittedRowIdsRef = useRef<string[]>([]);

  // Selecting a server-backed video narrows the paginated table query by its
  // filename; session-only selections are matched client-side below.
  const selectedServerVideoName = selectedVideo.value.startsWith('source:')
    ? selectedVideo.label
    : '';
  const {
    data: sourceDocumentList,
    isFetching: isLoadingVideos,
    isError: isVideoListError,
  } = useFetchSourceDocumentsQuery({
    source_type: 'video',
    ...(selectedServerVideoName ? { q: selectedServerVideoName } : {}),
    limit: pageSize,
    offset: page * pageSize,
  });

  // Independent typeahead query feeding the filter combobox options.
  const { data: videoFilterList, isFetching: isSearchingVideoFilter } =
    useFetchSourceDocumentsQuery({
      source_type: 'video',
      ...(videoFilterSearchQ ? { q: videoFilterSearchQ } : {}),
      limit: VIDEO_FILTER_SEARCH_LIMIT,
      offset: 0,
    });

  const serverRows = useMemo<VideoRow[]>(
    () =>
      (sourceDocumentList?.source_documents ?? []).map((document) => ({
        id: `source:${document.id}`,
        selection: '',
        name: document.original_filename || document.title || document.id,
        uploadedAt: document.ingested_at,
        uploadStatus: 'Uploaded',
        ingestionStatus: serverStatusLabel(document.status),
        actions: '',
        sourceDocumentId: document.id,
        syncPublishedVisible: INGEST_FORM_DEFAULTS.sync_published_visible,
      })),
    [sourceDocumentList],
  );

  const displayedServerRows = useMemo(
    () =>
      selectedVideo.value
        ? serverRows.filter((row) => row.id === selectedVideo.value)
        : serverRows,
    [selectedVideo.value, serverRows],
  );

  const activeSourceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const source of restoredAcceptedSources) {
      ids.add(source.source_document_id);
    }
    for (const source of acceptedSources) {
      ids.add(source.source_document_id);
    }
    return ids;
  }, [acceptedSources, restoredAcceptedSources]);

  // Session rows (new uploads and rows re-armed with file bytes) stay pinned on
  // top of whichever server page is showing so they remain selectable while
  // paging. When a video is selected in the filter combobox, both server and
  // pinned rows are narrowed to that selection.
  const rows = useMemo(() => {
    const sessionById = new Map(sessionRows.map((row) => [row.id, row]));
    const serverIds = new Set(displayedServerRows.map((row) => row.id));
    const merged = displayedServerRows.map(
      (row) => sessionById.get(row.id) ?? row,
    );
    const pinned = sessionRows
      .filter((row) => !serverIds.has(row.id))
      .filter((row) => !selectedVideo.value || row.id === selectedVideo.value)
      .sort((a, b) => {
        const aTime = new Date(a.uploadedAt).getTime() || 0;
        const bTime = new Date(b.uploadedAt).getTime() || 0;
        return bTime - aTime;
      });
    return [...pinned, ...merged].map((row) => {
      if (!row.sourceDocumentId) return row;
      const liveLabel = tableIngestionStatusLabel(
        statusesBySourceId[row.sourceDocumentId]?.status,
        { assumeInProgress: activeSourceIds.has(row.sourceDocumentId) },
      );
      if (!liveLabel || liveLabel === row.ingestionStatus) return row;
      return { ...row, ingestionStatus: liveLabel };
    });
  }, [
    activeSourceIds,
    displayedServerRows,
    selectedVideo.value,
    sessionRows,
    statusesBySourceId,
  ]);

  const videoFilterOptions = useMemo(() => {
    const term = videoFilterSearchQ.toLowerCase();
    const options = [ALL_VIDEOS_OPTION];
    const seen = new Set<string>();

    // New uploads may not be searchable server-side yet; merge them in,
    // honouring the typed term client-side.
    for (const row of sessionRows) {
      if (seen.has(row.id)) continue;
      if (term && !row.name.toLowerCase().includes(term)) continue;
      seen.add(row.id);
      options.push({ label: row.name, value: row.id });
    }

    for (const document of videoFilterList?.source_documents ?? []) {
      const value = `source:${document.id}`;
      if (seen.has(value)) continue;
      seen.add(value);
      options.push({
        label: document.original_filename || document.title || document.id,
        value,
      });
    }

    return options;
  }, [sessionRows, videoFilterList, videoFilterSearchQ]);

  const totalFilterVideos = videoFilterList?.total_source_documents ?? 0;
  const listedFilterVideos = videoFilterList?.source_documents.length ?? 0;
  const videoFilterHint =
    totalFilterVideos > listedFilterVideos
      ? `Showing ${listedFilterVideos} of ${totalFilterVideos} videos — type to narrow down`
      : undefined;

  const totalServerVideos = sourceDocumentList?.total_source_documents ?? 0;
  const totalPages = Math.max(1, sourceDocumentList?.total_pages ?? 1);
  const sessionOnlyCount = rows.length - displayedServerRows.length;

  useEffect(() => {
    if (page >= totalPages) setPage(totalPages - 1);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(0);
  }, [selectedVideo.value]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.id) && row.file),
    [rows, selectedIds],
  );

  const handleIngestAccepted = useCallback(
    (
      response: {
        sources: AdminV3IngestAcceptedSource[];
        skipped_duplicates?: { filename: string }[];
      },
      { isReingest }: { isReingest: boolean },
    ) => {
      const skippedNames = new Set(
        response.skipped_duplicates?.map((item) => item.filename) ?? [],
      );
      const submittedIds = submittedRowIdsRef.current;
      const submittedRows = rows.filter((row) => submittedIds.includes(row.id));
      const acceptedRows = submittedRows.filter(
        (row) => !skippedNames.has(row.name),
      );

      setAcceptedSources((previous) => {
        const byId = new Map(
          [...previous, ...response.sources].map((source) => [
            source.source_document_id,
            source,
          ]),
        );
        return [...byId.values()];
      });
      setRestoredAcceptedSources((previous) => {
        const byId = new Map(
          [...previous, ...response.sources].map((source) => [
            source.source_document_id,
            source,
          ]),
        );
        return [...byId.values()];
      });
      mergeActiveVideoIngestSessions(response.sources);

      setSessionRows((previous) =>
        previous.map((row) => {
          const index = acceptedRows.findIndex((item) => item.id === row.id);
          const source = index >= 0 ? response.sources[index] : undefined;
          if (!source) return row;
          return {
            ...row,
            sourceDocumentId: source.source_document_id,
            ingestionStatus: 'Ingestion in progress',
          };
        }),
      );

      if (response.skipped_duplicates?.length && !isReingest) {
        submittedRowIdsRef.current = submittedRows
          .filter((row) => skippedNames.has(row.name))
          .map((row) => row.id);
      }
    },
    [rows],
  );

  const {
    submitIngest,
    confirmDuplicate,
    cancelDuplicate,
    duplicateDialog,
    isUploading,
    isConfirmingDuplicate,
  } = useIngestWithDuplicateHandling({
    onAccepted: handleIngestAccepted,
    onError: setActionError,
  });

  const anyIngestionInProgress = acceptedSources.some((source) =>
    isIngestInProgress(
      source.source_document_id,
      statusesBySourceId[source.source_document_id]?.status,
    ),
  );
  const moduleCountsValid =
    isOptionalIngestModuleCountValid(quizzesPerModule) &&
    isOptionalIngestModuleCountValid(cardsPerModule);
  const canIngest =
    selectedRows.length > 0 &&
    moduleCountsValid &&
    !isUploading &&
    !anyIngestionInProgress;

  const runIngest = useCallback(
    async (allowKnownDuplicates: boolean) => {
      if (!selectedRows.length) return;
      setActionError('');
      setAcceptedSources([]);
      setStatusesBySourceId({});
      submittedRowIdsRef.current = selectedRows.map((row) => row.id);
      const overrideDuplicates = selectedRows.map(
        (row) =>
          allowKnownDuplicates && row.ingestionStatus === 'Already Ingested',
      );
      await submitIngest({
        files: selectedRows.map((row) => row.file as File),
        fuse_sources: fuseSources && selectedRows.length >= 2,
        sync_published_visible: selectedRows.map(
          (row) => row.syncPublishedVisible,
        ),
        content_domain: contentDomain,
        assessment_mode: assessmentMode,
        quizzes_per_module: ingestModuleCountForPayload(quizzesPerModule),
        cards_per_module: ingestModuleCountForPayload(cardsPerModule),
        mode: INGEST_FORM_DEFAULTS.mode,
        ingestion_instructions: ingestionInstructions.trim() || null,
        override_duplicates: overrideDuplicates.some(Boolean)
          ? overrideDuplicates
          : undefined,
      });
    },
    [
      assessmentMode,
      cardsPerModule,
      contentDomain,
      fuseSources,
      ingestionInstructions,
      quizzesPerModule,
      selectedRows,
      submitIngest,
    ],
  );

  const handleStatusChange = useCallback(
    (sourceDocumentId: string, status: AdminV3IngestStatusResponse | null) => {
      setStatusesBySourceId((previous) => {
        if (previous[sourceDocumentId] === status) return previous;
        return { ...previous, [sourceDocumentId]: status };
      });
      setRestoredAcceptedSources((previous) => {
        if (!status) return previous;
        const remainingSessions = pruneActiveVideoIngestSession(
          sourceDocumentId,
          status.status,
        );
        const remainingIds = new Set(
          remainingSessions.map((session) => session.source_document_id),
        );
        return previous.filter((source) =>
          remainingIds.has(source.source_document_id),
        );
      });
      if (!status) return;
      const liveLabel = tableIngestionStatusLabel(status.status);
      if (liveLabel) {
        setSessionRows((previous) =>
          previous.map((row) => {
            if (row.sourceDocumentId !== sourceDocumentId) return row;
            return { ...row, ingestionStatus: liveLabel };
          }),
        );
      }
    },
    [],
  );

  const allAcceptedSucceeded =
    acceptedSources.length > 0 &&
    acceptedSources.every((source) =>
      isIngestSucceeded(statusesBySourceId[source.source_document_id]?.status),
    );

  const activeStatusSources = useMemo(() => {
    const byId = new Map<string, AdminV3IngestAcceptedSource>();
    for (const source of restoredAcceptedSources) {
      byId.set(source.source_document_id, source);
    }
    for (const source of acceptedSources) {
      byId.set(source.source_document_id, source);
    }
    return [...byId.values()];
  }, [acceptedSources, restoredAcceptedSources]);

  useEffect(() => {
    if (!allAcceptedSucceeded) return;
    const successfulIds = new Set(
      acceptedSources.map((source) => source.source_document_id),
    );
    setSessionRows((previous) =>
      previous.map((row) =>
        row.sourceDocumentId && successfulIds.has(row.sourceDocumentId)
          ? { ...row, ingestionStatus: 'Already Ingested' }
          : row,
      ),
    );
  }, [acceptedSources, allAcceptedSucceeded]);

  const goToDraftsForSource = useCallback(
    (sourceDocumentId: string, sourceTitle?: string) => {
      const state: ModuleLibraryLocationState = {
        tab: 'drafts',
        sourceDocumentId,
        sourceDocumentTitle: sourceTitle,
      };
      navigate(paths.moduleLibrary, { state });
    },
    [navigate],
  );

  const rowIdForFile = useCallback(
    (file: File): string => {
      const serverMatch = serverRows.find(
        (row) => row.name.toLowerCase() === file.name.toLowerCase(),
      );
      return (
        serverMatch?.id ??
        `local:${file.name}:${file.size}:${file.lastModified}`
      );
    },
    [serverRows],
  );

  const addPendingFiles = useCallback(() => {
    const files = pendingFiles.filter(isAcceptedVideoFile);
    if (!files.length) return;
    setIsAdding(true);
    setSessionRows((previous) => {
      let next = previous;
      for (const file of files) {
        const serverMatch = serverRows.find(
          (row) => row.name.toLowerCase() === file.name.toLowerCase(),
        );
        const id = rowIdForFile(file);
        const existing = next.find((row) => row.id === id);
        const nextRow: VideoRow = {
          ...(serverMatch ?? existing),
          id,
          selection: '',
          name: file.name,
          uploadedAt:
            serverMatch?.uploadedAt ||
            existing?.uploadedAt ||
            new Date().toISOString(),
          uploadStatus: 'Uploaded',
          ingestionStatus:
            serverMatch?.ingestionStatus ||
            existing?.ingestionStatus ||
            'Not ingested',
          actions: '',
          sourceDocumentId:
            serverMatch?.sourceDocumentId ?? existing?.sourceDocumentId,
          file,
          syncPublishedVisible:
            existing?.syncPublishedVisible ??
            INGEST_FORM_DEFAULTS.sync_published_visible,
        };
        next = existing
          ? next.map((row) => (row.id === id ? nextRow : row))
          : [...next, nextRow];
      }
      return next;
    });
    setSelectedIds((previous) => {
      const next = new Set(previous);
      for (const file of files) next.add(rowIdForFile(file));
      return next;
    });
    setPendingFiles([]);
    setFileError('');
    setIsAdding(false);
  }, [pendingFiles, rowIdForFile, serverRows]);

  const selectablePageRows = rows.filter((row) => row.file);
  const allPageRowsSelected =
    selectablePageRows.length > 0 &&
    selectablePageRows.every((row) => selectedIds.has(row.id));

  const columns = useMemo<Array<ColumnDef<VideoRow>>>(
    () => [
      {
        key: 'selection',
        header: (
          <input
            type="checkbox"
            aria-label="Select all videos on this page"
            checked={allPageRowsSelected}
            disabled={!selectablePageRows.length || isUploading}
            onChange={(event) => {
              setSelectedIds((previous) => {
                const next = new Set(previous);
                for (const row of selectablePageRows) {
                  if (event.target.checked) next.add(row.id);
                  else next.delete(row.id);
                }
                return next;
              });
            }}
          />
        ),
        render: (row) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.name}`}
            checked={selectedIds.has(row.id)}
            disabled={!row.file || isUploading}
            title={row.file ? undefined : 'Choose this file again to re-ingest'}
            onChange={(event) => {
              setSelectedIds((previous) => {
                const next = new Set(previous);
                if (event.target.checked) next.add(row.id);
                else next.delete(row.id);
                return next;
              });
            }}
          />
        ),
      },
      { key: 'name', header: 'Video name' },
      {
        key: 'uploadedAt',
        header: 'Upload date/time',
        render: (row) => formatDateTime(row.uploadedAt),
      },
      {
        key: 'uploadStatus',
        header: 'Upload status',
        render: (row) => (
          <StatusBadge status="success" label={row.uploadStatus} />
        ),
      },
      {
        key: 'ingestionStatus',
        header: 'Ingestion status',
        render: (row) => (
          <StatusBadge {...statusBadgeProps(row.ingestionStatus)} />
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) =>
          row.sourceDocumentId ? (
            <Button
              variant="ghost"
              className="h-8 px-2 text-xs hover:bg-[#ffcdd2] active:bg-[#ef9a9a]"
              onClick={() => {
                const state: ModuleLibraryLocationState = {
                  tab: 'all',
                  sourceDocumentId: row.sourceDocumentId,
                  sourceDocumentTitle: row.name,
                };
                navigate(paths.moduleLibrary, { state });
              }}
            >
              View modules
            </Button>
          ) : (
            <span className="text-xs text-spice-text-muted">Not ingested</span>
          ),
      },
    ],
    [
      allPageRowsSelected,
      isUploading,
      navigate,
      selectablePageRows,
      selectedIds,
    ],
  );

  const dialogIsBackendDuplicate = duplicateDialog.open;
  const dialogNames = dialogIsBackendDuplicate
    ? duplicateDialog.conflicts.map((conflict) => conflict.filename)
    : precheckVideoNames;

  const uploadBusy = isAdding || isUploading || anyIngestionInProgress;
  let uploadButtonLabel = 'Upload';
  if (isAdding) {
    uploadButtonLabel = 'Uploading…';
  } else if (pendingFiles.length > 1) {
    uploadButtonLabel = `Upload ${pendingFiles.length} videos`;
  }
  let dropzoneStateClasses =
    'cursor-pointer border-spice-border-mid bg-spice-bg-tint hover:border-spice-border hover:bg-spice-bg-surface';
  if (uploadBusy) {
    dropzoneStateClasses =
      'cursor-not-allowed border-spice-border-mid bg-spice-bg-tint opacity-60';
  } else if (isDragActive) {
    dropzoneStateClasses =
      'cursor-pointer border-spice-brand-primary bg-spice-bg-surface';
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            Video Upload
          </h1>
          <p className="mt-1 text-sm text-spice-text-muted">
            Upload videos and generate learning modules from their content.
          </p>
        </div>
        <Button
          variant="secondary"
          className="h-9 text-xs"
          onClick={() => navigate(paths.moduleLibrary)}
        >
          Back to modules
        </Button>
      </div>

      {actionError ? (
        <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
          {actionError}
        </div>
      ) : null}

      <Card variant="elevated" className="min-w-0 space-y-4 p-4 sm:p-6">
        <div className="text-sm font-semibold text-spice-text-primary">
          Upload
        </div>

        <div className="space-y-2">
          {pendingFiles.map((file, index) => (
            <div
              key={`${file.name}:${file.size}:${file.lastModified}`}
              className="flex items-center gap-3 rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2.5"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-spice-bg-tint text-spice-text-muted"
                aria-hidden
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14 3v5h5"
                  />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-sm font-medium text-spice-text-primary"
                  title={file.name}
                >
                  {file.name}
                </div>
                <div className="mt-0.5 text-[11px] text-spice-text-muted">
                  {Math.round(file.size / 1024)} KB
                </div>
              </div>

              <Button
                variant="ghost"
                className="h-8 shrink-0 px-2 text-[11px] text-spice-semantic-error hover:bg-spice-semantic-errorBg"
                disabled={isAdding || isUploading || anyIngestionInProgress}
                onClick={() => removePendingFile(index)}
              >
                Remove
              </Button>
            </div>
          ))}

          <label
            aria-label={
              pendingFiles.length ? 'Add more videos' : 'Upload video'
            }
            className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-3 text-center transition-colors ${dropzoneStateClasses}`}
            onDragOver={(event) => {
              event.preventDefault();
              if (uploadBusy) return;
              setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragActive(false);
              if (uploadBusy) return;
              stageVideoFiles(event.dataTransfer.files);
            }}
          >
            <input
              type="file"
              multiple
              accept={VIDEO_FILE_INPUT_ACCEPT}
              className="sr-only"
              disabled={isAdding || isUploading || anyIngestionInProgress}
              onChange={(event) => {
                const files = event.target.files;
                stageVideoFiles(files);
                event.target.value = '';
              }}
            />
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-spice-border bg-spice-bg-surface text-spice-text-muted">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </span>
            <span className="text-xs font-semibold text-spice-text-primary">
              {pendingFiles.length ? 'Add more videos' : 'Upload videos'}
            </span>
            <span className="text-[11px] text-spice-text-muted">
              Click to select or drag and drop videos
            </span>
          </label>

          {fileError ? (
            <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
              {fileError}
            </div>
          ) : null}
        </div>

        <p className="text-xs text-spice-text-muted">
          {VIDEO_ACCEPTED_FILE_TYPES_LABEL}
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            disabled={
              !pendingFiles.length ||
              isAdding ||
              isUploading ||
              anyIngestionInProgress
            }
            onClick={addPendingFiles}
          >
            {uploadButtonLabel}
          </Button>
        </div>
      </Card>

      <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-spice-text-primary">
              Uploaded videos
            </div>
            <p className="mt-1 text-xs text-spice-text-muted">
              Previously ingested videos must be chosen again before they can be
              selected for re-ingestion.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <Combobox
              aria-label="Filter uploaded videos"
              value={selectedVideo.value}
              selectedLabel={selectedVideo.label}
              options={videoFilterOptions}
              searchTerm={videoFilterSearch}
              onSearchTermChange={setVideoFilterSearch}
              onChange={(value) => {
                setSelectedVideo(
                  videoFilterOptions.find((option) => option.value === value) ??
                    ALL_VIDEOS_OPTION,
                );
              }}
              isLoading={isSearchingVideoFilter}
              hint={videoFilterHint}
              placeholder="Type to search videos…"
              emptyMessage="No videos match your search"
            />
          </div>
        </div>

        {isVideoListError ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            Unable to load uploaded videos.
          </div>
        ) : null}
        <Loader open={isLoadingVideos} label="Loading uploaded videos…" />
        <Table
          data={rows}
          columns={columns}
          keyExtractor={(row) => row.id}
          caption="Uploaded videos"
          emptyMessage="No videos uploaded yet."
        />

        <div className="flex flex-col gap-3 border-t border-spice-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-spice-text-muted">
            Showing {displayedServerRows.length ? page * pageSize + 1 : 0}–
            {page * pageSize + displayedServerRows.length} of{' '}
            {totalServerVideos}
            {sessionOnlyCount > 0 ? ` (+${sessionOnlyCount} new)` : ''}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-spice-text-muted">Rows</span>
            <Select
              aria-label="Videos per page"
              className="h-8 w-20"
              options={PAGE_SIZE_OPTIONS}
              value={String(pageSize)}
              onChange={(value) => {
                setPageSize(Number(value));
                setPage(0);
              }}
            />
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-spice-text-muted">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
        <div className="text-sm font-semibold text-spice-text-primary">
          Ingestion configuration
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-spice-text-primary">
              Module content
            </span>
            <Select
              className="w-full"
              options={INGEST_ASSESSMENT_MODE_OPTIONS}
              value={assessmentMode}
              disabled={isUploading || anyIngestionInProgress}
              onChange={(value) =>
                setAssessmentMode(value as typeof assessmentMode)
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-spice-text-primary">
              Content domain type
            </span>
            <Select
              className="w-full"
              options={INGEST_CONTENT_DOMAIN_OPTIONS}
              value={contentDomain}
              disabled={isUploading || anyIngestionInProgress}
              onChange={(value) =>
                setContentDomain(value as typeof contentDomain)
              }
            />
          </label>
          {[
            {
              label: 'Learning Material per Module (Optional)',
              value: cardsPerModule,
              setValue: setCardsPerModule,
            },
            {
              label: 'Quizzes per Module (Optional)',
              value: quizzesPerModule,
              setValue: setQuizzesPerModule,
            },
          ].map((field) => (
            <label key={field.label} className="block space-y-1">
              <span className="text-xs font-semibold text-spice-text-primary">
                {field.label}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={INGEST_MODULE_COUNT_MIN}
                max={INGEST_MODULE_COUNT_MAX}
                className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                value={field.value}
                disabled={isUploading || anyIngestionInProgress}
                placeholder="e.g. 5"
                onChange={(event) => {
                  if (!event.target.value) {
                    field.setValue('');
                    return;
                  }
                  const parsed = Number.parseInt(event.target.value, 10);
                  if (!Number.isNaN(parsed)) field.setValue(parsed);
                }}
              />
              {field.value !== '' &&
              !isIngestModuleCountInRange(field.value) ? (
                <span className="text-[11px] text-spice-semantic-error">
                  Enter a number from {INGEST_MODULE_COUNT_MIN} to{' '}
                  {INGEST_MODULE_COUNT_MAX}.
                </span>
              ) : (
                <span className="text-[11px] text-spice-text-muted">
                  {INGEST_MODULE_COUNT_RANGE_LABEL}
                </span>
              )}
            </label>
          ))}
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-spice-border px-3 py-2.5">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={fuseSources}
            disabled={
              selectedRows.length < 2 || isUploading || anyIngestionInProgress
            }
            onChange={(event) => setFuseSources(event.target.checked)}
          />
          <span className="text-sm text-spice-text-medium">
            <span className="font-semibold text-spice-text-primary">
              Merge sources
            </span>
            <span className="block text-xs text-spice-text-muted">
              Combine selected videos into one ingestion run. Requires at least
              2 videos.
            </span>
          </span>
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-spice-text-muted">
            Ingestion instructions (optional)
          </span>
          <textarea
            className="min-h-[84px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm"
            value={ingestionInstructions}
            disabled={isUploading || anyIngestionInProgress}
            onChange={(event) => setIngestionInstructions(event.target.value)}
            placeholder="e.g. Focus on the key workflows demonstrated in the video…"
          />
        </label>

        <div className="flex flex-col gap-2 sm:items-end">
          <Button
            disabled={!canIngest}
            onClick={() => {
              const alreadyIngestedNames = selectedRows
                .filter((row) => row.ingestionStatus === 'Already Ingested')
                .map((row) => row.name);
              if (alreadyIngestedNames.length) {
                setPrecheckVideoNames(alreadyIngestedNames);
                return;
              }
              void runIngest(false);
            }}
          >
            {isUploading
              ? 'Uploading…'
              : anyIngestionInProgress
                ? 'Ingestion in progress…'
                : 'Ingest Selected Videos'}
          </Button>
          <div className="flex w-full items-center gap-3 rounded-xl bg-spice-semantic-infoBg px-4 py-3 ring-1 ring-[color:var(--color-blue-tint-mid)]">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spice-semantic-info text-[13px] font-bold leading-none text-white"
            >
              i
            </span>
            <p className="text-sm leading-relaxed text-spice-text-medium">
              <span className="font-semibold text-spice-text-primary">
                Ingest Selected Videos:
              </span>{' '}
              This action processes the selected videos and automatically
              creates learning modules from their content.
            </p>
          </div>
        </div>
      </Card>

      {activeStatusSources.map((source) => (
        <IngestRunStatusPanel
          key={source.source_document_id}
          sourceDocumentId={source.source_document_id}
          sourceTitle={source.title}
          initialPollDelayMs={5000}
          onStatusChange={handleStatusChange}
          successAction={
            <div className="flex flex-col gap-2 rounded-lg bg-spice-semantic-successBg px-3 py-2 text-xs text-spice-semantic-success sm:flex-row sm:items-center sm:justify-between">
              <span>
                Ingestion succeeded. Review generated draft modules or upload
                another video.
              </span>
              <Button
                className="h-8 shrink-0 text-xs"
                onClick={() =>
                  goToDraftsForSource(source.source_document_id, source.title)
                }
              >
                Go to Drafts
              </Button>
            </div>
          }
        />
      ))}

      <ReingestConfirmDialog
        open={Boolean(precheckVideoNames.length) || dialogIsBackendDuplicate}
        videoNames={dialogNames}
        isConfirming={isConfirmingDuplicate}
        onCancel={() => {
          if (dialogIsBackendDuplicate) cancelDuplicate();
          else setPrecheckVideoNames([]);
        }}
        onConfirm={() => {
          if (dialogIsBackendDuplicate) {
            void confirmDuplicate();
            return;
          }
          setPrecheckVideoNames([]);
          void runIngest(true);
        }}
      />
    </section>
  );
};
