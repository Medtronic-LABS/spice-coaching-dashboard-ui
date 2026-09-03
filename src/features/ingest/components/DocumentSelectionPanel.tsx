import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon } from '@/assets/icon';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import {
  Banner,
  Button,
  FileDropzone,
  FormHelperText,
  SearchInput,
  SectionHeader,
  StatusBadge,
  TABLE_STATUS_BADGE_CLASSNAME,
  TruncatedText,
  typographyClasses,
  useSnackbar,
} from '@/components/ui';
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
import { readRecentIngestDocuments } from '@/features/ingest/utils/recentIngestDocumentsStorage';
import { isIngestSucceeded } from '@/features/ingest/utils/ingestStatus';
import { useFetchSourceDocumentsQuery } from '@/features/modules/api/adminSourceDocumentsApi';
import { getKnowledgeDocumentStatusBadgeProps } from '@/features/knowledge-library/utils/knowledgeDocumentStatusBadge';
import { formatHierarchyActorName } from '@/features/modules/types/hierarchyActor';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTablePageInput } from '@/hooks/useTablePageInput';
import {
  tableHasNextPage,
  tableHasPrevPage,
  tablePageOffset,
  tablePaginationRange,
} from '@/utils/tablePagination';
import {
  DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
  formatDisplayDateTime,
} from '@/utils/formatDisplayDateTime';
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
  const recentlyIngestedIds = useMemo(() => {
    // Re-read sessionStorage when an upload finishes or ingest batch status changes.
    void uploadClearSignal;
    void batchSources;
    return new Set(
      readRecentIngestDocuments().map(
        (document) => document.source_document_id,
      ),
    );
  }, [uploadClearSignal, batchSources]);
  const debouncedQuery = useDebouncedValue(
    searchQuery,
    DOCUMENT_SELECTION_SEARCH_DEBOUNCE_MS,
  );
  const searchQ = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);
  const [pageSize, setPageSize] = useState(
    DEFAULT_DOCUMENT_SELECTION_PAGE_SIZE,
  );
  const [paginationTotalPages, setPaginationTotalPages] = useState(0);
  const {
    page,
    setPage,
    pageInput,
    resetPage,
    commitPageInput,
    handlePageInputChange,
  } = useTablePageInput(paginationTotalPages);
  const [sortBy, setSortBy] = useState('uploaded_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const snackbar = useSnackbar();

  const clearPendingUpload = useCallback(() => {
    setPendingFiles([]);
    setFileError('');
    setUploadComplete(true);
  }, []);

  const resetPendingDraft = useCallback(() => {
    setPendingFiles([]);
    setFileError('');
    setUploadComplete(false);
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
    resetPage();
  }, [searchQ, pageSize, resetPage]);

  const {
    data: catalog,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useFetchSourceDocumentsQuery({
    source_type: INGESTABLE_KNOWLEDGE_SOURCE_TYPES,
    ...(searchQ ? { q: searchQ } : {}),
    limit: pageSize,
    offset: tablePageOffset(page, pageSize),
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
  const hasPrevPage = tableHasPrevPage(page);
  const hasNextPage = tableHasNextPage(page, totalPages);
  const { start: rangeStart, end: rangeEnd } = tablePaginationRange(
    page,
    pageSize,
    catalogRows.length,
  );

  useEffect(() => {
    setPaginationTotalPages(totalPages);
  }, [totalPages]);

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
    [setPage],
  );

  const handlePendingFilesChange = (next: File[]) => {
    setUploadComplete(false);
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
      snackbar.showError(formatRtkQueryError(err));
      setUploadComplete(false);
    }
  }, [
    clearPendingUpload,
    contentDomain,
    disabled,
    isUploading,
    pendingFiles,
    snackbar,
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
              className={typographyClasses.tableCellPrimary}
            />
            {row.originalFilename && row.originalFilename !== row.title ? (
              <div className="mt-0.5 min-w-0">
                <TruncatedText
                  text={row.originalFilename}
                  className={typographyClasses.tableCellSecondary}
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
          <span className="uppercase">{row.sourceType || '—'}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortKey: 'status',
        render: (row) => (
          <StatusBadge
            {...getKnowledgeDocumentStatusBadgeProps(row.status || 'uploaded')}
            className={TABLE_STATUS_BADGE_CLASSNAME}
          />
        ),
      },
      {
        key: 'uploadedAt',
        header: 'Uploaded',
        sortable: true,
        sortKey: 'uploaded_date',
        className: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
        headerClassName: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
        render: (row) => (
          <span className="whitespace-nowrap">
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
        render: (row) => formatHierarchyActorName(row.uploadedBy),
      },
      {
        key: 'ingestedBy',
        header: 'Ingested by',
        sortable: false,
        className: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (row) => formatHierarchyActorName(row.ingestedBy),
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
            <div className="flex h-8 min-w-[9.25rem] items-center">
              {canViewModules ? (
                <Button
                  variant="secondary"
                  className="h-8 shrink-0 gap-1.5 px-3 text-xs"
                  onClick={() => {
                    goToModulesForSource(row.id, row.title);
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
      <div className="space-y-3">
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

        {fileError ? <Banner tone="critical">{fileError}</Banner> : null}

        <FormHelperText>
          {INGEST_ACCEPTED_FILE_TYPES_LABEL} · Max 100 MB
        </FormHelperText>

        <IngestUploadProgress
          active={isUploading}
          complete={uploadComplete && !isUploading}
          label="Uploading document…"
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            disabled={uploadFieldsDisabled}
            onClick={resetPendingDraft}
          >
            Reset
          </Button>
          <Button
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
        <SectionHeader
          title="Available documents"
          variant="h2"
          action={
            <div className="w-full sm:w-64 lg:w-72">
              <SearchInput
                value={searchQuery}
                onChange={onSearchQueryChange}
                placeholder="Search by file name..."
                aria-label="Search available documents"
                disabled={disabled}
                className="h-9"
              />
            </div>
          }
        />
        <Table<DocumentSelectionRow>
          data={catalogRows}
          columns={availableColumns}
          keyExtractor={(row) => row.id}
          caption="Documents available to select for ingestion"
          isLoading={isLoading}
          loadingMessage="Loading documents…"
          emptyMessage={
            searchQ
              ? 'No documents match your search.'
              : 'No documents available. Upload files above to get started.'
          }
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          queryError={isError && !isFetching ? error : undefined}
          queryErrorTitle="Unable to load documents"
          onRetryQuery={() => {
            void refetch();
          }}
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
          <SectionHeader
            title={`Selected for ingestion (${selectedDocuments.length})`}
            variant="h2"
          />
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
