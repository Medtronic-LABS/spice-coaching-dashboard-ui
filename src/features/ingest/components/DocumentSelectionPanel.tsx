import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type {
  AdminV3IngestUploadPayload,
  AdminV3IngestUploadResponse,
  IngestContentDomain,
} from '@/features/ingest/api/adminIngestApi';
import { IngestUploadProgress } from '@/features/ingest/components/IngestUploadProgress';
import {
  DOCUMENT_SELECTION_PAGE_SIZE,
  DOCUMENT_SELECTION_SEARCH_DEBOUNCE_MS,
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
import { useFetchSourceDocumentsQuery } from '@/features/modules/api/adminSourceDocumentsApi';
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
  selection: '';
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
}: DocumentSelectionPanelProps) => {
  const debouncedQuery = useDebouncedValue(
    searchQuery,
    DOCUMENT_SELECTION_SEARCH_DEBOUNCE_MS,
  );
  const searchQ = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);
  const [page, setPage] = useState(0);
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
  }, [searchQ]);

  const {
    data: catalog,
    isFetching,
    isError,
    error,
    refetch,
  } = useFetchSourceDocumentsQuery({
    source_type: INGESTABLE_KNOWLEDGE_SOURCE_TYPES,
    ...(searchQ ? { q: searchQ } : {}),
    limit: DOCUMENT_SELECTION_PAGE_SIZE,
    offset: page * DOCUMENT_SELECTION_PAGE_SIZE,
    sort_by: sortBy,
    sort_dir: sortDir,
  });

  const rows = useMemo<DocumentSelectionRow[]>(
    () =>
      (catalog?.source_documents ?? []).map((doc) => ({
        id: doc.id,
        title: doc.title.trim() || doc.original_filename?.trim() || doc.id,
        originalFilename: doc.original_filename,
        sourceType: doc.source_type,
        status: doc.status,
        uploadedAt: doc.uploaded_date || doc.ingested_at,
        selection: '',
      })),
    [catalog?.source_documents],
  );

  const total = catalog?.total_source_documents ?? 0;
  const totalPages = catalog?.total_pages ?? 0;
  const hasPrevPage = page > 0;
  const hasNextPage = totalPages > 0 && page + 1 < totalPages;
  const rangeStart = rows.length ? page * DOCUMENT_SELECTION_PAGE_SIZE + 1 : 0;
  const rangeEnd = rows.length
    ? page * DOCUMENT_SELECTION_PAGE_SIZE + rows.length
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

  const columns: Array<ColumnDef<DocumentSelectionRow>> = useMemo(
    () => [
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
          return (
            <input
              type="checkbox"
              aria-label={`Select ${row.title}`}
              checked={checked}
              disabled={disabled || atCap}
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
        className: 'whitespace-normal',
        render: (row) => (
          <div className="min-w-[12rem] max-w-[22rem]">
            <TruncatedText
              text={row.title}
              focusable
              className="font-medium text-spice-text-primary"
            />
            {row.originalFilename && row.originalFilename !== row.title ? (
              <p className="mt-0.5 truncate text-[11px] text-spice-text-muted">
                {row.originalFilename}
              </p>
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
    ],
    [disabled, selectedDocuments.length, selectedIds, toggleDocument],
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
          {INGEST_ACCEPTED_FILE_TYPES_LABEL}
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

      <Table<DocumentSelectionRow>
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.id}
        caption="Knowledge documents available for ingestion"
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
        pageSize={DOCUMENT_SELECTION_PAGE_SIZE}
        pageSizeOptions={[DOCUMENT_SELECTION_PAGE_SIZE]}
        totalItems={total}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        pageInput={pageInput}
        hasPrevPage={hasPrevPage}
        hasNextPage={hasNextPage}
        onPageSizeChange={() => undefined}
        onPageInputChange={handlePageInputChange}
        onCommitPageInput={commitPageInput}
        onPrevPage={() => setPage((current) => Math.max(0, current - 1))}
        onNextPage={() => setPage((current) => current + 1)}
        rowsPerPageAriaLabel="Document selection rows per page"
        pageNumberAriaLabel="Document selection page number"
        className="border-t border-spice-border px-0 pt-3"
      />
    </div>
  );
};
