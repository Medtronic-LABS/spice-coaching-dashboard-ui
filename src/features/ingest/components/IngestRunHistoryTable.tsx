import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshIcon } from '@/assets/icon';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import { Button, Card, SearchInput, TruncatedText } from '@/components/ui';
import { paths } from '@/constants/routes';
import { useFetchIngestionRunsQuery } from '@/features/ingest/api/adminIngestionRunsApi';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';
import {
  formatIngestRunDurationDisplay,
  formatIngestRunGeneratedCountParts,
  formatIngestRunStatusDisplay,
  formatIngestRunTimestamp,
  ingestRunStatusBadgeClassName,
  ingestRunStatusTone,
  shouldPollIngestionRunList,
} from '@/features/ingest/utils/ingestRunHistoryUtils';
import { hasGeneratedIngestModules } from '@/features/ingest/utils/ingestStatus';
import { formatHierarchyActorName } from '@/features/modules/types/hierarchyActor';
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
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

const RUN_HISTORY_POLL_INTERVAL_MS = 30000;
const RUN_HISTORY_SEARCH_DEBOUNCE_MS = 300;

type IngestRunHistoryRow = {
  id: string;
  sourceDocumentId: string;
  fileName: string | null;
  generatedModuleLabel: string;
  generatedCardLabel: string;
  generatedQuizLabel: string;
  statusLabel: string;
  statusTone: ReturnType<typeof ingestRunStatusTone>;
  durationLabel: string;
  ingestedAt: string;
  ingestedBy: string | null;
  hasGeneratedModules: boolean;
  actions: '';
};

export const IngestRunHistoryTable = () => {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [paginationTotalPages, setPaginationTotalPages] = useState(0);
  const {
    page,
    setPage,
    pageInput,
    resetPage,
    commitPageInput,
    handlePageInputChange,
  } = useTablePageInput(paginationTotalPages);
  const [pollIntervalMs, setPollIntervalMs] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>('started_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(
    query,
    RUN_HISTORY_SEARCH_DEBOUNCE_MS,
  );
  const searchQ = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);

  const handleSort = useCallback(
    (newSortBy: string, newSortDir: 'asc' | 'desc') => {
      setSortBy(newSortBy);
      setSortDir(newSortDir);
      resetPage();
    },
    [resetPage],
  );

  useEffect(() => {
    resetPage();
  }, [searchQ, resetPage]);

  const queryArgs = useMemo(
    () => ({
      limit: pageSize,
      offset: tablePageOffset(page, pageSize),
      sort_by: sortBy,
      sort_dir: sortDir,
      ...(searchQ ? { q: searchQ } : {}),
    }),
    [page, pageSize, searchQ, sortBy, sortDir],
  );

  const {
    data: runList,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    fulfilledTimeStamp,
  } = useFetchIngestionRunsQuery(queryArgs, {
    refetchOnMountOrArgChange: true,
    pollingInterval: pollIntervalMs,
  });

  const lastUpdatedLabel = fulfilledTimeStamp
    ? formatDisplayDateTime(new Date(fulfilledTimeStamp).toISOString())
    : '—';

  useEffect(() => {
    setPollIntervalMs(
      shouldPollIngestionRunList(runList?.runs ?? [])
        ? RUN_HISTORY_POLL_INTERVAL_MS
        : 0,
    );
  }, [runList?.runs]);

  const rows = useMemo<IngestRunHistoryRow[]>(() => {
    return (runList?.runs ?? []).map((run) => {
      const counts = formatIngestRunGeneratedCountParts(run);
      return {
        id: run.id,
        sourceDocumentId: run.source_document_id,
        fileName: run.document_label.trim() || null,
        generatedModuleLabel: counts.modules,
        generatedCardLabel: counts.cards,
        generatedQuizLabel: counts.quizzes,
        statusLabel: formatIngestRunStatusDisplay(run.status),
        statusTone: ingestRunStatusTone(run.status),
        durationLabel: formatIngestRunDurationDisplay(
          run.started_at,
          run.completed_at,
        ),
        ingestedAt: run.started_at,
        ingestedBy: run.ingested_by?.name ?? null,
        hasGeneratedModules: hasGeneratedIngestModules(
          run.generated_module_count,
        ),
        actions: '',
      };
    });
  }, [runList?.runs]);

  const totalRuns = runList?.total_runs ?? 0;
  const totalPages = runList?.total_pages ?? 0;
  const hasPrevPage = tableHasPrevPage(page);
  const hasNextPage = tableHasNextPage(page, totalPages);
  const { start: rangeStart, end: rangeEnd } = tablePaginationRange(
    page,
    pageSize,
    rows.length,
  );

  useEffect(() => {
    setPaginationTotalPages(totalPages);
  }, [totalPages]);

  const openGeneratedModules = useCallback(
    (row: IngestRunHistoryRow) => {
      if (!row.sourceDocumentId || !row.hasGeneratedModules) return;
      const state: ModuleLibraryLocationState = {
        tab: 'all',
        sourceDocumentId: row.sourceDocumentId,
        ...(row.fileName ? { sourceDocumentTitle: row.fileName } : {}),
      };
      navigate(paths.moduleLibrary, { state });
    },
    [navigate],
  );

  const columns: Array<ColumnDef<IngestRunHistoryRow>> = useMemo(
    () => [
      {
        key: 'fileName',
        header: 'File name',
        sortable: true,
        sortKey: 'document_label',
        className: 'whitespace-normal',
        render: (row) => (
          <div className="w-[20rem] min-w-[20rem] max-w-[20rem]">
            <TruncatedText
              text={row.fileName ?? '—'}
              focusable
              className="font-semibold text-spice-text-primary"
            />
          </div>
        ),
      },
      {
        key: 'generatedModuleLabel',
        header: 'Modules / cards / quizzes',
        sortable: false,
        render: (row) => (
          <div className="inline-grid w-max grid-cols-[4.75rem_auto_5.5rem_auto_3.25rem] items-center gap-x-1 whitespace-nowrap text-xs text-spice-text-medium">
            <span>{row.generatedModuleLabel}</span>
            <span className="text-spice-text-muted" aria-hidden="true">
              |
            </span>
            <span className="text-center">{row.generatedCardLabel}</span>
            <span className="text-spice-text-muted" aria-hidden="true">
              |
            </span>
            <span>{row.generatedQuizLabel}</span>
          </div>
        ),
      },
      {
        key: 'statusLabel',
        header: 'Status',
        sortable: true,
        sortKey: 'status',
        headerClassName: 'w-[1%] whitespace-nowrap px-3 sm:px-4',
        className: 'w-[1%] whitespace-nowrap px-3 sm:px-4',
        render: (row) => (
          <span
            className={`inline-flex min-w-[8.5rem] justify-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${ingestRunStatusBadgeClassName(row.statusTone)}`}
          >
            {row.statusLabel}
          </span>
        ),
      },
      {
        key: 'durationLabel',
        header: 'Duration',
        sortable: false,
        headerClassName: 'w-[1%] whitespace-nowrap px-3 sm:px-4',
        className: 'w-[1%] whitespace-nowrap px-3 sm:px-4',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {row.durationLabel}
          </span>
        ),
      },
      {
        key: 'ingestedBy',
        header: 'Ingested By',
        sortable: false,
        headerClassName: 'whitespace-nowrap px-3 sm:px-4',
        className: 'whitespace-nowrap px-3 sm:px-4',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {formatHierarchyActorName(row.ingestedBy)}
          </span>
        ),
      },
      {
        key: 'ingestedAt',
        header: 'Ingested Date',
        sortable: true,
        sortKey: 'started_at',
        headerClassName: 'whitespace-nowrap px-3 sm:px-4',
        className: 'whitespace-nowrap px-3 sm:px-4',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {formatIngestRunTimestamp(row.ingestedAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        sortable: false,
        headerClassName: 'w-[1%] whitespace-nowrap px-3 text-left sm:px-4',
        className: 'w-[1%] whitespace-nowrap px-3 text-left sm:px-4',
        render: (row) => (
          <div
            className="inline-flex"
            title={
              row.hasGeneratedModules
                ? undefined
                : 'No modules were generated for this ingestion.'
            }
          >
            <Button
              variant={row.hasGeneratedModules ? 'primary' : 'secondary'}
              className="h-8 min-w-[7.75rem] px-3 text-xs"
              disabled={!row.sourceDocumentId || !row.hasGeneratedModules}
              onClick={() => openGeneratedModules(row)}
            >
              {row.hasGeneratedModules ? 'Open modules' : 'No modules'}
            </Button>
          </div>
        ),
      },
    ],
    [openGeneratedModules],
  );

  const emptyMessage = searchQ
    ? 'No ingestion runs match your search.'
    : 'No ingestion history available. Upload your first document to generate learning modules.';

  return (
    <Card variant="elevated" className="space-y-4 p-4">
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-3">
          <div className="w-64 sm:w-72">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search ingestion history…"
              aria-label="Search ingestion history"
              className="h-9"
            />
          </div>
          <Button
            variant="secondary"
            className="h-8 w-8 px-0"
            aria-label="Refresh"
            title="Refresh"
            onClick={() => {
              refetch();
            }}
          >
            <RefreshIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-spice-text-muted">
          <span>Last updated {lastUpdatedLabel}</span>
          {isFetching && !isLoading ? <span>Updating…</span> : null}
        </div>
      </div>

      <Table<IngestRunHistoryRow>
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.id}
        caption="Ingestion run history"
        isLoading={isLoading}
        loadingMessage="Loading run history…"
        emptyMessage={emptyMessage}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        queryError={isError && !isFetching ? error : undefined}
        queryErrorTitle="Unable to load ingestion history"
        onRetryQuery={() => {
          void refetch();
        }}
      />

      <TablePagination
        page={page}
        pageSize={pageSize}
        pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
        totalItems={totalRuns}
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
        rowsPerPageAriaLabel="Run history rows per page"
        pageNumberAriaLabel="Run history page number"
        className="border-t border-spice-border px-0 pt-3"
      />
    </Card>
  );
};
