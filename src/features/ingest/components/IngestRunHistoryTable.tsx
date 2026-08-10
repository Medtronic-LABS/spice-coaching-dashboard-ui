import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshIcon } from '@/assets/icon';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import {
  Button,
  Card,
  ErrorState,
  Loader,
  TruncatedText,
} from '@/components/ui';
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
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

const RUN_HISTORY_PAGE_SIZE_OPTIONS = [5, 10, 15, 25] as const;
const DEFAULT_RUN_HISTORY_PAGE_SIZE = 10;
const RUN_HISTORY_POLL_INTERVAL_MS = 30000;

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
  uploadedAt: string;
  hasGeneratedModules: boolean;
  actions: '';
};

export const IngestRunHistoryTable = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_RUN_HISTORY_PAGE_SIZE);
  const [pageInput, setPageInput] = useState('1');
  const [pollIntervalMs, setPollIntervalMs] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>('started_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = useCallback(
    (newSortBy: string, newSortDir: 'asc' | 'desc') => {
      setSortBy(newSortBy);
      setSortDir(newSortDir);
      setPage(0);
    },
    [],
  );

  const queryArgs = useMemo(
    () => ({
      limit: pageSize,
      offset: page * pageSize,
      sort_by: sortBy,
      sort_dir: sortDir,
    }),
    [page, pageSize, sortBy, sortDir],
  );

  const {
    data: runList,
    isLoading,
    isFetching,
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
        uploadedAt: run.started_at,
        hasGeneratedModules: hasGeneratedIngestModules(
          run.generated_module_count,
        ),
        actions: '',
      };
    });
  }, [runList?.runs]);

  const totalRuns = runList?.total_runs ?? 0;
  const totalPages = runList?.total_pages ?? 0;
  const hasPrevPage = page > 0;
  const hasNextPage = runList?.has_next_page ?? false;
  const pageOffset = runList?.offset ?? page * pageSize;
  const rangeStart = rows.length ? pageOffset + 1 : 0;
  const rangeEnd = rows.length ? pageOffset + rows.length : 0;

  useEffect(() => {
    setPageInput(String(page + 1));
  }, [page]);

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

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

  const commitPageInput = () => {
    const parsed = Number.parseInt(pageInput, 10);
    const isValid =
      Number.isFinite(parsed) &&
      parsed >= 1 &&
      (totalPages === 0 || parsed <= totalPages);
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

  const columns: Array<ColumnDef<IngestRunHistoryRow>> = useMemo(
    () => [
      {
        key: 'fileName',
        header: 'File name',
        sortable: true,
        sortKey: 'document_label',
        className: 'whitespace-normal',
        render: (row) => (
          <div className="min-w-[12rem] max-w-[20rem]">
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
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${ingestRunStatusBadgeClassName(row.statusTone)}`}
          >
            {row.statusLabel}
          </span>
        ),
      },
      {
        key: 'durationLabel',
        header: 'Duration',
        sortable: false,
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {row.durationLabel}
          </span>
        ),
      },
      {
        key: 'uploadedAt',
        header: 'Uploaded Date',
        sortable: true,
        sortKey: 'started_at',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {formatIngestRunTimestamp(row.uploadedAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        sortable: false,
        render: (row) => (
          <span
            className="inline-flex"
            title={
              row.hasGeneratedModules
                ? undefined
                : 'No modules were generated for this ingestion.'
            }
          >
            <Button
              className="h-8 px-3 text-xs"
              disabled={!row.sourceDocumentId || !row.hasGeneratedModules}
              onClick={() => openGeneratedModules(row)}
            >
              {row.hasGeneratedModules ? 'Open modules' : 'No modules'}
            </Button>
          </span>
        ),
      },
    ],
    [openGeneratedModules],
  );

  return (
    <Card variant="elevated" className="space-y-4 p-4">
      <div className="flex items-center justify-end gap-3">
        <span className="text-[11px] text-spice-text-muted">
          Last updated {lastUpdatedLabel}
        </span>
        {isFetching && !isLoading ? (
          <span className="text-[11px] text-spice-text-muted">Updating…</span>
        ) : null}
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

      {error ? (
        <ErrorState
          title="Unable to load run history"
          description={formatRtkQueryError(error)}
          action={
            <Button
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => {
                refetch();
              }}
            >
              Retry
            </Button>
          }
        />
      ) : null}

      <Loader open={isLoading} label="Loading run history…" />

      <Table<IngestRunHistoryRow>
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.id}
        caption="Ingestion run history"
        emptyMessage={
          isLoading
            ? 'Loading run history…'
            : 'No ingestion history available. Upload your first document to generate learning modules.'
        }
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />

      <TablePagination
        page={page}
        pageSize={pageSize}
        pageSizeOptions={RUN_HISTORY_PAGE_SIZE_OPTIONS}
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
