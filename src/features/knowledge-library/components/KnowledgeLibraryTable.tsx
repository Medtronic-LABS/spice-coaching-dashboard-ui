import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FIELD_LIMITS,
  fieldLimitExceededMessage,
  TABLE_CELL_LABEL_MAX_LENGTH,
  TABLE_TITLE_COLUMN_CLASS,
} from '@/constants/fieldLimits';
import {
  DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
  formatDisplayDateTime,
} from '@/utils/formatDisplayDateTime';
import { cn } from '@/utils';
import { type ColumnDef, Table } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import {
  SettingsFilterDrawer,
  SettingsFilterTriggerButton,
} from '@/components/common/SettingsFilterDrawer';
import {
  Button,
  Card,
  SearchInput,
  SectionHeader,
  StatusBadge,
  TABLE_STATUS_BADGE_CLASSNAME,
  Tabs,
  TruncatedText,
  typographyClasses,
} from '@/components/ui';
import { KnowledgeLibraryFilters } from '@/features/knowledge-library/components/KnowledgeLibraryFilters';
import { KnowledgeEditModal } from '@/features/knowledge-library/components/KnowledgeEditModal';
import { KnowledgeRetireModal } from '@/features/knowledge-library/components/KnowledgeRetireModal';
import { KnowledgeThumbnailCell } from '@/features/knowledge-library/components/KnowledgeThumbnailCell';
import { AssignmentDialog } from '@/features/modules/components/AssignmentDialog';
import {
  useFetchKnowledgeUploadersQuery,
  useRetireKnowledgeDocumentMutation,
} from '@/features/knowledge-library/api/adminKnowledgeApi';
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
} from '@/features/knowledge-library/utils/knowledgeDownloadFilename';
import {
  KNOWLEDGE_LIBRARY_FILTER_DEFAULTS,
  type KnowledgeLibraryItem,
  type KnowledgeLibraryStatusTab,
} from '@/features/knowledge-library/types/knowledgeLibrary.types';
import {
  hasActiveKnowledgeDrawerFilters,
  isKnowledgeDrawerDateRangeInvalid,
  KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
  resolveKnowledgeCatalogStatusFilter,
  uploadedDateInputToFromIso,
  uploadedDateInputToToIso,
  type KnowledgeLibraryDrawerFilters,
} from '@/features/knowledge-library/utils/knowledgeLibraryFilters';
import { getKnowledgeDocumentStatusBadgeProps } from '@/features/knowledge-library/utils/knowledgeDocumentStatusBadge';
import type { OpenDocumentAssignmentState } from '@/features/modules/types/assignmentSuccessNavigation.types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTablePageInput } from '@/hooks/useTablePageInput';
import {
  TABLE_PAGE_SIZE_OPTIONS,
  tableHasNextPage,
  tableHasPrevPage,
  tablePageOffset,
  tablePaginationRange,
} from '@/utils/tablePagination';

type KnowledgeTableRow = KnowledgeLibraryItem & {
  actions: '';
};

const KNOWLEDGE_SEARCH_DEBOUNCE_MS = 300;

export const KnowledgeLibraryTable = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const [pageSize, setPageSize] = useState(
    KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.pageSize,
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
    const offset = tablePageOffset(page, pageSize);
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
    isError,
    error,
    refetch,
  } = useFetchSourceDocumentsQuery(queryArgs, {
    skip: drawerDateRangeInvalid,
  });

  useEffect(() => {
    const state = (location.state ?? {}) as OpenDocumentAssignmentState;
    const open = state.openDocumentAssignment;
    if (!open || open.noun !== 'document') return;

    setAssignTarget({
      id: open.sourceDocumentId,
      title: open.title,
    });
    navigate(location.pathname, { replace: true, state: undefined });
  }, [location.pathname, location.state, navigate]);

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
  const hasPrevPage = tableHasPrevPage(page);
  const hasNextPage = tableHasNextPage(page, totalPages);

  useEffect(() => {
    setPaginationTotalPages(totalPages);
  }, [totalPages]);

  useEffect(() => {
    resetPage();
  }, [statusTab, searchQ, appliedDrawerFilters, sortBy, sortOrder, resetPage]);

  const { start: rangeStart, end: rangeEnd } = tablePaginationRange(
    page,
    pageSize,
    assets.length,
  );

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
    if (editTitle.trim().length > FIELD_LIMITS.documentTitle) {
      setEditError(
        fieldLimitExceededMessage('Title', FIELD_LIMITS.documentTitle),
      );
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
        headerClassName: TABLE_TITLE_COLUMN_CLASS,
        className: TABLE_TITLE_COLUMN_CLASS,
        render: (row) => (
          <div className="w-full min-w-0">
            <TruncatedText
              text={row.title}
              maxChars={TABLE_CELL_LABEL_MAX_LENGTH}
              focusable
              className={cn(
                typographyClasses.tableCellPrimary,
                'font-semibold',
              )}
            />
            {row.originalFilename ? (
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
        key: 'fileType',
        header: 'File Type',
        render: (row) => row.fileType.toUpperCase(),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortKey: 'status',
        headerClassName: 'w-[1%] whitespace-nowrap px-3 sm:px-4',
        className: 'w-[1%] whitespace-nowrap px-3 sm:px-4',
        render: (row) => (
          <StatusBadge
            {...getKnowledgeDocumentStatusBadgeProps(row.status)}
            className={TABLE_STATUS_BADGE_CLASSNAME}
          />
        ),
      },
      {
        key: 'uploadedAt',
        header: 'Uploaded Date',
        sortable: true,
        sortKey: 'uploaded_date',
        className: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
        headerClassName: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
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
        className: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
        headerClassName: DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
        render: (row) =>
          row.updatedAt ? formatDisplayDateTime(row.updatedAt) : '—',
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'min-w-[18rem] whitespace-nowrap',
        headerClassName: 'min-w-[18rem] whitespace-nowrap',
        render: (row) => {
          const isRetired = row.status === 'retired';
          const mutatingBusy =
            isRetiring || isPatchingTitle || isReplacingThumbnail;

          return (
            <div className="inline-flex flex-nowrap items-center gap-2">
              {!isRetired ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0 text-xs"
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
                    size="sm"
                    className="shrink-0 text-xs"
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
                size="sm"
                variant="secondary"
                className="shrink-0 text-xs"
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
                  size="sm"
                  variant="secondary"
                  className="shrink-0 text-xs text-spice-semantic-error hover:bg-spice-semantic-errorBg"
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

  const editModalDisabled =
    isPatchingTitle || isReplacingThumbnail || isRetiring;
  const retireModalDisabled = isRetiring;

  return (
    <div className="space-y-4">
      <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
        <SectionHeader title="Knowledge Library" />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
          <div className="flex shrink-0 items-center gap-3">
            <div className="w-64 sm:w-72">
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder="Search knowledge…"
              />
            </div>
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
          isLoading={isLoading}
          loadingMessage="Loading knowledge…"
          emptyMessage="No results"
          sortBy={sortBy}
          sortDir={sortOrder}
          onSort={handleSort}
          queryError={isError && !isFetching ? error : undefined}
          queryErrorTitle="Unable to load knowledge documents"
          onRetryQuery={() => void refetch()}
        />

        <TablePagination
          page={page}
          pageSize={pageSize}
          pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
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
          onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
        />
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
