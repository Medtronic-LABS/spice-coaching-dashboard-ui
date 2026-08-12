import { useEffect, useMemo, useState } from 'react';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { type ColumnDef, Table } from '@/components/common/Table';
import {
  SettingsFilterDrawer,
  SettingsFilterTriggerButton,
} from '@/components/common/SettingsFilterDrawer';
import {
  Button,
  Card,
  Loader,
  SearchInput,
  Select,
  Tabs,
  TruncatedText,
} from '@/components/ui';
import { KnowledgeLibraryFilters } from '@/features/modules/components/KnowledgeLibraryFilters';
import { KnowledgeEditModal } from '@/features/modules/components/KnowledgeEditModal';
import { KnowledgeRetireModal } from '@/features/modules/components/KnowledgeRetireModal';
import { KnowledgeThumbnailCell } from '@/features/modules/components/KnowledgeThumbnailCell';
import { AssignmentDialog } from '@/features/modules/components/AssignmentDialog';
import {
  useFetchKnowledgeUploadersQuery,
  useRetireKnowledgeDocumentMutation,
} from '@/features/modules/api/adminKnowledgeApi';
import {
  mapSourceDocumentToKnowledgeItem,
  useFetchSourceDocumentsQuery,
  useUpdateSourceDocumentMetadataMutation,
  useUpdateSourceDocumentThumbnailMutation,
} from '@/features/modules/api/adminSourceDocumentsApi';
import { useLazyGetAdminFilePresignedUrlQuery } from '@/features/modules/api/adminFilesApi';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';
import {
  knowledgeDownloadFilename,
  downloadFileAs,
} from '@/features/modules/utils/knowledgeDownloadFilename';
import {
  KNOWLEDGE_LIBRARY_FILTER_DEFAULTS,
  type KnowledgeLibraryItem,
  type KnowledgeLibraryStatusTab,
} from '@/features/modules/types/knowledgeLibrary.types';
import {
  hasActiveKnowledgeDrawerFilters,
  isKnowledgeDrawerDateRangeInvalid,
  KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
  resolveKnowledgeCatalogStatusFilter,
  uploadedDateInputToFromIso,
  uploadedDateInputToToIso,
  type KnowledgeLibraryDrawerFilters,
} from '@/features/modules/utils/knowledgeLibraryFilters';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type KnowledgeTableRow = KnowledgeLibraryItem & {
  actions: '';
};

const PAGE_SIZE_OPTIONS = [5, 10, 15, 25, 50] as const;
const KNOWLEDGE_SEARCH_DEBOUNCE_MS = 300;

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const KnowledgeLibraryTable = () => {
  const [statusTab, setStatusTab] = useState<KnowledgeLibraryStatusTab>(
    KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.status,
  );
  const [q, setQ] = useState(KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.q);
  const debouncedQ = useDebouncedValue(q, KNOWLEDGE_SEARCH_DEBOUNCE_MS);
  const searchQ = useMemo(() => debouncedQ.trim(), [debouncedQ]);
  const [appliedDrawerFilters, setAppliedDrawerFilters] =
    useState<KnowledgeLibraryDrawerFilters>(
      KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
    );
  const [draftDrawerFilters, setDraftDrawerFilters] =
    useState<KnowledgeLibraryDrawerFilters>(
      KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
    );
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  const [sortBy, setSortBy] = useState(
    KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.sortBy,
  );
  const [sortOrder, setSortOrder] = useState(
    KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.sortOrder,
  );

  const [page, setPage] = useState(KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.page);
  const [pageSize, setPageSize] = useState(
    KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.pageSize,
  );
  const [pageInput, setPageInput] = useState('1');

  const [editOpen, setEditOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<KnowledgeLibraryItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editError, setEditError] = useState('');

  const [retireConfirmOpen, setRetireConfirmOpen] = useState(false);
  const [retireAsset, setRetireAsset] = useState<KnowledgeLibraryItem | null>(
    null,
  );
  const [retireError, setRetireError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [uploaderSearch, setUploaderSearch] = useState('');

  const [triggerPresignedUrl] = useLazyGetAdminFilePresignedUrlQuery();

  const [updateMetadata, { isLoading: isPatchingTitle }] =
    useUpdateSourceDocumentMetadataMutation();
  const [updateThumbnail, { isLoading: isReplacingThumbnail }] =
    useUpdateSourceDocumentThumbnailMutation();
  const [retireKnowledgeDocument, { isLoading: isRetiring }] =
    useRetireKnowledgeDocumentMutation();

  const drawerDateRangeInvalid =
    isKnowledgeDrawerDateRangeInvalid(appliedDrawerFilters);
  const filtersActive = hasActiveKnowledgeDrawerFilters(appliedDrawerFilters);

  const queryArgs = useMemo(() => {
    const offset = page * pageSize;
    const statusParam = resolveKnowledgeCatalogStatusFilter({
      statusTab,
      ingested: appliedDrawerFilters.ingested,
    });
    return {
      sync_published_visible: true,
      source_type: 'pdf' as const,
      ...(searchQ ? { q: searchQ } : {}),
      ...(statusParam ? { status: statusParam } : {}),
      ...(appliedDrawerFilters.uploadedAtFrom
        ? {
            uploaded_from: uploadedDateInputToFromIso(
              appliedDrawerFilters.uploadedAtFrom,
            ),
          }
        : {}),
      ...(appliedDrawerFilters.uploadedAtTo
        ? {
            uploaded_to: uploadedDateInputToToIso(
              appliedDrawerFilters.uploadedAtTo,
            ),
          }
        : {}),
      ...(appliedDrawerFilters.uploadedBy
        ? { uploaded_by: appliedDrawerFilters.uploadedBy }
        : {}),
      ...(appliedDrawerFilters.assigned
        ? { assigned: appliedDrawerFilters.assigned === 'true' }
        : {}),
      sort_by: sortBy,
      sort_dir: sortOrder,
      limit: pageSize,
      offset,
    };
  }, [
    appliedDrawerFilters,
    page,
    pageSize,
    searchQ,
    sortBy,
    sortOrder,
    statusTab,
  ]);

  const {
    data: catalog,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useFetchSourceDocumentsQuery(queryArgs, {
    skip: drawerDateRangeInvalid,
  });

  const { data: uploadersData, isFetching: uploadersLoading } =
    useFetchKnowledgeUploadersQuery(undefined, {
      skip: !filtersDrawerOpen,
    });
  const uploaderOptions = useMemo(() => {
    const options = (uploadersData?.uploaders ?? []).map((uploader) => ({
      value: uploader.value,
      label: uploader.label,
    }));
    const term = uploaderSearch.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term),
    );
  }, [uploadersData?.uploaders, uploaderSearch]);

  const assets = useMemo<KnowledgeTableRow[]>(
    () =>
      (catalog?.source_documents ?? []).map((doc) => ({
        ...mapSourceDocumentToKnowledgeItem(doc),
        actions: '',
      })),
    [catalog?.source_documents],
  );

  const total = catalog?.total_source_documents ?? 0;
  const totalPages = catalog?.total_pages ?? 0;
  const hasPrevPage = page > 0;
  const hasNextPage = totalPages > 0 && page + 1 < totalPages;

  useEffect(() => {
    setPageInput(String(page + 1));
  }, [page]);

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(0);
  }, [statusTab, searchQ, appliedDrawerFilters, sortBy, sortOrder]);

  const rangeStart = assets.length ? page * pageSize + 1 : 0;
  const rangeEnd = assets.length ? page * pageSize + assets.length : 0;

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

  const handleOpenFiltersDrawer = () => {
    setDraftDrawerFilters(appliedDrawerFilters);
    setFiltersDrawerOpen(true);
  };

  const handleCloseFiltersDrawer = () => {
    setFiltersDrawerOpen(false);
  };

  const handleApplyFilters = () => {
    if (isKnowledgeDrawerDateRangeInvalid(draftDrawerFilters)) return;
    setAppliedDrawerFilters(draftDrawerFilters);
    setPage(0);
    setFiltersDrawerOpen(false);
  };

  const handleClearDraftFilters = () => {
    const cleared = { ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS };
    setDraftDrawerFilters(cleared);
    setAppliedDrawerFilters(cleared);
    setPage(0);
  };

  const handleSort = (nextSortBy: string, nextSortDir: 'asc' | 'desc') => {
    setSortBy(nextSortBy as typeof sortBy);
    setSortOrder(nextSortDir);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditAsset(null);
    setEditTitle('');
    setEditThumbnailFile(null);
    setEditError('');
  };

  const closeRetireModal = () => {
    setRetireConfirmOpen(false);
    setRetireAsset(null);
    setRetireError('');
  };

  const handleSaveEdit = () => {
    if (!editAsset) return;
    if (!editTitle.trim()) {
      setEditError('Title is required.');
      return;
    }
    setEditError('');
    void (async () => {
      try {
        await updateMetadata({
          sourceDocumentId: editAsset.id,
          body: { title: editTitle.trim() },
        }).unwrap();

        if (editThumbnailFile) {
          await updateThumbnail({
            sourceDocumentId: editAsset.id,
            file: editThumbnailFile,
          }).unwrap();
        }

        closeEditModal();
      } catch (err) {
        setEditError(formatRtkQueryError(err));
      }
    })();
  };

  const handleConfirmRetire = () => {
    if (!retireAsset) return;
    setRetireError('');
    void (async () => {
      try {
        await retireKnowledgeDocument(retireAsset.id).unwrap();
        closeRetireModal();
      } catch (err) {
        setRetireError(formatRtkQueryError(err));
      }
    })();
  };

  const columns: Array<ColumnDef<KnowledgeTableRow>> = useMemo(
    () => [
      {
        key: 'thumbnailStoragePath',
        header: 'Thumbnail',
        className: 'w-[6rem]',
        render: (row) => (
          <KnowledgeThumbnailCell storagePath={row.thumbnailStoragePath} />
        ),
      },
      {
        key: 'title',
        header: 'File Title',
        sortable: true,
        sortKey: 'title',
        render: (row) => (
          <div className="min-w-[12rem] max-w-[22rem]">
            <TruncatedText text={row.title} className="font-semibold">
              {row.title}
            </TruncatedText>
            {row.originalFilename ? (
              <div className="mt-0.5 text-xs text-spice-text-muted">
                {row.originalFilename}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        key: 'fileType',
        header: 'File Type',
        render: (row) => row.fileType.toUpperCase(),
      },
      {
        key: 'uploadedAt',
        header: 'Uploaded Date',
        sortable: true,
        sortKey: 'uploaded_date',
        render: (row) =>
          row.uploadedAt ? formatDisplayDateTime(row.uploadedAt) : '—',
      },
      {
        key: 'uploadedBy',
        header: 'Uploaded By',
        render: (row) => row.uploadedBy || '—',
      },
      {
        key: 'updatedAt',
        header: 'Last Updated',
        render: (row) =>
          row.updatedAt ? formatDisplayDateTime(row.updatedAt) : '—',
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => {
          const isRetired = row.status === 'retired';
          const mutatingBusy =
            isRetiring || isPatchingTitle || isReplacingThumbnail;

          return (
            <div className="flex items-center gap-2">
              {!isRetired ? (
                <>
                  <Button
                    className="h-8 px-3 text-xs"
                    variant="secondary"
                    disabled={mutatingBusy}
                    onClick={() => {
                      setEditError('');
                      setDownloadError('');
                      setEditAsset(row);
                      setEditTitle(row.title);
                      setEditThumbnailFile(null);
                      setEditOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    className="h-8 px-3 text-xs"
                    variant="secondary"
                    disabled={mutatingBusy}
                    onClick={() => {
                      setAssignTarget({ id: row.id, title: row.title });
                    }}
                  >
                    Assign
                  </Button>
                </>
              ) : null}
              <Button
                className="h-8 px-3 text-xs"
                disabled={downloadingId === row.id || !row.storedPath}
                onClick={() => {
                  void (async () => {
                    try {
                      setDownloadError('');
                      setDownloadingId(row.id);
                      // Use the same title shown in the table row — not the storage object key.
                      const downloadName = knowledgeDownloadFilename(row.title);
                      const res = await triggerPresignedUrl({
                        object_name: row.storedPath,
                        disposition: 'attachment',
                      }).unwrap();
                      await downloadFileAs(res.presigned_url, downloadName);
                    } catch (err) {
                      setDownloadError(formatRtkQueryError(err));
                    } finally {
                      setDownloadingId(null);
                    }
                  })();
                }}
              >
                {downloadingId === row.id ? 'Working…' : 'Download'}
              </Button>
              {!isRetired ? (
                <Button
                  className="h-8 px-3 text-xs text-spice-semantic-error hover:bg-spice-semantic-errorBg"
                  variant="secondary"
                  disabled={isRetiring}
                  onClick={() => {
                    setRetireError('');
                    setRetireAsset(row);
                    setRetireConfirmOpen(true);
                  }}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [
      downloadingId,
      isPatchingTitle,
      isReplacingThumbnail,
      isRetiring,
      triggerPresignedUrl,
    ],
  );

  const retryErrorBanner = error ? (
    <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
      <div className="flex items-start justify-between gap-3">
        <div>{formatRtkQueryError(error)}</div>
        <Button
          variant="secondary"
          className="h-8 w-8 shrink-0 px-0"
          aria-label="Refresh knowledge library"
          title="Refresh knowledge library"
          onClick={() => void refetch()}
        >
          <RefreshIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  ) : null;

  const editModalDisabled =
    isPatchingTitle || isReplacingThumbnail || isRetiring;
  const retireModalDisabled = isRetiring;

  return (
    <div className="space-y-4">
      <Loader
        open={isLoading || isFetching}
        label="Loading knowledge assets…"
      />

      <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-spice-text-primary">
              Knowledge Library
            </div>
            <div className="text-xs text-spice-text-muted">
              {total
                ? `${total} knowledge asset${total === 1 ? '' : 's'}`
                : 'No knowledge assets match your filters.'}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="w-64 sm:w-72">
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder="Search knowledge…"
              />
            </div>
            <Tabs
              items={[
                { label: 'Active', value: 'active' },
                { label: 'Retired', value: 'retired' },
              ]}
              value={statusTab}
              onChange={(v) =>
                setStatusTab(v === 'retired' ? 'retired' : 'active')
              }
              className="w-fit"
            />
            <SettingsFilterTriggerButton
              active={filtersActive}
              expanded={filtersDrawerOpen}
              onClick={handleOpenFiltersDrawer}
              ariaLabel={
                filtersActive
                  ? 'Open knowledge filters (filters applied)'
                  : 'Open knowledge filters'
              }
              tooltip={
                filtersActive
                  ? 'Results reflect the filters currently applied.'
                  : 'Use filters to narrow results.'
              }
            />
          </div>
        </div>

        {retryErrorBanner}
        {downloadError ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {downloadError}
          </div>
        ) : null}

        <SettingsFilterDrawer
          open={filtersDrawerOpen}
          onClose={handleCloseFiltersDrawer}
          title="Filters"
          description="Choose filters, then click Apply to update the list."
          titleId="knowledge-library-filters-title"
          descriptionId="knowledge-library-filters-desc"
        >
          <KnowledgeLibraryFilters
            filters={draftDrawerFilters}
            onChange={setDraftDrawerFilters}
            onClearAll={handleClearDraftFilters}
            onApply={handleApplyFilters}
            uploaderOptions={uploaderOptions}
            uploaderSearch={uploaderSearch}
            onUploaderSearchChange={setUploaderSearch}
            uploadersLoading={uploadersLoading}
          />
        </SettingsFilterDrawer>

        <Table
          data={assets}
          columns={columns}
          keyExtractor={(row) => row.id}
          containerClassName="min-h-[12rem]"
          emptyMessage="No results"
          sortBy={sortBy}
          sortDir={sortOrder}
          onSort={handleSort}
        />

        <div className="flex flex-col gap-3 border-t border-spice-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-spice-text-muted">
            <label className="inline-flex items-center gap-2">
              <span className="whitespace-nowrap font-medium text-spice-text-medium">
                Rows
              </span>
              <Select
                aria-label="Rows per page"
                className="h-8 w-[4.5rem] px-2 text-xs"
                value={String(pageSize)}
                options={PAGE_SIZE_OPTIONS.map((size) => ({
                  label: String(size),
                  value: String(size),
                }))}
                onChange={(value) => {
                  const next = Number.parseInt(value, 10);
                  if (!Number.isFinite(next) || next <= 0) return;
                  setPageSize(next);
                  setPage(0);
                }}
              />
            </label>

            <label className="inline-flex items-center gap-2">
              <span className="whitespace-nowrap font-medium text-spice-text-medium">
                Page
              </span>
              <input
                type="number"
                min={1}
                max={totalPages > 0 ? totalPages : 1}
                step={1}
                inputMode="numeric"
                aria-label="Page number"
                className="h-8 w-14 rounded-md border border-spice-border-mid bg-spice-bg-surface px-2 text-center text-xs font-semibold text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/25"
                value={pageInput}
                onChange={(e) => handlePageInputChange(e.target.value)}
                onBlur={commitPageInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                  if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              <span className="whitespace-nowrap">
                of{' '}
                <span className="font-semibold text-spice-text-medium">
                  {totalPages}
                </span>
              </span>
            </label>

            {assets.length ? (
              <span className="whitespace-nowrap">
                Showing{' '}
                <span className="font-semibold text-spice-text-medium">
                  {rangeStart}
                </span>
                –
                <span className="font-semibold text-spice-text-medium">
                  {rangeEnd}
                </span>
                {total > 0 ? (
                  <>
                    {' '}
                    of{' '}
                    <span className="font-semibold text-spice-text-medium">
                      {total}
                    </span>
                  </>
                ) : null}
              </span>
            ) : (
              <span>No results on this page</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={!hasPrevPage}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={!hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {assignTarget ? (
        <AssignmentDialog
          open
          onClose={() => setAssignTarget(null)}
          target={{
            kind: 'sourceDocument',
            id: assignTarget.id,
            title: assignTarget.title,
            noun: 'document',
          }}
          onAssigned={() => {
            void refetch();
            setAssignTarget(null);
          }}
        />
      ) : null}

      <KnowledgeEditModal
        open={editOpen}
        asset={editAsset}
        title={editTitle}
        thumbnailFile={editThumbnailFile}
        error={editError}
        disabled={editModalDisabled}
        isSaving={isPatchingTitle || isReplacingThumbnail}
        onTitleChange={setEditTitle}
        onThumbnailChange={setEditThumbnailFile}
        onClose={closeEditModal}
        onSave={handleSaveEdit}
      />

      <KnowledgeRetireModal
        open={retireConfirmOpen}
        asset={retireAsset}
        error={retireError}
        disabled={retireModalDisabled}
        isRetiring={isRetiring}
        onClose={closeRetireModal}
        onConfirm={handleConfirmRetire}
      />
    </div>
  );
};
