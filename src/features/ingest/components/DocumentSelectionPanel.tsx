import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import {
  Banner,
  Button,
  FileDropzone,
  SearchInput,
  StatusBadge,
  TruncatedText,
} from '@/components/ui';
import type { StatusBadgeProps } from '@/components/ui/StatusBadge';
import { paths } from '@/constants/routes';
import {
  TABLE_CELL_LABEL_MAX_LENGTH,
  TABLE_TITLE_COLUMN_CLASS,
} from '@/constants/fieldLimits';
import { SPICE_CHECKBOX_CLASSNAME } from '@/constants/formControls';
import { cn } from '@/utils';
import type {
  AdminV3IngestUploadPayload,
  AdminV3IngestUploadResponse,
  AdminV3IngestBatchSourceStatus,
  IngestContentDomain,
} from '@/features/ingest/api/adminIngestApi';
import { IngestUploadProgress } from '@/features/ingest/components/IngestUploadProgress';
import {
  DOCUMENT_SELECTION_PAGE_SIZE_OPTIONS,
  DOCUMENT_SELECTION_SEARCH_DEBOUNCE_MS,
  DEFAULT_DOCUMENT_SELECTION_PAGE_SIZE,
  INGESTABLE_KNOWLEDGE_SOURCE_TYPES,
  MAX_DOCUMENT_SELECTION,
} from '@/features/ingest/constants/documentSelection';
import {
  INGEST_ACCEPTED_FILE_TYPES_LABEL,
  INGEST_FILE_INPUT_ACCEPT,
  formatIngestFileRejectionError,
  isIngestAcceptedFile,
} from '@/features/ingest/constants/ingestAcceptedFileTypes';
import { INGEST_FORM_DEFAULTS } from '@/features/ingest/constants/ingestFormDefaults';
import type { SelectedIngestDocument } from '@/features/ingest/types/documentSelection.types';
import { formatIngestRunStatusDisplay } from '@/features/ingest/utils/ingestRunHistoryUtils';
import { readRecentIngestDocuments } from '@/features/ingest/utils/recentIngestDocumentsStorage';
import { isIngestSucceeded } from '@/features/ingest/utils/ingestStatus';
import { useFetchSourceDocumentsQuery } from '@/features/modules/api/adminSourceDocumentsApi';
import { formatHierarchyActorName } from '@/features/modules/types/hierarchyActor';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';

type DocumentSelectionRow = {
  id: string;
  title: string;
  originalFilename: string | null;
  sourceType: string;
  status: string;
  uploadedAt: string;
  uploadedBy: string | null;
  ingestedBy: string | null;
  selection: '';
  actions: '';
};

export interface DocumentSelectionPanelProps {
  selectedDocuments: SelectedIngestDocument[];
  onSelectedDocumentsChange: (documents: SelectedIngestDocument[]) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  contentDomain?: IngestContentDomain;
  disabled?: boolean;
  /** Shared duplicate-handling upload path from the page. */
  uploadFiles: (
    payload: AdminV3IngestUploadPayload,
  ) => Promise<AdminV3IngestUploadResponse | null>;
  isUploading?: boolean;
  /** Increments after successful upload (including duplicate-confirm reuse). */
  uploadClearSignal?: number;
  /** Live batch source rows used to overlay ingesting/completed statuses. */
  batchSources?: AdminV3IngestBatchSourceStatus[];
  /** Existing sources kept during an active ingest batch (session-backed). */
  keptExistingSourceIds?: readonly string[];
}

function documentStatusBadge(
  status: string,
): Pick<StatusBadgeProps, 'status' | 'label'> {
  const normalized = status.trim().toLowerCase();
  const label = formatIngestRunStatusDisplay(status);
  switch (normalized) {
    case 'ingested':
    case 'succeeded':
      return { status: 'success', label };
    case 'ingesting':
    case 'uploaded':
      return { status: 'info', label };
    case 'failed':
      return { status: 'critical', label };
    case 'retired':
      return { status: 'warning', label };
    default:
      return { status: 'neutral', label };
  }
}

function titleFromFilename(filename: string): string {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0) return trimmed;
  return trimmed.slice(0, dot) || trimmed;
}

/** Statuses that mean ingestion finished and modules can be opened. */
function isIngestedDocumentStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === 'ingested' ||
    normalized === 'succeeded' ||
    normalized === 'partially_succeeded' ||
    normalized === 'partially succeeded'
  );
}

function resolveDocumentCatalogStatus(
  catalogStatus: string,
  sourceDocumentId: string,
  batchSources: AdminV3IngestBatchSourceStatus[],
  recentlyIngestedIds: ReadonlySet<string>,
): string {
  const batchSource = batchSources.find(
    (source) => source.source_document_id === sourceDocumentId,
  );
  if (batchSource?.status) {
    if (isIngestSucceeded(batchSource.status)) return 'ingested';
    const normalized = batchSource.status.trim().toLowerCase();
    if (
      normalized.includes('fail') ||
      normalized.includes('error') ||
      normalized.includes('running') ||
      normalized.includes('queue') ||
      normalized.includes('ingest')
    ) {
      return batchSource.status;
    }
  }

  if (
    recentlyIngestedIds.has(sourceDocumentId) &&
    !isIngestedDocumentStatus(catalogStatus)
  ) {
    const normalized = catalogStatus.trim().toLowerCase();
    if (normalized !== 'ingesting' && normalized !== 'running') {
      return 'ingested';
    }
  }

  return catalogStatus;
}

function canOpenModulesForDocument(
  status: string,
  sourceDocumentId: string,
  recentlyIngestedIds: ReadonlySet<string>,
  keptExistingSourceIds: ReadonlySet<string>,
): boolean {
  return (
    isIngestedDocumentStatus(status) ||
    recentlyIngestedIds.has(sourceDocumentId) ||
    keptExistingSourceIds.has(sourceDocumentId)
  );
}

export const DocumentSelectionPanel = ({
  selectedDocuments,
  onSelectedDocumentsChange,
  searchQuery,
  onSearchQueryChange,
  contentDomain = INGEST_FORM_DEFAULTS.content_domain,
  disabled = false,
  uploadFiles,
  isUploading = false,
  uploadClearSignal = 0,
  batchSources = [],
  keptExistingSourceIds = [],
}: DocumentSelectionPanelProps) => {
  const navigate = useNavigate();
  const keptExistingIds = useMemo(
    () => new Set(keptExistingSourceIds),
    [keptExistingSourceIds],
  );
  const recentlyIngestedIds = useMemo(
    () =>
      new Set(
        readRecentIngestDocuments().map(
          (document) => document.source_document_id,
        ),
      ),
    [uploadClearSignal, batchSources],
  );
  const debouncedQuery = useDebouncedValue(
    searchQuery,
    DOCUMENT_SELECTION_SEARCH_DEBOUNCE_MS,
  );
  const searchQ = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(
    DEFAULT_DOCUMENT_SELECTION_PAGE_SIZE,
  );
  const [pageInput, setPageInput] = useState('1');
  const [sortBy, setSortBy] = useState('uploaded_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadComplete, setUploadComplete] = useState(false);

  const clearPendingUpload = useCallback(() => {
    setPendingFiles([]);
    setFileError('');
    setUploadComplete(true);
  }, []);

  useEffect(() => {
    if (uploadClearSignal > 0) {
      clearPendingUpload();
    }
  }, [clearPendingUpload, uploadClearSignal]);

  const selectedIds = useMemo(
    () => new Set(selectedDocuments.map((doc) => doc.id)),
    [selectedDocuments],
  );

  useEffect(() => {
    setPage(0);
  }, [searchQ, pageSize]);

  const {
    data: catalog,
    isFetching,
    isError,
    error,
    refetch,
  } = useFetchSourceDocumentsQuery({
    source_type: INGESTABLE_KNOWLEDGE_SOURCE_TYPES,
    ...(searchQ ? { q: searchQ } : {}),
    limit: pageSize,
    offset: page * pageSize,
    sort_by: sortBy,
    sort_dir: sortDir,
  });

  const catalogRows = useMemo<DocumentSelectionRow[]>(
    () =>
      (catalog?.source_documents ?? []).map((doc) => ({
        id: doc.id,
        title: doc.title.trim() || doc.original_filename?.trim() || doc.id,
        originalFilename: doc.original_filename,
        sourceType: doc.source_type,
        status: resolveDocumentCatalogStatus(
          doc.status,
          doc.id,
          batchSources,
          recentlyIngestedIds,
        ),
        uploadedAt: doc.uploaded_date || doc.ingested_at,
        uploadedBy: doc.uploaded_by?.name ?? null,
        ingestedBy: doc.ingested_by?.name ?? null,
        selection: '',
        actions: '',
      })),
    [batchSources, catalog?.source_documents, recentlyIngestedIds],
  );

  const selectedRows = useMemo<DocumentSelectionRow[]>(() => {
    const catalogById = new Map(catalogRows.map((row) => [row.id, row]));
    return selectedDocuments.map((doc) => {
      const catalogRow = catalogById.get(doc.id);
      if (catalogRow) {
        return {
          ...catalogRow,
          title: catalogRow.title.trim() || doc.title,
          originalFilename: catalogRow.originalFilename || doc.originalFilename,
          status: resolveDocumentCatalogStatus(
            catalogRow.status || doc.status,
            doc.id,
            batchSources,
            recentlyIngestedIds,
          ),
          uploadedAt: catalogRow.uploadedAt || doc.uploadedAt || '',
        };
      }

      return {
        id: doc.id,
        title: doc.title,
        originalFilename: doc.originalFilename,
        sourceType: doc.sourceType,
        status: resolveDocumentCatalogStatus(
          doc.status,
          doc.id,
          batchSources,
          recentlyIngestedIds,
        ),
        uploadedAt: doc.uploadedAt ?? '',
        uploadedBy: null,
        ingestedBy: null,
        selection: '',
        actions: '',
      };
    });
  }, [batchSources, catalogRows, recentlyIngestedIds, selectedDocuments]);

  const total = catalog?.total_source_documents ?? 0;
  const totalPages = catalog?.total_pages ?? 0;
  const hasPrevPage = page > 0;
  const hasNextPage = totalPages > 0 && page + 1 < totalPages;
  const rangeStart = catalogRows.length ? page * pageSize + 1 : 0;
  const rangeEnd = catalogRows.length
    ? page * pageSize + catalogRows.length
    : 0;

  useEffect(() => {
    setPageInput(String(page + 1));
  }, [page]);

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const setSelectionFromDocs = useCallback(
    (next: SelectedIngestDocument[]) => {
      onSelectedDocumentsChange(next.slice(0, MAX_DOCUMENT_SELECTION));
    },
    [onSelectedDocumentsChange],
  );

  const toggleDocument = useCallback(
    (doc: DocumentSelectionRow, checked: boolean) => {
      if (disabled) return;
      if (checked) {
        if (selectedIds.has(doc.id)) return;
        if (selectedDocuments.length >= MAX_DOCUMENT_SELECTION) return;
        setSelectionFromDocs([
          ...selectedDocuments,
          {
            id: doc.id,
            title: doc.title,
            originalFilename: doc.originalFilename,
            sourceType: doc.sourceType,
            status: doc.status,
            ...(doc.uploadedAt ? { uploadedAt: doc.uploadedAt } : {}),
          },
        ]);
        return;
      }
      setSelectionFromDocs(
        selectedDocuments.filter((item) => item.id !== doc.id),
      );
    },
    [disabled, selectedDocuments, selectedIds, setSelectionFromDocs],
  );

  const handleSort = useCallback(
    (nextSortBy: string, nextSortDir: 'asc' | 'desc') => {
      setSortBy(nextSortBy);
      setSortDir(nextSortDir);
      setPage(0);
    },
    [],
  );

  const commitPageInput = () => {
    const parsed = Number.parseInt(pageInput, 10);
    const isValid =
      Number.isFinite(parsed) &&
      parsed >= 1 &&
      (totalPages <= 0 || parsed <= totalPages);
    if (!isValid) {
      setPageInput(String(page + 1));
      return;
    }
    setPage(parsed - 1);
  };

  const handlePageInputChange = (raw: string) => {
    if (raw === '') {
      setPageInput('');
      return;
    }
    if (!/^\d+$/.test(raw)) return;
    const parsed = Number.parseInt(raw, 10);
    if (parsed < 1) return;
    if (totalPages > 0 && parsed > totalPages) return;
    setPageInput(raw);
  };

  const handlePendingFilesChange = (next: File[]) => {
    setUploadComplete(false);
    setUploadError('');
    setPendingFiles(next);
  };

  const goToModulesForSource = useCallback(
    (sourceDocumentId: string, sourceTitle?: string) => {
      const state: ModuleLibraryLocationState = {
        tab: 'all',
        sourceDocumentId,
        ...(sourceTitle ? { sourceDocumentTitle: sourceTitle } : {}),
      };
      navigate(paths.moduleLibrary, { state });
    },
    [navigate],
  );

  const runUpload = useCallback(async () => {
    if (!pendingFiles.length || disabled || isUploading) return;
    setUploadError('');
    setUploadComplete(false);

    try {
      const response = await uploadFiles({
        files: pendingFiles,
        titles: pendingFiles.map((file) => titleFromFilename(file.name)),
        content_domains: pendingFiles.map(() => contentDomain),
      });
      // Null means a duplicate dialog opened (or an error was surfaced by the page).
      if (response) {
        clearPendingUpload();
      }
    } catch (err) {
      setUploadError(formatRtkQueryError(err));
      setUploadComplete(false);
    }
  }, [
    clearPendingUpload,
    contentDomain,
    disabled,
    isUploading,
    pendingFiles,
    uploadFiles,
  ]);

  const buildColumns = useCallback(
    (options: {
      lockSelected: boolean;
    }): Array<ColumnDef<DocumentSelectionRow>> => [
      {
        key: 'selection',
        header: '',
        sortable: false,
        className: 'w-10 max-w-10 px-2 sm:px-3',
        headerClassName: 'w-10 max-w-10 px-2 sm:px-3',
        render: (row) => {
          const checked = selectedIds.has(row.id);
          const atCap =
            !checked && selectedDocuments.length >= MAX_DOCUMENT_SELECTION;
          const selectionLocked = options.lockSelected && checked;
          return (
            <input
              type="checkbox"
              className={cn(
                SPICE_CHECKBOX_CLASSNAME,
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
              aria-label={
                selectionLocked
                  ? `${row.title} selected`
                  : `Select ${row.title}`
              }
              checked={checked}
              disabled={disabled || atCap || selectionLocked}
              onChange={(event) => {
                toggleDocument(row, event.target.checked);
              }}
            />
          );
        },
      },
      {
        key: 'title',
        header: 'Document',
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
              className="font-medium text-spice-text-primary"
            />
            {row.originalFilename && row.originalFilename !== row.title ? (
              <div className="mt-0.5 min-w-0">
                <TruncatedText
                  text={row.originalFilename}
                  className="text-[11px] text-spice-text-muted"
                />
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: 'sourceType',
        header: 'Type',
        sortable: false,
        render: (row) => (
          <span className="text-xs uppercase text-spice-text-medium">
            {row.sourceType || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortKey: 'status',
        render: (row) => {
          const badge = documentStatusBadge(row.status || 'uploaded');
          return <StatusBadge status={badge.status} label={badge.label} />;
        },
      },
      {
        key: 'uploadedAt',
        header: 'Uploaded',
        sortable: true,
        sortKey: 'uploaded_date',
        render: (row) => (
          <span className="whitespace-nowrap text-xs text-spice-text-medium">
            {formatDisplayDateTime(row.uploadedAt)}
          </span>
        ),
      },
      {
        key: 'uploadedBy',
        header: 'Uploaded by',
        sortable: false,
        className: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {formatHierarchyActorName(row.uploadedBy)}
          </span>
        ),
      },
      {
        key: 'ingestedBy',
        header: 'Ingested by',
        sortable: false,
        className: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {formatHierarchyActorName(row.ingestedBy)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        sortable: false,
        className: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (row) => {
          const canViewModules = canOpenModulesForDocument(
            row.status,
            row.id,
            recentlyIngestedIds,
            keptExistingIds,
          );
          return (
            <div className="flex h-8 min-w-[7.75rem] items-center">
              {canViewModules ? (
                <Button
                  variant="secondary"
                  className="h-8 shrink-0 px-3 text-xs"
                  onClick={() => {
                    goToModulesForSource(row.id, row.title);
                  }}
                >
                  View modules
                </Button>
              ) : (
                <StatusBadge status="neutral" label="Not ingested" />
              )}
            </div>
          );
        },
      },
    ],
    [
      disabled,
      goToModulesForSource,
      keptExistingIds,
      recentlyIngestedIds,
      selectedDocuments.length,
      selectedIds,
      toggleDocument,
    ],
  );

  const availableColumns = useMemo(
    () => buildColumns({ lockSelected: true }),
    [buildColumns],
  );
  const selectedColumns = useMemo(
    () => buildColumns({ lockSelected: false }),
    [buildColumns],
  );

  const uploadFieldsDisabled = disabled || isUploading;
  const canUpload = pendingFiles.length > 0 && !uploadFieldsDisabled;

  return (
    <div className="space-y-4">
      {isError ? (
        <Banner tone="critical">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Unable to load documents. {formatRtkQueryError(error)}</span>
            <Button
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => {
                void refetch();
              }}
            >
              Retry
            </Button>
          </div>
        </Banner>
      ) : null}

      <div className="space-y-3">
        <div className="text-sm font-semibold text-spice-text-primary">
          Upload
        </div>

        <FileDropzone
          files={pendingFiles}
          onChange={handlePendingFilesChange}
          accept={INGEST_FILE_INPUT_ACCEPT}
          multiple
          maxFiles={MAX_DOCUMENT_SELECTION}
          disabled={uploadFieldsDisabled}
          showFileList
          title="Select files"
          titleWhenSelected="Add more"
          subtitle="Click to select documents"
          hideSubtitleWhenSelected
          ariaLabel={pendingFiles.length ? 'Add more files' : 'Select files'}
          validateFile={(file) =>
            isIngestAcceptedFile(file)
              ? null
              : formatIngestFileRejectionError([file])
          }
          onReject={(message) => {
            setFileError(message);
            if (message) {
              setUploadComplete(false);
            }
          }}
        />

        {fileError ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {fileError}
          </div>
        ) : null}
        {uploadError ? <Banner tone="critical">{uploadError}</Banner> : null}

        <IngestUploadProgress
          active={isUploading}
          complete={uploadComplete && !isUploading}
          label="Uploading document…"
        />

        <p className="text-xs text-spice-text-muted">
          {INGEST_ACCEPTED_FILE_TYPES_LABEL} · Max 100 MB
        </p>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="w-full sm:w-64 lg:w-72">
            <SearchInput
              value={searchQuery}
              onChange={onSearchQueryChange}
              placeholder="Search by file name..."
              aria-label="Search knowledge documents"
              disabled={disabled}
              className="h-9"
            />
          </div>
          <Button
            className="h-9 shrink-0 text-xs"
            disabled={!canUpload}
            onClick={() => {
              void runUpload();
            }}
          >
            {isUploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold text-spice-text-primary">
          Available documents
        </div>
        <Table<DocumentSelectionRow>
          data={catalogRows}
          columns={availableColumns}
          keyExtractor={(row) => row.id}
          caption="Documents available to select for ingestion"
          emptyMessage={
            isFetching
              ? 'Loading documents…'
              : searchQ
                ? 'No documents match your search.'
                : 'No documents available. Upload files above to get started.'
          }
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />

        <TablePagination
          page={page}
          pageSize={pageSize}
          pageSizeOptions={DOCUMENT_SELECTION_PAGE_SIZE_OPTIONS}
          totalItems={total}
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
          rowsPerPageAriaLabel="Document selection rows per page"
          pageNumberAriaLabel="Document selection page number"
          className="border-t border-spice-border px-0 pt-3"
        />
      </div>

      {selectedDocuments.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-spice-text-primary">
            Selected for ingestion ({selectedDocuments.length})
          </div>
          <Table<DocumentSelectionRow>
            data={selectedRows}
            columns={selectedColumns}
            keyExtractor={(row) => `selected-${row.id}`}
            caption="Documents selected for ingestion"
          />
        </div>
      ) : null}
    </div>
  );
};
