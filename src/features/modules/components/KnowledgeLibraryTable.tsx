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
  Loader,
  SearchInput,
  Select,
  Tabs,
  TruncatedText,
} from '@/components/ui';
import { ModuleAssignmentDialog } from '@/features/modules/components/ModuleAssignmentDialog';
import { KnowledgeLibraryFilters } from '@/features/modules/components/KnowledgeLibraryFilters';
import {
  useDeactivateKnowledgeAssetMutation,
  useFetchKnowledgeAssetsQuery,
  useFetchKnowledgeUploadersQuery,
  useLazyGetKnowledgeAssetDownloadQuery,
  usePatchKnowledgeAssetMutation,
  usePutKnowledgeAssetThumbnailMutation,
} from '@/features/modules/api/adminKnowledgeApi';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';
import {
  KNOWLEDGE_LIBRARY_FILTER_DEFAULTS,
  type KnowledgeAsset,
} from '@/features/modules/types/knowledgeLibrary.types';
import {
  hasActiveKnowledgeDrawerFilters,
  isKnowledgeDrawerDateRangeInvalid,
  KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
  type KnowledgeLibraryDrawerFilters,
} from '@/features/modules/utils/knowledgeLibraryFilters';

type KnowledgeTableRow = KnowledgeAsset & {
  actionsAssign: '';
  actionsEdit: '';
  actionsDownload: '';
  actionsDelete: '';
};

type KnowledgeStatusTab = 'active' | 'deactivated';

const PAGE_SIZE_OPTIONS = [10, 20, 30] as const;

function computeTotalPages(total: number, pageSize: number): number {
  if (!pageSize) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export const KnowledgeLibraryTable = () => {
  const [statusTab, setStatusTab] = useState<KnowledgeStatusTab>(
    KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.status,
  );
  const [q, setQ] = useState(KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.q);
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

  // Assign/Edit/Delete modals.
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentAsset, setAssignmentAsset] = useState<KnowledgeAsset | null>(
    null,
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<KnowledgeAsset | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editError, setEditError] = useState('');

  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [deactivateAsset, setDeactivateAsset] = useState<KnowledgeAsset | null>(
    null,
  );
  const [deactivateError, setDeactivateError] = useState('');

  const [triggerDownload, { isLoading: isDownloading }] =
    useLazyGetKnowledgeAssetDownloadQuery();

  const [patchKnowledgeAsset, { isLoading: isPatchingTitle }] =
    usePatchKnowledgeAssetMutation();
  const [putKnowledgeAssetThumbnail, { isLoading: isReplacingThumbnail }] =
    usePutKnowledgeAssetThumbnailMutation();

  const [deactivateKnowledgeAsset, { isLoading: isDeactivating }] =
    useDeactivateKnowledgeAssetMutation();

  const { data: uploadersData } = useFetchKnowledgeUploadersQuery();
  const uploaderOptions = useMemo(
    () => uploadersData?.uploaders ?? [],
    [uploadersData?.uploaders],
  );

  const drawerDateRangeInvalid =
    isKnowledgeDrawerDateRangeInvalid(appliedDrawerFilters);
  const filtersActive = hasActiveKnowledgeDrawerFilters(appliedDrawerFilters);

  const queryArgs = useMemo(
    () => ({
      q,
      uploadedBy: appliedDrawerFilters.uploadedBy,
      assigned: appliedDrawerFilters.assigned,
      status: statusTab,
      uploadedAtFrom: appliedDrawerFilters.uploadedAtFrom,
      uploadedAtTo: appliedDrawerFilters.uploadedAtTo,
      updatedAtFrom: appliedDrawerFilters.updatedAtFrom,
      updatedAtTo: appliedDrawerFilters.updatedAtTo,
      sortBy,
      sortOrder,
      page,
      pageSize,
    }),
    [appliedDrawerFilters, page, pageSize, q, sortBy, sortOrder, statusTab],
  );

  const {
    data: knowledgeList,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useFetchKnowledgeAssetsQuery(queryArgs, {
    skip: drawerDateRangeInvalid,
  });

  const assets = useMemo<KnowledgeTableRow[]>(
    () =>
      (knowledgeList?.assets ?? []).map((a) => ({
        ...a,
        actionsAssign: '',
        actionsEdit: '',
        actionsDownload: '',
        actionsDelete: '',
      })),
    [knowledgeList?.assets],
  );

  const total = knowledgeList?.total ?? 0;
  const totalPages = computeTotalPages(total, pageSize);
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [statusTab, q, appliedDrawerFilters, sortBy, sortOrder, pageSize]);

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
        key: 'thumbnailUrl',
        header: 'Thumbnail',
        className: 'w-[6rem]',
        render: (row) =>
          row.thumbnailUrl ? (
            // Use a fixed aspect box to keep the table stable.
            <div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-md border border-spice-border bg-spice-bg-tint">
              <img
                src={row.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <span className="text-xs text-spice-text-muted">—</span>
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
            <div className="mt-0.5 text-xs text-spice-text-muted">
              Pages {row.startPage}–{row.endPage}
            </div>
          </div>
        ),
      },
      {
        key: 'fileType',
        header: 'File Type',
        render: () => 'PDF',
      },
      {
        key: 'uploadedAt',
        header: 'Uploaded Date',
        sortable: true,
        sortKey: 'uploaded_at',
        render: (row) =>
          row.uploadedAt ? formatDisplayDateTime(row.uploadedAt) : '—',
      },
      {
        key: 'uploadedBy',
        header: 'Uploaded By',
        sortable: true,
        sortKey: 'uploaded_by',
        render: (row) => row.uploadedBy || '—',
      },
      {
        key: 'updatedAt',
        header: 'Last Updated',
        sortable: true,
        sortKey: 'updated_at',
        render: (row) =>
          row.updatedAt ? formatDisplayDateTime(row.updatedAt) : '—',
      },
      {
        key: 'actionsAssign',
        header: 'Assign',
        render: (row) => {
          if (row.status === 'deactivated') return null;
          return (
            <Button
              className="h-8 px-3 text-xs"
              variant="secondary"
              disabled={
                isDeactivating || isPatchingTitle || isReplacingThumbnail
              }
              onClick={() => {
                setAssignmentAsset(row);
                setAssignmentOpen(true);
              }}
            >
              Assign
            </Button>
          );
        },
      },
      {
        key: 'actionsEdit',
        header: 'Edit',
        render: (row) => {
          if (row.status === 'deactivated') return null;
          return (
            <Button
              className="h-8 px-3 text-xs"
              variant="secondary"
              disabled={
                isDeactivating || isPatchingTitle || isReplacingThumbnail
              }
              onClick={() => {
                setEditError('');
                setEditAsset(row);
                setEditTitle(row.title);
                setEditThumbnailFile(null);
                setEditOpen(true);
              }}
            >
              Edit
            </Button>
          );
        },
      },
      {
        key: 'actionsDownload',
        header: 'Download',
        render: (row) => {
          return (
            <Button
              className="h-8 px-3 text-xs"
              disabled={isDownloading}
              onClick={() => {
                void (async () => {
                  try {
                    const res = await triggerDownload(row.id).unwrap();
                    const a = document.createElement('a');
                    a.href = res.download_url;
                    a.download = res.filename;
                    a.rel = 'noreferrer';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  } catch (err) {
                    // Prefer to show inline errors in the table area; keep the UX light for Phase 3.

                    console.error(err);
                  }
                })();
              }}
            >
              {isDownloading ? 'Working…' : 'Download'}
            </Button>
          );
        },
      },
      {
        key: 'actionsDelete',
        header: 'Delete',
        render: (row) => {
          if (row.status === 'deactivated')
            return <span className="text-xs text-spice-text-muted">—</span>;
          return (
            <Button
              className="h-8 px-3 text-xs text-spice-semantic-error hover:bg-spice-semantic-errorBg"
              variant="secondary"
              disabled={isDeactivating}
              onClick={() => {
                setDeactivateError('');
                setDeactivateAsset(row);
                setDeactivateConfirmOpen(true);
              }}
            >
              Delete
            </Button>
          );
        },
      },
    ],
    [
      isDeactivating,
      isDownloading,
      isPatchingTitle,
      isReplacingThumbnail,
      triggerDownload,
    ],
  );

  const retryErrorBanner = error ? (
    <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
      {formatRtkQueryError(error)}
      <div className="mt-2">
        <Button
          variant="secondary"
          className="h-8 text-xs"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    </div>
  ) : null;

  const editModalDisabled =
    isPatchingTitle || isReplacingThumbnail || isDeactivating;
  const deactivateModalDisabled = isDeactivating;

  return (
    <div className="space-y-4">
      <Loader
        open={isLoading || isFetching}
        label="Loading knowledge assets…"
      />

      <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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
          <div className="flex items-center gap-3">
            <Tabs
              items={[
                { label: 'Active', value: 'active' },
                { label: 'Deactivated', value: 'deactivated' },
              ]}
              value={statusTab}
              onChange={(v) =>
                setStatusTab(v === 'deactivated' ? 'deactivated' : 'active')
              }
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

        <div className="max-w-xl space-y-2">
          <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
            Search title
          </div>
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search knowledge…"
          />
        </div>

        {retryErrorBanner}

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
            uploaderOptions={uploaderOptions}
            onChange={setDraftDrawerFilters}
            onClearAll={handleClearDraftFilters}
            onApply={handleApplyFilters}
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

      {assignmentAsset ? (
        <ModuleAssignmentDialog
          open={assignmentOpen}
          onClose={() => {
            setAssignmentOpen(false);
            setAssignmentAsset(null);
          }}
          moduleId={assignmentAsset.id}
          moduleTitle={assignmentAsset.title}
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
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={editModalDisabled}
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null;
                    e.target.value = '';
                    setEditThumbnailFile(next);
                  }}
                />
                <div className="flex h-10 items-center justify-center rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-medium hover:bg-spice-bg-tint">
                  {editThumbnailFile ? 'Change thumbnail' : 'Choose thumbnail'}
                </div>
              </label>
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
                    await patchKnowledgeAsset({
                      id: editAsset.id,
                      title: editTitle.trim(),
                    }).unwrap();

                    if (editThumbnailFile) {
                      await putKnowledgeAssetThumbnail({
                        id: editAsset.id,
                        thumbnail: editThumbnailFile,
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
        open={deactivateConfirmOpen}
        labelledBy="knowledge-deactivate-title"
        onClose={() => {
          if (deactivateModalDisabled) return;
          setDeactivateConfirmOpen(false);
          setDeactivateAsset(null);
          setDeactivateError('');
        }}
      >
        <Card
          variant="elevated"
          className="w-full max-w-xl border-spice-border p-0 shadow-lg"
        >
          <div className="shrink-0 space-y-4 p-6 pb-4">
            <h2
              id="knowledge-deactivate-title"
              className="text-xl font-semibold text-spice-text-primary"
            >
              Deactivate Knowledge Asset
            </h2>
            {deactivateError ? (
              <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
                {deactivateError}
              </div>
            ) : null}
            <p className="text-sm text-spice-text-muted">
              This will deactivate the asset (soft-delete) and clear
              assignments.
              {deactivateAsset ? (
                <>
                  {' '}
                  Asset:{' '}
                  <span className="font-semibold">{deactivateAsset.title}</span>
                  .
                </>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-spice-border bg-spice-bg-surface/95 px-6 py-4 sm:flex-row sm:justify-end sm:items-center">
            <Button
              variant="ghost"
              className="h-10 text-sm"
              disabled={deactivateModalDisabled}
              onClick={() => {
                setDeactivateConfirmOpen(false);
                setDeactivateAsset(null);
                setDeactivateError('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-10 min-w-[10rem] text-sm"
              disabled={deactivateModalDisabled || !deactivateAsset}
              onClick={() => {
                if (!deactivateAsset) return;
                setDeactivateError('');
                void (async () => {
                  try {
                    await deactivateKnowledgeAsset(deactivateAsset.id).unwrap();
                    setDeactivateConfirmOpen(false);
                    setDeactivateAsset(null);
                    setDeactivateError('');
                  } catch (err) {
                    setDeactivateError(formatRtkQueryError(err));
                  }
                })();
              }}
            >
              {isDeactivating ? 'Deactivating…' : 'Confirm Deactivate'}
            </Button>
          </div>
        </Card>
      </Modal>
    </div>
  );
};
