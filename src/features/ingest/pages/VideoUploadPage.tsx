import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteIcon } from '@/assets/icon';
import {
  SettingsFilterDrawer,
  SettingsFilterTriggerButton,
} from '@/components/common/SettingsFilterDrawer';
import { Table, type ColumnDef } from '@/components/common/Table';
import {
  Button,
  Card,
  Loader,
  SearchInput,
  Select,
  StatusBadge,
  Tooltip,
  TruncatedText,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  type AdminV3IngestAcceptedResponse,
  type AdminV3IngestAcceptedSource,
  type AdminV3IngestBatchStatusResponse,
  type AdminV3IngestUploadResponse,
  type AdminV3IngestUploadedSource,
  type IngestDuplicateConflict,
} from '@/features/ingest/api/adminIngestApi';
import {
  useFetchSourceDocumentsQuery,
  useUpdateSourceDocumentThumbnailMutation,
  type SourceDocumentSummary,
} from '@/features/modules/api/adminSourceDocumentsApi';
import { AssignmentDialog } from '@/features/modules/components/AssignmentDialog';
import { IngestConfigurationPanel } from '@/features/ingest/components/IngestConfigurationPanel';
import { IngestRunStatusPanel } from '@/features/ingest/components/IngestRunStatusPanel';
import { IngestUploadProgress } from '@/features/ingest/components/IngestUploadProgress';
import { DuplicateIngestConfirmDialog } from '@/features/ingest/components/DuplicateIngestConfirmDialog';
import { VideoMetadataEditDialog } from '@/features/ingest/components/VideoMetadataEditDialog';
import { VideoUploadFilters } from '@/features/ingest/components/VideoUploadFilters';
import {
  INGEST_FORM_DEFAULTS,
  type IngestModuleCountInput,
  ingestModuleCountForPayload,
  isOptionalIngestModuleCountValid,
} from '@/features/ingest/constants/ingestFormDefaults';
import {
  mergeActiveVideoIngestSessions,
  pruneActiveVideoIngestBatch,
  readActiveVideoIngestSessions,
} from '@/features/ingest/utils/videoIngestSessionStorage';
import {
  VIDEO_ACCEPTED_FILE_TYPES_LABEL,
  VIDEO_FILE_INPUT_ACCEPT,
  formatVideoFileRejectionError,
  isAcceptedVideoFile,
} from '@/features/ingest/constants/videoAcceptedFileTypes';
import { useIngestWithDuplicateHandling } from '@/features/ingest/hooks/useIngestWithDuplicateHandling';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';
import { hasPendingMergeDecisions } from '@/features/ingest/utils/ingestMergeDecisions';
import {
  isIngestInProgress,
  isIngestSucceeded,
} from '@/features/ingest/utils/ingestStatus';
import {
  EMPTY_VIDEO_UPLOAD_FILTERS,
  VIDEO_UPLOAD_STATUS_OPTIONS,
  hasActiveVideoUploadFilters,
  normalizeVideoUploadStatuses,
  toggleVideoUploadStatus,
  type VideoUploadFiltersState,
} from '@/features/ingest/utils/videoUploadStatusConfig';
import {
  VIDEO_THUMBNAIL_ACCEPT,
  captureVideoFirstFrame,
  formatVideoThumbnailRejectionError,
  isAcceptedVideoThumbnailFile,
  titleFromVideoFilename,
} from '@/features/ingest/utils/videoThumbnail';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

type PendingVideoItem = {
  key: string;
  file: File;
  title: string;
  description: string;
  thumbnailFile: File | null;
  thumbnailPreviewUrl: string | null;
  thumbnailSource: 'auto' | 'custom';
};

type PendingUploadMeta = {
  title: string;
  thumbnailFile: File | null;
};

type VideoRow = {
  id: string;
  selection: string;
  name: string;
  title: string;
  description: string | null;
  uploadedAt: string;
  status: string;
  actions: string;
  sourceDocumentId?: string;
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50].map((value) => ({
  label: String(value),
  value: String(value),
}));

const VIDEO_SEARCH_DEBOUNCE_MS = 300;

function pendingVideoKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function revokePreviewUrl(url: string | null): void {
  if (url) URL.revokeObjectURL(url);
}

function serverStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (!normalized) return 'Uploaded';
  return normalized
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function tableStatusLabel(
  pipelineStatus: string | undefined,
  options?: { assumeInProgress?: boolean },
): string | null {
  if (pipelineStatus) {
    return serverStatusLabel(pipelineStatus);
  }
  if (options?.assumeInProgress) return 'Running';
  return null;
}

function statusBadgeProps(status: string): {
  status: 'success' | 'warning' | 'critical' | 'info' | 'neutral';
  label: string;
} {
  const normalized = status.trim().toLowerCase();
  if (isViewModulesStatus(normalized)) {
    return { status: 'success', label: status };
  }
  if (normalized.includes('fail') || normalized.includes('error')) {
    return { status: 'critical', label: status };
  }
  if (
    normalized.includes('queue') ||
    normalized.includes('running') ||
    normalized.includes('ingest')
  ) {
    return { status: 'info', label: status };
  }
  return { status: 'neutral', label: status };
}

/** Statuses that mean ingestion finished successfully enough to open modules. */
function isViewModulesStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === 'ingested' ||
    normalized === 'succeeded' ||
    normalized === 'partially_succeeded' ||
    normalized === 'partially succeeded'
  );
}

export const VideoUploadPage = () => {
  const navigate = useNavigate();
  const [pendingItems, setPendingItems] = useState<PendingVideoItem[]>([]);
  const [pendingTitleErrorKeys, setPendingTitleErrorKeys] = useState<
    Set<string>
  >(() => new Set());
  const pendingItemsRef = useRef<PendingVideoItem[]>([]);
  const pendingUploadMetaRef = useRef<PendingUploadMeta[]>([]);
  const thumbnailInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const [restoredAcceptedSources, setRestoredAcceptedSources] = useState<
    AdminV3IngestAcceptedSource[]
  >(() =>
    readActiveVideoIngestSessions().map((session) => ({
      source_document_id: session.source_document_id,
      run_id: '',
      title: session.title ?? session.source_document_id,
      source_type: 'video',
      stored_path: '',
    })),
  );
  const [activeBatchId, setActiveBatchId] = useState(
    () => readActiveVideoIngestSessions()[0]?.batch_id ?? '',
  );
  const [batchStatus, setBatchStatus] =
    useState<AdminV3IngestBatchStatusResponse | null>(null);
  const [uploadedSources, setUploadedSources] = useState<
    AdminV3IngestUploadedSource[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, VIDEO_SEARCH_DEBOUNCE_MS);
  const searchQ = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<VideoUploadFiltersState>(
    EMPTY_VIDEO_UPLOAD_FILTERS,
  );
  const [draftFilters, setDraftFilters] = useState<VideoUploadFiltersState>(
    EMPTY_VIDEO_UPLOAD_FILTERS,
  );
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
  const [ingestionInstructions, setIngestionInstructions] = useState('');
  const [assignTarget, setAssignTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [editDocument, setEditDocument] =
    useState<SourceDocumentSummary | null>(null);
  const [documentOverrides, setDocumentOverrides] = useState<
    Record<string, SourceDocumentSummary>
  >({});

  const [updateSourceDocumentThumbnail] =
    useUpdateSourceDocumentThumbnailMutation();

  pendingItemsRef.current = pendingItems;

  useEffect(() => {
    return () => {
      for (const item of pendingItemsRef.current) {
        revokePreviewUrl(item.thumbnailPreviewUrl);
      }
    };
  }, []);

  const filtersActive = hasActiveVideoUploadFilters(appliedFilters);
  const combinedStatuses = useMemo(() => {
    const selected = normalizeVideoUploadStatuses(appliedFilters.statuses);
    // Backend defaults to "ingested" when status is omitted; always send an
    // explicit status list so uploaded / ingesting / failed videos remain visible.
    if (selected.length) return selected;
    return VIDEO_UPLOAD_STATUS_OPTIONS.map((option) => option.value);
  }, [appliedFilters]);

  useEffect(() => {
    setPage(0);
  }, [searchQ]);

  const handleOpenFiltersDrawer = useCallback(() => {
    setDraftFilters(appliedFilters);
    setFiltersDrawerOpen(true);
  }, [appliedFilters]);

  const handleCloseFiltersDrawer = useCallback(() => {
    setDraftFilters(appliedFilters);
    setFiltersDrawerOpen(false);
  }, [appliedFilters]);

  const handleClearDraftFilters = useCallback(() => {
    setDraftFilters(EMPTY_VIDEO_UPLOAD_FILTERS);
    setAppliedFilters(EMPTY_VIDEO_UPLOAD_FILTERS);
    setPage(0);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({
      statuses: normalizeVideoUploadStatuses(draftFilters.statuses),
    });
    setPage(0);
    setFiltersDrawerOpen(false);
  }, [draftFilters]);

  const stageVideoFiles = useCallback((files: ArrayLike<File> | null) => {
    const picked = Array.from(files ?? []);
    if (!picked.length) return;

    const accepted = picked.filter(isAcceptedVideoFile);
    const rejected = picked.filter((file) => !isAcceptedVideoFile(file));
    setFileError(
      rejected.map((file) => formatVideoFileRejectionError(file)).join(' '),
    );
    if (!accepted.length) return;

    setPendingItems((previous) => {
      const staged = new Set(previous.map((item) => item.key));
      const additions: PendingVideoItem[] = [];
      for (const file of accepted) {
        const key = pendingVideoKey(file);
        if (staged.has(key)) continue;
        staged.add(key);
        additions.push({
          key,
          file,
          title: titleFromVideoFilename(file.name),
          description: '',
          thumbnailFile: null,
          thumbnailPreviewUrl: null,
          thumbnailSource: 'auto',
        });
      }
      if (!additions.length) return previous;

      for (const item of additions) {
        void captureVideoFirstFrame(item.file).then((thumbnail) => {
          if (!thumbnail) return;
          const previewUrl = URL.createObjectURL(thumbnail);
          setPendingItems((current) => {
            const existing = current.find((entry) => entry.key === item.key);
            if (!existing) {
              revokePreviewUrl(previewUrl);
              return current;
            }
            if (existing.thumbnailSource === 'custom') {
              revokePreviewUrl(previewUrl);
              return current;
            }
            revokePreviewUrl(existing.thumbnailPreviewUrl);
            return current.map((entry) =>
              entry.key === item.key
                ? {
                    ...entry,
                    thumbnailFile: thumbnail,
                    thumbnailPreviewUrl: previewUrl,
                    thumbnailSource: 'auto' as const,
                  }
                : entry,
            );
          });
        });
      }

      return [...previous, ...additions];
    });
  }, []);

  const removePendingItem = useCallback((key: string) => {
    setPendingItems((previous) => {
      const item = previous.find((entry) => entry.key === key);
      revokePreviewUrl(item?.thumbnailPreviewUrl ?? null);
      return previous.filter((entry) => entry.key !== key);
    });
    setPendingTitleErrorKeys((previous) => {
      if (!previous.has(key)) return previous;
      const next = new Set(previous);
      next.delete(key);
      return next;
    });
  }, []);

  const updatePendingItem = useCallback(
    (key: string, patch: Partial<PendingVideoItem>) => {
      setPendingItems((previous) =>
        previous.map((item) =>
          item.key === key ? { ...item, ...patch } : item,
        ),
      );
    },
    [],
  );

  const handlePendingThumbnailReplace = useCallback(
    (key: string, fileList: FileList | null) => {
      const file = fileList?.[0] ?? null;
      if (!file) return;

      const rejection = formatVideoThumbnailRejectionError(file);
      if (!isAcceptedVideoThumbnailFile(file) || rejection) {
        setFileError(
          rejection || 'Invalid thumbnail. Use PNG, JPEG, or WebP up to 5 MB.',
        );
        return;
      }

      setFileError('');
      const previewUrl = URL.createObjectURL(file);
      setPendingItems((previous) =>
        previous.map((item) => {
          if (item.key !== key) return item;
          revokePreviewUrl(item.thumbnailPreviewUrl);
          return {
            ...item,
            thumbnailFile: file,
            thumbnailPreviewUrl: previewUrl,
            thumbnailSource: 'custom' as const,
          };
        }),
      );
    },
    [],
  );

  const [acceptedSources, setAcceptedSources] = useState<
    AdminV3IngestAcceptedSource[]
  >([]);
  const [precheckConflicts, setPrecheckConflicts] = useState<
    IngestDuplicateConflict[]
  >([]);

  const {
    data: sourceDocumentList,
    isFetching: isLoadingVideos,
    isError: isVideoListError,
    refetch: refetchSourceDocumentList,
  } = useFetchSourceDocumentsQuery({
    source_type: 'video',
    ...(combinedStatuses.length ? { status: combinedStatuses } : {}),
    ...(searchQ ? { q: searchQ } : {}),
    limit: pageSize,
    offset: page * pageSize,
  });

  const serverRows = useMemo<VideoRow[]>(
    () =>
      (sourceDocumentList?.source_documents ?? []).map((document) => {
        const latest = documentOverrides[document.id] ?? document;
        return {
          id: `source:${latest.id}`,
          selection: '',
          name: latest.original_filename || latest.title || latest.id,
          title: latest.title || latest.original_filename || latest.id,
          description: latest.description,
          uploadedAt: latest.ingested_at,
          status: serverStatusLabel(latest.status),
          actions: '',
          sourceDocumentId: latest.id,
        };
      }),
    [documentOverrides, sourceDocumentList],
  );

  const sourceDocumentsById = useMemo(() => {
    const map = new Map<string, SourceDocumentSummary>();
    for (const document of sourceDocumentList?.source_documents ?? []) {
      map.set(document.id, documentOverrides[document.id] ?? document);
    }
    return map;
  }, [documentOverrides, sourceDocumentList]);

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

  const rows = useMemo(() => {
    return serverRows.map((row) => {
      if (!row.sourceDocumentId) return row;
      const sourceStatus = batchStatus?.sources.find(
        (source) => source.source_document_id === row.sourceDocumentId,
      )?.status;
      const liveLabel = tableStatusLabel(sourceStatus ?? batchStatus?.status, {
        assumeInProgress: activeSourceIds.has(row.sourceDocumentId),
      });
      if (!liveLabel || liveLabel === row.status) return row;
      return { ...row, status: liveLabel };
    });
  }, [activeSourceIds, batchStatus, serverRows]);

  const totalServerVideos = sourceDocumentList?.total_source_documents ?? 0;
  const totalPages = Math.max(1, sourceDocumentList?.total_pages ?? 1);

  useEffect(() => {
    if (page >= totalPages) setPage(totalPages - 1);
  }, [page, totalPages]);

  const uploadPendingThumbnails = useCallback(
    async (
      sources: AdminV3IngestUploadedSource[],
      metas: PendingUploadMeta[],
    ) => {
      if (!sources.length || !metas.length) return;

      const failures: string[] = [];
      for (let index = 0; index < sources.length; index += 1) {
        const source = sources[index];
        const meta =
          metas[index] ??
          metas.find((entry) => entry.title === source.title) ??
          null;
        if (!meta?.thumbnailFile) continue;
        try {
          await updateSourceDocumentThumbnail({
            sourceDocumentId: source.source_document_id,
            file: meta.thumbnailFile,
          }).unwrap();
        } catch (error) {
          failures.push(formatRtkQueryError(error));
        }
      }

      if (failures.length) {
        setActionError(
          failures[0] ?? 'Some video thumbnails could not be uploaded.',
        );
      }
    },
    [updateSourceDocumentThumbnail],
  );

  const clearPendingAfterUpload = useCallback(() => {
    setPendingItems((previous) => {
      for (const item of previous) {
        revokePreviewUrl(item.thumbnailPreviewUrl);
      }
      return [];
    });
    setPendingTitleErrorKeys(new Set());
  }, []);

  const handleUploaded = useCallback(
    (
      response: AdminV3IngestUploadResponse,
      {
        isReupload,
      }: {
        isReupload: boolean;
        overriddenFilenames: string[];
        duplicateConflicts: IngestDuplicateConflict[];
      },
    ) => {
      setUploadedSources((previous) =>
        isReupload ? [...previous, ...response.sources] : response.sources,
      );
      const metas = pendingUploadMetaRef.current;
      pendingUploadMetaRef.current = [];
      clearPendingAfterUpload();
      void uploadPendingThumbnails(response.sources, metas).then(() => {
        void refetchSourceDocumentList();
      });
      setActionSuccess('Videos uploaded successfully.');
    },
    [
      clearPendingAfterUpload,
      refetchSourceDocumentList,
      uploadPendingThumbnails,
    ],
  );

  const handleIngestAccepted = useCallback(
    (response: AdminV3IngestAcceptedResponse) => {
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
      if (response.batch_id) {
        setActiveBatchId(response.batch_id);
        mergeActiveVideoIngestSessions(response.batch_id, response.sources);
      }
      setUploadedSources([]);
    },
    [],
  );

  const {
    uploadFiles,
    startIngest,
    confirmDuplicate,
    cancelDuplicate,
    duplicateDialog,
    isUploading,
    isStartingIngest,
    isConfirmingDuplicate,
  } = useIngestWithDuplicateHandling({
    onUploaded: handleUploaded,
    onAccepted: (response) => handleIngestAccepted(response),
    onError: setActionError,
  });

  const pendingMergeDecisions = hasPendingMergeDecisions(
    batchStatus?.merge_decisions,
  );
  const anyIngestionInProgress = isIngestInProgress(
    activeBatchId,
    batchStatus?.status,
    { hasPendingMergeDecisions: pendingMergeDecisions },
  );
  const moduleCountsValid =
    isOptionalIngestModuleCountValid(quizzesPerModule) &&
    isOptionalIngestModuleCountValid(cardsPerModule);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.id)),
    [rows, selectedIds],
  );

  const selectedRowsReadyToIngest = useMemo(
    () => selectedRows.filter((row) => Boolean(row.sourceDocumentId)),
    [selectedRows],
  );

  const canIngest =
    selectedRowsReadyToIngest.length > 0 &&
    moduleCountsValid &&
    !isUploading &&
    !isStartingIngest &&
    !anyIngestionInProgress;

  const runIngest = useCallback(
    async (allowKnownDuplicates: boolean) => {
      const rowsToIngest = selectedRowsReadyToIngest;
      if (!rowsToIngest.length) return;
      setActionError('');
      setActionSuccess('');
      setAcceptedSources([]);
      setBatchStatus(null);
      const overrideDuplicates = rowsToIngest.map(
        (row) =>
          allowKnownDuplicates && row.status.toLowerCase() === 'ingested',
      );
      await startIngest({
        source_document_ids: rowsToIngest.map(
          (row) => row.sourceDocumentId as string,
        ),
        assessment_mode: assessmentMode,
        quizzes_per_module:
          ingestModuleCountForPayload(quizzesPerModule) ?? null,
        cards_per_module: ingestModuleCountForPayload(cardsPerModule) ?? null,
        ingestion_instructions: ingestionInstructions.trim() || null,
        override_duplicates: overrideDuplicates.some(Boolean)
          ? overrideDuplicates
          : null,
      });
    },
    [
      assessmentMode,
      cardsPerModule,
      ingestionInstructions,
      quizzesPerModule,
      selectedRowsReadyToIngest,
      startIngest,
    ],
  );

  const handleStatusChange = useCallback(
    (batchId: string, status: AdminV3IngestBatchStatusResponse | null) => {
      setBatchStatus(status);
      if (!status) return;
      const remainingSessions = pruneActiveVideoIngestBatch(
        batchId,
        hasPendingMergeDecisions(status.merge_decisions)
          ? undefined
          : status.status,
      );
      const remainingIds = new Set(
        remainingSessions.map((session) => session.source_document_id),
      );
      setRestoredAcceptedSources((previous) =>
        previous.filter((source) =>
          remainingIds.has(source.source_document_id),
        ),
      );
      if (
        isIngestSucceeded(status.status) &&
        !hasPendingMergeDecisions(status.merge_decisions)
      ) {
        setSelectedIds((previous) => {
          const next = new Set(previous);
          for (const sourceId of status.sources.map(
            (source) => source.source_document_id,
          )) {
            next.delete(`source:${sourceId}`);
          }
          return next;
        });
      }
    },
    [],
  );

  const activeStatusTitle = useMemo(() => {
    const first =
      acceptedSources[0] ??
      restoredAcceptedSources[0] ??
      uploadedSources[0] ??
      null;
    return first?.title;
  }, [acceptedSources, restoredAcceptedSources, uploadedSources]);

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

  const uploadPendingFiles = useCallback(async () => {
    const items = pendingItems.filter((item) => isAcceptedVideoFile(item.file));
    if (!items.length) return;

    const emptyTitleKeys = items
      .filter((item) => !item.title.trim())
      .map((item) => item.key);
    if (emptyTitleKeys.length) {
      setPendingTitleErrorKeys(new Set(emptyTitleKeys));
      setFileError('Title is required for each video.');
      return;
    }

    setPendingTitleErrorKeys(new Set());
    setActionError('');
    setActionSuccess('');
    setFileError('');

    pendingUploadMetaRef.current = items.map((item) => ({
      title: item.title.trim(),
      thumbnailFile: item.thumbnailFile,
    }));

    const response = await uploadFiles({
      files: items.map((item) => item.file),
      titles: items.map((item) => item.title.trim()),
      descriptions: items.map((item) =>
        item.description.trim() ? item.description.trim() : null,
      ),
      content_domains: items.map(() => contentDomain),
      sync_published_visible: items.map(
        () => INGEST_FORM_DEFAULTS.sync_published_visible,
      ),
    });
    // Pending items are cleared in handleUploaded after a successful upload
    // (including duplicate-confirm flows). Keep them if the dialog opens.
    if (!response) return;
  }, [contentDomain, pendingItems, uploadFiles]);

  const columns = useMemo<Array<ColumnDef<VideoRow>>>(
    () => [
      {
        key: 'selection',
        header: '',
        className: 'w-10 max-w-10 px-2 sm:px-3',
        headerClassName: 'w-10 max-w-10 px-2 sm:px-3',
        render: (row) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.title}`}
            checked={selectedIds.has(row.id)}
            disabled={isUploading}
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
      {
        key: 'name',
        header: 'Video',
        className: 'whitespace-normal',
        render: (row) => (
          <div className="max-w-[22rem] sm:max-w-[28rem]">
            <TruncatedText
              text={row.title}
              focusable
              className="font-medium text-spice-text-primary"
            />
            {row.description ? (
              <p className="mt-0.5 line-clamp-2 text-[11px] text-spice-text-muted">
                {row.description}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'uploadedAt',
        header: 'Date/time',
        className: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (row) => formatDisplayDateTime(row.uploadedAt),
      },
      {
        key: 'status',
        header: 'Status',
        className: 'whitespace-nowrap',
        render: (row) => <StatusBadge {...statusBadgeProps(row.status)} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'min-w-[18rem] whitespace-nowrap',
        headerClassName: 'min-w-[18rem] whitespace-nowrap',
        render: (row) => {
          if (!row.sourceDocumentId) {
            return <span className="text-xs text-spice-text-muted">—</span>;
          }

          return (
            <div className="inline-flex flex-nowrap items-center gap-2">
              <Button
                className="h-8 shrink-0 px-3 text-xs"
                onClick={() => {
                  setActionError('');
                  setActionSuccess('');
                  setAssignTarget({
                    id: row.sourceDocumentId as string,
                    title: row.title,
                  });
                }}
              >
                Assign
              </Button>
              <Button
                variant="secondary"
                className="h-8 shrink-0 px-3 text-xs"
                onClick={() => {
                  const document = sourceDocumentsById.get(
                    row.sourceDocumentId as string,
                  );
                  if (!document) return;
                  setActionError('');
                  setActionSuccess('');
                  setEditDocument(document);
                }}
              >
                Edit
              </Button>
              {isViewModulesStatus(row.status) ? (
                <Button
                  variant="secondary"
                  className="h-8 shrink-0 px-3 text-xs"
                  onClick={() => {
                    const state: ModuleLibraryLocationState = {
                      tab: 'all',
                      sourceDocumentId: row.sourceDocumentId,
                      sourceDocumentTitle: row.title,
                    };
                    navigate(paths.moduleLibrary, { state });
                  }}
                >
                  View modules
                </Button>
              ) : (
                <span className="inline-flex h-8 shrink-0 items-center text-xs text-spice-text-muted ml-3">
                  Not ingested
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [isUploading, navigate, selectedIds, sourceDocumentsById],
  );

  const uploadBusy = isUploading || isStartingIngest || anyIngestionInProgress;
  let uploadButtonLabel = 'Upload';
  if (isUploading) {
    uploadButtonLabel = 'Uploading…';
  } else if (pendingItems.length > 1) {
    uploadButtonLabel = `Upload ${pendingItems.length} videos`;
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
      {actionSuccess ? (
        <div className="rounded-lg bg-spice-semantic-successBg px-3 py-2 text-xs text-spice-semantic-success">
          {actionSuccess}
        </div>
      ) : null}

      <Card variant="elevated" className="min-w-0 space-y-4 p-4 sm:p-6">
        <div className="text-sm font-semibold text-spice-text-primary">
          Upload
        </div>

        <div className="space-y-3">
          {pendingItems.map((item) => {
            const titleInvalid = pendingTitleErrorKeys.has(item.key);
            return (
              <div
                key={item.key}
                className="space-y-3 rounded-lg border border-spice-border bg-spice-bg-surface p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="space-y-2 sm:w-40 sm:shrink-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
                          Thumbnail
                        </span>
                        <button
                          type="button"
                          disabled={uploadBusy}
                          title="Edit thumbnail"
                          aria-label="Edit thumbnail"
                          onClick={() =>
                            thumbnailInputRefs.current.get(item.key)?.click()
                          }
                          className="rounded-md p-1 text-spice-text-muted transition-colors hover:bg-spice-bg-tint hover:text-spice-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
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
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-md border border-spice-border bg-spice-bg-tint">
                        {item.thumbnailPreviewUrl ? (
                          <img
                            src={item.thumbnailPreviewUrl}
                            alt=""
                            className="aspect-video w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-video items-center justify-center text-[11px] text-spice-text-muted">
                            Capturing…
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      ref={(element) => {
                        if (element) {
                          thumbnailInputRefs.current.set(item.key, element);
                        } else {
                          thumbnailInputRefs.current.delete(item.key);
                        }
                      }}
                      type="file"
                      accept={VIDEO_THUMBNAIL_ACCEPT}
                      className="sr-only"
                      disabled={uploadBusy}
                      onChange={(event) => {
                        handlePendingThumbnailReplace(
                          item.key,
                          event.target.files,
                        );
                        event.target.value = '';
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="truncate text-xs text-spice-text-muted">
                      {item.file.name} · {Math.round(item.file.size / 1024)} KB
                    </div>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-spice-text-primary">
                        Title{' '}
                        <span className="text-spice-semantic-error">*</span>
                      </span>
                      <input
                        type="text"
                        value={item.title}
                        disabled={uploadBusy}
                        aria-invalid={titleInvalid}
                        onChange={(event) => {
                          const value = event.target.value;
                          updatePendingItem(item.key, { title: value });
                          if (value.trim()) {
                            setPendingTitleErrorKeys((previous) => {
                              if (!previous.has(item.key)) return previous;
                              const next = new Set(previous);
                              next.delete(item.key);
                              return next;
                            });
                          }
                        }}
                        className={`w-full rounded-md border bg-spice-bg-surface px-3 py-2 text-sm text-spice-text-primary outline-none focus:border-spice-brand-primary focus:ring-2 focus:ring-spice-brand-primary/20 ${
                          titleInvalid
                            ? 'border-spice-semantic-error'
                            : 'border-spice-border'
                        }`}
                      />
                      {titleInvalid ? (
                        <span className="text-[11px] text-spice-semantic-error">
                          Title is required.
                        </span>
                      ) : null}
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-spice-text-primary">
                        Description
                      </span>
                      <textarea
                        value={item.description}
                        disabled={uploadBusy}
                        rows={2}
                        onChange={(event) =>
                          updatePendingItem(item.key, {
                            description: event.target.value,
                          })
                        }
                        className="w-full resize-y rounded-md border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm text-spice-text-primary outline-none focus:border-spice-brand-primary focus:ring-2 focus:ring-spice-brand-primary/20"
                      />
                    </label>
                  </div>

                  <Button
                    variant="ghost"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-start p-0 text-spice-semantic-error hover:bg-spice-semantic-errorBg"
                    disabled={uploadBusy}
                    aria-label={`Remove ${item.file.name}`}
                    title="Remove"
                    onClick={() => removePendingItem(item.key)}
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          <label
            aria-label={
              pendingItems.length ? 'Add more videos' : 'Upload video'
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
              disabled={uploadBusy}
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
              {pendingItems.length ? 'Add more videos' : 'Upload videos'}
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

        <IngestUploadProgress active={isUploading} label="Uploading videos…" />

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            disabled={!pendingItems.length || uploadBusy}
            onClick={() => void uploadPendingFiles()}
          >
            {uploadButtonLabel}
          </Button>
        </div>
      </Card>

      <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-spice-text-primary">
              <span>Uploaded videos</span>
              <Tooltip
                label="About uploaded videos"
                content="Previously ingested videos must be chosen again before they can be selected for re-ingestion."
              />
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search videos…"
              aria-label="Search uploaded videos"
              className="h-9"
            />
            <SettingsFilterTriggerButton
              ariaLabel="Open video filters"
              active={filtersActive}
              expanded={filtersDrawerOpen}
              tooltip={
                filtersActive
                  ? 'Status filters are applied. Open filters to edit or clear them.'
                  : 'Filter uploaded videos by status'
              }
              onClick={handleOpenFiltersDrawer}
            />
          </div>
        </div>

        {isVideoListError ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            Unable to load uploaded videos.
          </div>
        ) : null}
        <SettingsFilterDrawer
          open={filtersDrawerOpen}
          onClose={handleCloseFiltersDrawer}
          title="Filters"
          description="Choose one or more statuses, then click Apply to update the table."
          closeLabel="Close video filters"
          titleId="video-upload-filters-title"
          descriptionId="video-upload-filters-desc"
        >
          <VideoUploadFilters
            filters={draftFilters}
            onToggleStatus={(status) => {
              setDraftFilters((current) =>
                toggleVideoUploadStatus(current, status),
              );
            }}
            onClearAll={handleClearDraftFilters}
            onApply={handleApplyFilters}
          />
        </SettingsFilterDrawer>
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
            Showing {serverRows.length ? page * pageSize + 1 : 0}–
            {page * pageSize + serverRows.length} of {totalServerVideos}
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
        <IngestConfigurationPanel
          disabled={isUploading || isStartingIngest || anyIngestionInProgress}
          assessmentMode={assessmentMode}
          onAssessmentModeChange={setAssessmentMode}
          contentDomain={contentDomain}
          onContentDomainChange={setContentDomain}
          cardsPerModule={cardsPerModule}
          onCardsPerModuleChange={setCardsPerModule}
          quizzesPerModule={quizzesPerModule}
          onQuizzesPerModuleChange={setQuizzesPerModule}
          ingestionInstructions={ingestionInstructions}
          onIngestionInstructionsChange={setIngestionInstructions}
          instructionsPlaceholder="e.g. Focus on the key workflows demonstrated in the video…"
        />

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              disabled={!canIngest}
              onClick={() => {
                const alreadyIngestedRows = selectedRowsReadyToIngest.filter(
                  (row) => row.status.toLowerCase() === 'ingested',
                );
                if (alreadyIngestedRows.length) {
                  setPrecheckConflicts(
                    alreadyIngestedRows.map((row) => ({
                      filename: row.name,
                      title: row.title,
                      content_sha256: row.sourceDocumentId ?? row.id,
                      existing_source_documents: row.sourceDocumentId
                        ? [
                            {
                              source_document_id: row.sourceDocumentId,
                              title: row.title,
                              original_filename: row.name,
                              ingested_at: row.uploadedAt,
                              status: row.status,
                            },
                          ]
                        : [],
                    })),
                  );
                  return;
                }
                void runIngest(false);
              }}
            >
              {isStartingIngest
                ? 'Starting…'
                : anyIngestionInProgress
                  ? 'Ingestion in progress…'
                  : 'Ingest Selected Videos'}
            </Button>
          </div>
        </div>
      </Card>

      {activeBatchId ? (
        <IngestRunStatusPanel
          batchId={activeBatchId}
          sourceTitle={activeStatusTitle}
          initialPollDelayMs={5000}
          onStatusChange={handleStatusChange}
          onGoToDrafts={() => {
            const first =
              acceptedSources[0] ?? restoredAcceptedSources[0] ?? null;
            if (!first) return;
            goToDraftsForSource(first.source_document_id, first.title);
          }}
        />
      ) : null}

      <DuplicateIngestConfirmDialog
        open={precheckConflicts.length > 0 && !duplicateDialog.open}
        variant="blocked"
        conflicts={precheckConflicts}
        isConfirming={isConfirmingDuplicate}
        onCancel={() => setPrecheckConflicts([])}
        onConfirm={(selectedFilenames) => {
          setPrecheckConflicts([]);
          void runIngest(selectedFilenames.length > 0);
        }}
      />

      <DuplicateIngestConfirmDialog
        open={duplicateDialog.open}
        variant={duplicateDialog.variant}
        conflicts={duplicateDialog.conflicts}
        onCancel={() => {
          pendingUploadMetaRef.current = [];
          cancelDuplicate();
        }}
        onConfirm={(selectedFilenames) => {
          void confirmDuplicate(selectedFilenames);
        }}
        isConfirming={isConfirmingDuplicate}
      />

      {assignTarget ? (
        <AssignmentDialog
          open
          onClose={() => setAssignTarget(null)}
          target={{
            kind: 'video',
            id: assignTarget.id,
            title: assignTarget.title,
          }}
          onAssigned={() => {
            setActionSuccess('Video assigned successfully.');
            setAssignTarget(null);
          }}
        />
      ) : null}

      <VideoMetadataEditDialog
        open={Boolean(editDocument)}
        document={editDocument}
        onClose={() => setEditDocument(null)}
        onSaved={(document) => {
          setDocumentOverrides((previous) => ({
            ...previous,
            [document.id]: document,
          }));
          setActionSuccess('Video details updated.');
          void refetchSourceDocumentList();
        }}
      />
    </section>
  );
};
