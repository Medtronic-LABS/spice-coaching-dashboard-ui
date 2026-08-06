import { useEffect, useMemo, useState } from 'react';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { type ColumnDef, Table } from '@/components/common/Table';
import {
  SettingsFilterDrawer,
  SettingsFilterTriggerButton,
} from '@/components/common/SettingsFilterDrawer';
import { Modal } from '@/components/ui';
import {
  Button,
  Card,
  ImagePicker,
  Loader,
  SearchInput,
  Select,
  Tabs,
  TruncatedText,
} from '@/components/ui';
import { KnowledgeLibraryFilters } from '@/features/modules/components/KnowledgeLibraryFilters';
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
import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';
import {
  KNOWLEDGE_LIBRARY_FILTER_DEFAULTS,
  type KnowledgeLibraryItem,
  type KnowledgeLibraryStatusTab,
} from '@/features/modules/types/knowledgeLibrary.types';
import {
  hasActiveKnowledgeDrawerFilters,
  isKnowledgeDrawerDateRangeInvalid,
  KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
  uploadedDateInputToFromIso,
  uploadedDateInputToToIso,
  type KnowledgeLibraryDrawerFilters,
} from '@/features/modules/utils/knowledgeLibraryFilters';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type KnowledgeTableRow = KnowledgeLibraryItem & {
  actions: '';
};

const PAGE_SIZE_OPTIONS = [10, 20, 30] as const;
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

function KnowledgeThumbnailCell({
  storagePath,
}: {
  storagePath: string | null;
}) {
  const { url } = usePresignedFileUrl(storagePath);
  if (!storagePath) {
    return <span className="text-xs text-spice-text-muted">—</span>;
  }
  if (!url) {
    return <span className="text-xs text-spice-text-muted">…</span>;
  }
  return (
    <div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-md border border-spice-border bg-spice-bg-tint">
      <img src={url} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

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
  const [assignTarget, setAssignTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [uploaderSearch, setUploaderSearch] = useState('');

  const [triggerPresignedUrl, { isLoading: isDownloading }] =
    useLazyGetAdminFilePresignedUrlQuery();

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
    const offset = (page - 1) * pageSize;
    return {
      sync_published_visible: true,
      source_type: 'pdf' as const,
      ...(searchQ ? { q: searchQ } : {}),
      ...(statusTab === 'retired' ? { status: 'retired' as const } : {}),
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
      ...(appliedDrawerFilters.ingested
        ? { ingested: appliedDrawerFilters.ingested === 'true' }
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
  const totalPages = Math.max(1, catalog?.total_pages ?? 1);
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [statusTab, searchQ, appliedDrawerFilters, sortBy, sortOrder, pageSize]);

  const rangeStart = assets.length ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = assets.length ? rangeStart + assets.length - 1 : 0;

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
    setPage(1);
    setFiltersDrawerOpen(false);
  };

  const handleClearDraftFilters = () => {
    setDraftDrawerFilters(KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS);
  };

  const handleSort = (nextSortBy: string, nextSortDir: 'asc' | 'desc') => {
    setSortBy(nextSortBy as typeof sortBy);
    setSortOrder(nextSortDir);
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
              <Button
                className="h-8 px-3 text-xs"
                variant="secondary"
                disabled={isRetired || mutatingBusy}
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
                disabled={isRetired || mutatingBusy}
                onClick={() => {
                  setAssignTarget({ id: row.id, title: row.title });
                }}
              >
                Assign
              </Button>
              <Button
                className="h-8 px-3 text-xs"
                disabled={isDownloading || !row.storedPath}
                onClick={() => {
                  void (async () => {
                    try {
                      setDownloadError('');
                      const res = await triggerPresignedUrl({
                        object_name: row.storedPath,
                        disposition: 'attachment',
                      }).unwrap();
                      const a = document.createElement('a');
                      a.href = res.presigned_url;
                      a.download = row.originalFilename || `${row.title}.pdf`;
                      a.rel = 'noreferrer';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    } catch (err) {
                      setDownloadError(formatRtkQueryError(err));
                    }
                  })();
                }}
              >
                {isDownloading ? 'Working…' : 'Download'}
              </Button>
              <Button
                className="h-8 px-3 text-xs text-spice-semantic-error hover:bg-spice-semantic-errorBg"
                variant="secondary"
                disabled={isRetired || isRetiring}
                onClick={() => {
                  setRetireError('');
                  setRetireAsset(row);
                  setRetireConfirmOpen(true);
                }}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [
      isDownloading,
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
                ? `Showing ${rangeStart}–${rangeEnd} of ${total} assets`
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
          caption={undefined}
          emptyMessage="No results"
          sortBy={sortBy}
          sortDir={sortOrder}
          onSort={handleSort}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xs text-spice-text-muted">
              Page {page} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="h-9 px-3 text-xs"
                disabled={!hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                className="h-9 px-3 text-xs"
                disabled={!hasNextPage}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-spice-text-muted">Page size</div>
            <Select
              options={PAGE_SIZE_OPTIONS.map((s) => ({
                label: String(s),
                value: String(s),
              }))}
              value={String(pageSize)}
              onChange={(v) => setPageSize(Number(v))}
            />
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

      <Modal
        open={editOpen}
        labelledBy="knowledge-edit-title"
        onClose={() => {
          if (editModalDisabled) return;
          setEditOpen(false);
          setEditAsset(null);
          setEditTitle('');
          setEditThumbnailFile(null);
          setEditError('');
        }}
      >
        <Card
          variant="elevated"
          className="w-full max-w-2xl border-spice-border p-0 shadow-lg"
        >
          <div className="shrink-0 space-y-4 p-6 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="knowledge-edit-title"
                  className="text-xl font-semibold text-spice-text-primary"
                >
                  Edit Knowledge Asset
                </h2>
                <p className="mt-1 text-xs text-spice-text-muted">
                  {editAsset ? `ID: ${editAsset.id}` : null}
                </p>
              </div>
            </div>

            {editError ? (
              <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
                {editError}
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
                Title
              </div>
              <input
                type="text"
                value={editTitle}
                disabled={editModalDisabled}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-10 w-full rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:border-spice-brand-primary/40 focus:ring-2 focus:ring-spice-brand-primary/20"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
                Custom thumbnail (optional)
              </div>
              <ImagePicker
                variant="compact"
                value={editThumbnailFile}
                onChange={setEditThumbnailFile}
                disabled={editModalDisabled}
                accept="image/*"
                label="Choose thumbnail"
                labelWhenSelected="Change thumbnail"
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-spice-border bg-spice-bg-surface/95 px-6 py-4 sm:flex-row sm:justify-end sm:items-center">
            <Button
              variant="ghost"
              className="h-10 text-sm"
              disabled={editModalDisabled}
              onClick={() => {
                setEditOpen(false);
                setEditAsset(null);
                setEditTitle('');
                setEditThumbnailFile(null);
                setEditError('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-10 min-w-[10rem] text-sm"
              disabled={editModalDisabled || !editTitle.trim() || !editAsset}
              onClick={() => {
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

                    setEditOpen(false);
                    setEditAsset(null);
                    setEditTitle('');
                    setEditThumbnailFile(null);
                    setEditError('');
                  } catch (err) {
                    setEditError(formatRtkQueryError(err));
                  }
                })();
              }}
            >
              {isPatchingTitle || isReplacingThumbnail ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </Card>
      </Modal>

      <Modal
        open={retireConfirmOpen}
        labelledBy="knowledge-retire-title"
        onClose={() => {
          if (retireModalDisabled) return;
          setRetireConfirmOpen(false);
          setRetireAsset(null);
          setRetireError('');
        }}
      >
        <Card
          variant="elevated"
          className="w-full max-w-xl border-spice-border p-0 shadow-lg"
        >
          <div className="shrink-0 space-y-4 p-6 pb-4">
            <h2
              id="knowledge-retire-title"
              className="text-xl font-semibold text-spice-text-primary"
            >
              Remove Knowledge Document
            </h2>
            {retireError ? (
              <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
                {retireError}
              </div>
            ) : null}
            <p className="text-sm text-spice-text-muted">
              This will retire the document and hide it from devices. Stored
              files are kept.
              {retireAsset ? (
                <>
                  {' '}
                  Document:{' '}
                  <span className="font-semibold">{retireAsset.title}</span>.
                </>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-spice-border bg-spice-bg-surface/95 px-6 py-4 sm:flex-row sm:justify-end sm:items-center">
            <Button
              variant="ghost"
              className="h-10 text-sm"
              disabled={retireModalDisabled}
              onClick={() => {
                setRetireConfirmOpen(false);
                setRetireAsset(null);
                setRetireError('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-10 min-w-[10rem] text-sm"
              disabled={retireModalDisabled || !retireAsset}
              onClick={() => {
                if (!retireAsset) return;
                setRetireError('');
                void (async () => {
                  try {
                    await retireKnowledgeDocument(retireAsset.id).unwrap();
                    setRetireConfirmOpen(false);
                    setRetireAsset(null);
                    setRetireError('');
                  } catch (err) {
                    setRetireError(formatRtkQueryError(err));
                  }
                })();
              }}
            >
              {isRetiring ? 'Removing…' : 'Confirm Remove'}
            </Button>
          </div>
        </Card>
      </Modal>
    </div>
  );
};
