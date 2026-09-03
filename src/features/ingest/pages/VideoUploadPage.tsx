import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRightIcon, DeleteIcon, EyeIcon } from '@/assets/icon';
import { PageTitle } from '@/components/common/PageTitle';
import {
  SettingsFilterDrawer,
  SettingsFilterTriggerButton,
} from '@/components/common/SettingsFilterDrawer';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import {
  Banner,
  Button,
  Card,
  FieldGroupLabel,
  FileDropzone,
  FormHelperText,
  FormLabel,
  LimitedTextInput,
  LimitedTextarea,
  SearchInput,
  SectionHeader,
  StatusBadge,
  TABLE_STATUS_BADGE_CLASSNAME,
  Tooltip,
  TruncatedText,
  typographyClasses,
  useSnackbar,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  FIELD_LIMITS,
  TABLE_CELL_LABEL_MAX_LENGTH,
  TABLE_TITLE_COLUMN_CLASS,
} from '@/constants/fieldLimits';
import { SPICE_CHECKBOX_CLASSNAME } from '@/constants/formControls';
import { INGEST_MEDIA_MAX_UPLOAD_LABEL } from '@/constants/uploadLimits';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTablePageInput } from '@/hooks/useTablePageInput';
import {
  DEFAULT_TABLE_PAGE_SIZE,
  TABLE_PAGE_SIZE_OPTIONS,
  tableHasNextPage,
  tableHasPrevPage,
  tablePageOffset,
  tablePaginationRange,
} from '@/utils/tablePagination';
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
  isIngestionInstructionsValid,
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
import { useClearIngestSessionOnTerminalLeave } from '@/features/ingest/hooks/useClearIngestSessionOnTerminalLeave';
import { useIngestWithDuplicateHandling } from '@/features/ingest/hooks/useIngestWithDuplicateHandling';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';
import type { OpenDocumentAssignmentState } from '@/features/modules/types/assignmentSuccessNavigation.types';
import { hasPendingMergeDecisions } from '@/features/ingest/utils/ingestMergeDecisions';
import {
  isIngestInProgress,
  isIngestSucceeded,
} from '@/features/ingest/utils/ingestStatus';
import {
  EMPTY_VIDEO_UPLOAD_FILTERS,
  VIDEO_UPLOAD_STATUS_OPTIONS,
  hasActiveVideoUploadFilters,
  isVideoUploadDateRangeInvalid,
  normalizeVideoUploadFilters,
  normalizeVideoUploadStatuses,
  toggleVideoUploadStatus,
  type VideoUploadFiltersState,
} from '@/features/ingest/utils/videoUploadStatusConfig';
import {
  uploadedDateInputToFromIso,
  uploadedDateInputToToIso,
} from '@/features/knowledge-library/utils/knowledgeLibraryFilters';
import {
  VIDEO_THUMBNAIL_ACCEPT,
  captureVideoFirstFrame,
  formatVideoThumbnailRejectionError,
  isAcceptedVideoThumbnailFile,
  titleFromVideoFilename,
} from '@/features/ingest/utils/videoThumbnail';
import { formatHierarchyActorName } from '@/features/modules/types/hierarchyActor';
import { getKnowledgeDocumentStatusBadgeProps } from '@/features/knowledge-library/utils/knowledgeDocumentStatusBadge';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';
import { countNewlyUploadedSources } from '@/features/ingest/utils/parseIngestDuplicateError';
import {
  DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
  formatDisplayDateTime,
} from '@/utils/formatDisplayDateTime';
import { cn } from '@/utils';

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
  uploadedBy: string | null;
  ingestedAt: string;
  ingestedBy: string | null;
  status: string;
  actions: string;
  sourceDocumentId?: string;
};

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

/** Statuses that mean modules need review due to similarity or merge requirement. */
function isNeedsReviewStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === 'needs_review' ||
    normalized === 'review_pending' ||
    normalized === 'pending_review' ||
    normalized === 'review pending' ||
    normalized === 'needs review'
  );
}

export const VideoUploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const snackbar = useSnackbar();
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fileError, setFileError] = useState('');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, VIDEO_SEARCH_DEBOUNCE_MS);
  const searchQ = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [paginationTotalPages, setPaginationTotalPages] = useState(1);
  const {
    page,
    setPage,
    pageInput,
    resetPage,
    commitPageInput,
    handlePageInputChange,
  } = useTablePageInput(paginationTotalPages);
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
    const state = (location.state ?? {}) as OpenDocumentAssignmentState;
    const open = state.openDocumentAssignment;
    if (!open || open.noun !== 'video') return;

    setAssignTarget({
      id: open.sourceDocumentId,
      title: open.title,
    });
    navigate(location.pathname, { replace: true, state: undefined });
  }, [location.pathname, location.state, navigate]);

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
    resetPage();
  }, [searchQ, resetPage]);

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
    resetPage();
  }, [resetPage]);

  const handleApplyFilters = useCallback(() => {
    if (isVideoUploadDateRangeInvalid(draftFilters)) return;
    setAppliedFilters(normalizeVideoUploadFilters(draftFilters));
    resetPage();
    setFiltersDrawerOpen(false);
  }, [draftFilters, resetPage]);

  const stageVideoFiles = useCallback((files: ArrayLike<File> | null) => {
    const picked = Array.from(files ?? []);
    if (!picked.length) return;

    const accepted = picked.filter(isAcceptedVideoFile);
    const rejected = picked.filter((file) => !isAcceptedVideoFile(file));
    const rejectionMessage = rejected
      .map((file) => formatVideoFileRejectionError(file))
      .join(' ');
    if (rejectionMessage) {
      snackbar.showError(rejectionMessage);
    }
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

  const pendingVideoFiles = useMemo(
    () => pendingItems.map((item) => item.file),
    [pendingItems],
  );

  const handlePendingVideoFilesChange = useCallback(
    (nextFiles: File[]) => {
      const currentKeys = new Set(
        pendingItems.map((item) => pendingVideoKey(item.file)),
      );
      const added = nextFiles.filter(
        (file) => !currentKeys.has(pendingVideoKey(file)),
      );
      if (added.length) {
        stageVideoFiles(added);
      }
    },
    [pendingItems, stageVideoFiles],
  );

  const handlePendingThumbnailReplace = useCallback(
    (key: string, fileList: FileList | null) => {
      const file = fileList?.[0] ?? null;
      if (!file) return;

      const rejection = formatVideoThumbnailRejectionError(file);
      if (!isAcceptedVideoThumbnailFile(file) || rejection) {
        snackbar.showError(
          rejection || 'Invalid thumbnail. Use PNG, JPEG, or WebP up to 5 MB.',
        );
        return;
      }

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

  const [sortBy, setSortBy] = useState<string | undefined>('ingested_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = useCallback(
    (newSortBy: string, newSortDir: 'asc' | 'desc') => {
      setSortBy(newSortBy);
      setSortDir(newSortDir);
      resetPage();
    },
    [resetPage],
  );

  const {
    data: sourceDocumentList,
    isLoading: isLoadingVideos,
    isFetching: isFetchingVideos,
    isError: isVideoListError,
    error: videoListError,
    refetch: refetchSourceDocumentList,
  } = useFetchSourceDocumentsQuery({
    source_type: 'video',
    ...(combinedStatuses.length ? { status: combinedStatuses } : {}),
    ...(searchQ ? { q: searchQ } : {}),
    ...(appliedFilters.uploadedAtFrom
      ? {
          uploaded_from: uploadedDateInputToFromIso(
            appliedFilters.uploadedAtFrom,
          ),
        }
      : {}),
    ...(appliedFilters.uploadedAtTo
      ? {
          uploaded_to: uploadedDateInputToToIso(appliedFilters.uploadedAtTo),
        }
      : {}),
    limit: pageSize,
    offset: tablePageOffset(page, pageSize),
    sort_by: sortBy,
    sort_dir: sortDir,
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
          uploadedAt: latest.uploaded_date || latest.ingested_at,
          uploadedBy: latest.uploaded_by?.name ?? null,
          ingestedAt: latest.ingested_at,
          ingestedBy: latest.ingested_by?.name ?? null,
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
      const batchSource = batchStatus?.sources.find(
        (source) => source.source_document_id === row.sourceDocumentId,
      );
      const sourceStatus =
        batchSource?.status ?? (batchSource ? batchStatus?.status : undefined);
      const liveLabel = tableStatusLabel(sourceStatus, {
        assumeInProgress: activeSourceIds.has(row.sourceDocumentId),
      });
      if (!liveLabel || liveLabel === row.status) return row;
      return { ...row, status: liveLabel };
    });
  }, [activeSourceIds, batchStatus, serverRows]);

  const totalServerVideos = sourceDocumentList?.total_source_documents ?? 0;
  const totalPages = Math.max(1, sourceDocumentList?.total_pages ?? 1);
  const hasPrevPage = tableHasPrevPage(page);
  const hasNextPage = tableHasNextPage(page, totalPages);
  const { start: rangeStart, end: rangeEnd } = tablePaginationRange(
    page,
    pageSize,
    serverRows.length,
  );

  useEffect(() => {
    setPaginationTotalPages(totalPages);
  }, [totalPages]);

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
        snackbar.showError(
          failures[0] ?? 'Some video thumbnails could not be uploaded.',
        );
      }
    },
    [snackbar, updateSourceDocumentThumbnail],
  );

  const clearPendingDrafts = useCallback(() => {
    setPendingItems((previous) => {
      for (const item of previous) {
        revokePreviewUrl(item.thumbnailPreviewUrl);
      }
      return [];
    });
    setPendingTitleErrorKeys(new Set());
    setFileError('');
    pendingUploadMetaRef.current = [];
  }, []);

  const clearPendingAfterUpload = clearPendingDrafts;

  const handleUploaded = useCallback(
    (
      response: AdminV3IngestUploadResponse,
      context: {
        isReupload: boolean;
        overriddenFilenames: string[];
        duplicateConflicts: IngestDuplicateConflict[];
      },
    ) => {
      const metas = pendingUploadMetaRef.current;
      pendingUploadMetaRef.current = [];
      clearPendingAfterUpload();
      void uploadPendingThumbnails(response.sources, metas).then(() => {
        void refetchSourceDocumentList();
      });
      const newlyUploadedCount = countNewlyUploadedSources(response, context);
      const isSkipUploadReuse =
        context.isReupload && context.overriddenFilenames.length === 0;
      if (newlyUploadedCount > 0 && !isSkipUploadReuse) {
        snackbar.showSuccess(
          newlyUploadedCount === 1
            ? 'Video uploaded successfully.'
            : 'Videos uploaded successfully.',
        );
      }
    },
    [
      clearPendingAfterUpload,
      refetchSourceDocumentList,
      snackbar,
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
    onError: (message) => snackbar.showError(message),
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
  const ingestionInstructionsValid = isIngestionInstructionsValid(
    ingestionInstructions,
  );

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
    ingestionInstructionsValid &&
    !isUploading &&
    !isStartingIngest &&
    !anyIngestionInProgress;

  const runIngest = useCallback(async () => {
    const rowsToIngest = selectedRowsReadyToIngest;
    if (!rowsToIngest.length) return;
    setAcceptedSources([]);
    setBatchStatus(null);
    await startIngest({
      source_document_ids: rowsToIngest.map(
        (row) => row.sourceDocumentId as string,
      ),
      assessment_mode: assessmentMode,
      quizzes_per_module: ingestModuleCountForPayload(quizzesPerModule) ?? null,
      cards_per_module: ingestModuleCountForPayload(cardsPerModule) ?? null,
      ingestion_instructions: ingestionInstructions.trim() || null,
      override_duplicates: null,
    });
  }, [
    assessmentMode,
    cardsPerModule,
    ingestionInstructions,
    quizzesPerModule,
    selectedRowsReadyToIngest,
    startIngest,
  ]);

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

  useClearIngestSessionOnTerminalLeave({
    batchId: activeBatchId,
    status: batchStatus,
    onClear: (batchId, status) => {
      pruneActiveVideoIngestBatch(batchId, status.status);
    },
  });

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

  const goToNeedsReviewForSource = useCallback(
    (sourceDocumentId: string, sourceTitle?: string) => {
      const state: ModuleLibraryLocationState = {
        tab: 'needs_review',
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
      snackbar.showError('Title is required for each video.');
      return;
    }

    setPendingTitleErrorKeys(new Set());

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
  }, [contentDomain, pendingItems, snackbar, uploadFiles]);

  const columns = useMemo<Array<ColumnDef<VideoRow>>>(
    () => [
      {
        key: 'selection',
        header: '',
        sortable: false,
        className: 'w-10 max-w-10 px-2 sm:px-3',
        headerClassName: 'w-10 max-w-10 px-2 sm:px-3',
        render: (row) => (
          <input
            type="checkbox"
            className={SPICE_CHECKBOX_CLASSNAME}
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
        sortable: true,
        sortKey: 'title',
        headerClassName: TABLE_TITLE_COLUMN_CLASS,
        className: TABLE_TITLE_COLUMN_CLASS,
        render: (row) => (
          <div className="w-full min-w-0">
            <TruncatedText
              text={row.title}
              maxChars={TABLE_CELL_LABEL_MAX_LENGTH}
              focusable
              className={typographyClasses.tableCellPrimary}
            />
            {row.description ? (
              <p
                className={cn(
                  'mt-0.5 line-clamp-2',
                  typographyClasses.tableCellSecondary,
                )}
              >
                {row.description}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'uploadedAt',
        header: 'Uploaded',
        sortable: true,
        sortKey: 'uploaded_date',
        className: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
        headerClassName: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
        render: (row) => formatDisplayDateTime(row.uploadedAt),
      },
      {
        key: 'uploadedBy',
        header: 'Uploaded By',
        sortable: false,
        className: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (row) => formatHierarchyActorName(row.uploadedBy),
      },
      {
        key: 'ingestedAt',
        header: 'Ingested Date',
        sortable: true,
        sortKey: 'ingested_at',
        className: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
        headerClassName: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
        render: (row) => formatDisplayDateTime(row.ingestedAt),
      },
      {
        key: 'ingestedBy',
        header: 'Ingested By',
        sortable: false,
        className: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (row) => formatHierarchyActorName(row.ingestedBy),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortKey: 'status',
        className: 'whitespace-nowrap',
        render: (row) => (
          <StatusBadge
            {...getKnowledgeDocumentStatusBadgeProps(row.status)}
            className={TABLE_STATUS_BADGE_CLASSNAME}
          />
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        sortable: false,
        className: 'min-w-[18rem] whitespace-nowrap',
        headerClassName: 'min-w-[18rem] whitespace-nowrap',
        render: (row) => {
          if (!row.sourceDocumentId) {
            return <span className="text-spice-text-muted">—</span>;
          }

          return (
            <div className="inline-flex flex-nowrap items-center gap-2">
              <Button
                className="h-8 shrink-0 px-3 text-xs"
                onClick={() => {
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
                  setEditDocument(document);
                }}
              >
                Edit
              </Button>
              {isNeedsReviewStatus(row.status) ? (
                <Button
                  variant="secondary"
                  className="h-8 shrink-0 px-3 text-xs font-semibold text-spice-brand-primary"
                  onClick={() => {
                    goToNeedsReviewForSource(
                      row.sourceDocumentId as string,
                      row.title,
                    );
                  }}
                >
                  Review modules
                </Button>
              ) : isViewModulesStatus(row.status) ? (
                <Button
                  variant="secondary"
                  className="h-8 w-[9.25rem] shrink-0 gap-1.5 px-3 text-xs"
                  onClick={() => {
                    goToDraftsForSource(
                      row.sourceDocumentId as string,
                      row.title,
                    );
                  }}
                >
                  <EyeIcon className="h-3.5 w-3.5" />
                  View modules
                </Button>
              ) : (
                <StatusBadge
                  status="neutral"
                  label="Not ingested"
                  className={TABLE_STATUS_BADGE_CLASSNAME}
                />
              )}
            </div>
          );
        },
      },
    ],
    [
      goToDraftsForSource,
      goToNeedsReviewForSource,
      isUploading,
      selectedIds,
      sourceDocumentsById,
    ],
  );

  const uploadBusy = isUploading || isStartingIngest || anyIngestionInProgress;
  let uploadButtonLabel = 'Upload';
  if (isUploading) {
    uploadButtonLabel = 'Uploading…';
  } else if (pendingItems.length > 1) {
    uploadButtonLabel = `Upload ${pendingItems.length} videos`;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle
          title="Video Upload"
          subtitle="Upload videos and generate learning modules from their content."
        />
        <Button
          variant="secondary"
          className="inline-flex items-center gap-1.5"
          onClick={() => navigate(paths.moduleLibrary)}
        >
          Module Library
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Card variant="elevated" className="min-w-0 space-y-3 p-3 sm:p-4">
        <div className="space-y-2">
          {pendingItems.map((item) => {
            const titleInvalid = pendingTitleErrorKeys.has(item.key);
            return (
              <div
                key={item.key}
                className="space-y-2 rounded-lg border border-spice-border bg-spice-bg-surface p-2.5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="space-y-2 sm:w-40 sm:shrink-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <FieldGroupLabel>Thumbnail</FieldGroupLabel>
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
                      <div className="flex min-h-[96px] items-center justify-center overflow-hidden rounded-md border border-spice-border bg-spice-bg-tint p-1">
                        {item.thumbnailPreviewUrl ? (
                          <img
                            src={item.thumbnailPreviewUrl}
                            alt=""
                            draggable={false}
                            className="max-h-[128px] max-w-full object-contain"
                          />
                        ) : (
                          <div className="flex min-h-[96px] items-center justify-center text-xs text-spice-text-muted">
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
                      tabIndex={-1}
                      className="sr-only"
                      disabled={uploadBusy}
                      onFocus={(event) => {
                        event.currentTarget.blur();
                      }}
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
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <FormLabel
                          htmlFor={`pending-video-title-${item.key}`}
                          required
                        >
                          Title
                        </FormLabel>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          className="shrink-0 text-spice-semantic-error hover:bg-spice-semantic-errorBg"
                          disabled={uploadBusy}
                          aria-label={`Remove ${item.file.name}`}
                          title="Remove"
                          onClick={() => removePendingItem(item.key)}
                        >
                          <DeleteIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <LimitedTextInput
                        id={`pending-video-title-${item.key}`}
                        value={item.title}
                        maxLength={FIELD_LIMITS.documentTitle}
                        disabled={uploadBusy}
                        aria-invalid={titleInvalid}
                        inputClassName={
                          titleInvalid
                            ? 'h-auto rounded-md border-spice-semantic-error py-2'
                            : 'h-auto rounded-md py-2'
                        }
                        onChange={(value) => {
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
                      />
                      {titleInvalid ? (
                        <span className="text-xs text-spice-semantic-error">
                          Title is required.
                        </span>
                      ) : null}
                    </div>
                    <label className="block space-y-1">
                      <FormLabel
                        htmlFor={`pending-video-description-${item.key}`}
                      >
                        Description
                      </FormLabel>
                      <LimitedTextarea
                        id={`pending-video-description-${item.key}`}
                        value={item.description}
                        maxLength={FIELD_LIMITS.description}
                        disabled={uploadBusy}
                        rows={2}
                        textareaClassName="min-h-0 rounded-md border-spice-border-mid"
                        onChange={(description) =>
                          updatePendingItem(item.key, { description })
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}

          <FileDropzone
            files={pendingVideoFiles}
            onChange={handlePendingVideoFilesChange}
            accept={VIDEO_FILE_INPUT_ACCEPT}
            multiple
            disabled={uploadBusy}
            title="Upload videos"
            titleWhenSelected="Add more videos"
            subtitle="Click to select or drag and drop videos"
            hideSubtitleWhenSelected
            ariaLabel={pendingItems.length ? 'Add more videos' : 'Upload video'}
            validateFile={(file) =>
              isAcceptedVideoFile(file)
                ? null
                : formatVideoFileRejectionError(file)
            }
            onReject={setFileError}
          />

          {fileError ? <Banner tone="critical">{fileError}</Banner> : null}

          <FormHelperText>
            {VIDEO_ACCEPTED_FILE_TYPES_LABEL} · {INGEST_MEDIA_MAX_UPLOAD_LABEL}
          </FormHelperText>
        </div>

        <IngestUploadProgress active={isUploading} label="Uploading videos…" />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            disabled={uploadBusy}
            onClick={clearPendingDrafts}
          >
            Reset
          </Button>
          <Button
            disabled={!pendingItems.length || uploadBusy}
            onClick={() => void uploadPendingFiles()}
          >
            {uploadButtonLabel}
          </Button>
        </div>
      </Card>

      <Card variant="elevated" className="space-y-2 p-4 sm:p-6">
        <SectionHeader
          title="Uploaded videos"
          variant="h2"
          titleAccessory={
            <Tooltip
              label="About uploaded videos"
              content="Previously ingested videos must be chosen again before they can be selected for re-ingestion."
            />
          }
          action={
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
                    ? 'Filters are applied. Open filters to edit or clear them.'
                    : 'Filter uploaded videos by status or uploaded date'
                }
                onClick={handleOpenFiltersDrawer}
              />
            </div>
          }
        />

        <SettingsFilterDrawer
          open={filtersDrawerOpen}
          onClose={handleCloseFiltersDrawer}
          title="Filters"
          description="Choose status and/or uploaded date range, then click Apply to update the table."
          closeLabel="Close video filters"
          titleId="video-upload-filters-title"
          descriptionId="video-upload-filters-desc"
        >
          <VideoUploadFilters
            filters={draftFilters}
            onChange={setDraftFilters}
            onToggleStatus={(status) => {
              setDraftFilters((current) =>
                toggleVideoUploadStatus(current, status),
              );
            }}
            onClearAll={handleClearDraftFilters}
            onApply={handleApplyFilters}
          />
        </SettingsFilterDrawer>
        <Table
          data={rows}
          columns={columns}
          keyExtractor={(row) => row.id}
          caption="Uploaded videos"
          isLoading={isLoadingVideos}
          loadingMessage="Loading uploaded videos…"
          emptyMessage="No videos uploaded yet."
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          queryError={
            isVideoListError && !isFetchingVideos ? videoListError : undefined
          }
          queryErrorTitle="Unable to load uploaded videos"
          onRetryQuery={() => void refetchSourceDocumentList()}
        />

        <TablePagination
          page={page}
          pageSize={pageSize}
          pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
          totalItems={totalServerVideos}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          pageInput={pageInput}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(0);
          }}
          onPageInputChange={handlePageInputChange}
          onCommitPageInput={commitPageInput}
          onPrevPage={() => setPage((current) => Math.max(0, current - 1))}
          onNextPage={() => setPage((current) => current + 1)}
          rowsPerPageAriaLabel="Videos per page"
          className="border-t border-spice-border px-0 pt-3"
        />
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
            <Button disabled={!canIngest} onClick={() => void runIngest()}>
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
          initialPollDelayMs={5000}
          onStatusChange={handleStatusChange}
          onGoToDrafts={goToDraftsForSource}
          onGoToNeedsReview={goToNeedsReviewForSource}
        />
      ) : null}

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
            kind: 'sourceDocument',
            id: assignTarget.id,
            title: assignTarget.title,
            noun: 'video',
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
          snackbar.showSuccess('Video details updated.');
          void refetchSourceDocumentList();
        }}
      />
    </section>
  );
};
