import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, type ColumnDef } from '@/components/common/Table';
import { Button, Card, Loader, Select, TruncatedText } from '@/components/ui';
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
import {
  hasGeneratedIngestModules,
  isIngestRunning,
} from '@/features/ingest/utils/ingestStatus';
import { writeActiveIngestSession } from '@/features/ingest/utils/ingestSessionStorage';
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
  isProcessing: boolean;
  hasGeneratedModules: boolean;
  actions: '';
};

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

export const IngestRunHistoryTable = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_RUN_HISTORY_PAGE_SIZE);
  const [pageInput, setPageInput] = useState('1');
  const [pollIntervalMs, setPollIntervalMs] = useState(0);

  const queryArgs = useMemo(
    () => ({
      limit: pageSize,
      offset: page * pageSize,
    }),
    [page, pageSize],
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
        isProcessing: isIngestRunning(run.status),
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

  const resumeRun = useCallback(
    (row: IngestRunHistoryRow) => {
      writeActiveIngestSession({
        source_document_id: row.sourceDocumentId,
        ...(row.fileName ? { title: row.fileName } : {}),
      });
      navigate(paths.ingestDocument);
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
        render: (row) => (
          <div className="grid w-fit grid-cols-[5.5rem_4.5rem_5rem] gap-x-2 text-xs text-spice-text-medium">
            <span>{row.generatedModuleLabel}</span>
            <span>{row.generatedCardLabel}</span>
            <span>{row.generatedQuizLabel}</span>
          </div>
        ),
      },
      {
        key: 'statusLabel',
        header: 'Status',
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
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {row.durationLabel}
          </span>
        ),
      },
      {
        key: 'uploadedAt',
        header: 'Uploaded Date',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {formatIngestRunTimestamp(row.uploadedAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            {row.isProcessing ? (
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={() => resumeRun(row)}
              >
                Monitor
              </Button>
            ) : null}
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
          </div>
        ),
      },
    ],
    [openGeneratedModules, resumeRun],
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
        <div className="space-y-2">
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {formatRtkQueryError(error)}
          </div>
          <Button
            variant="secondary"
            className="h-8 text-xs"
            onClick={() => {
              refetch();
            }}
          >
            Retry
          </Button>
        </div>
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
      />

      <div className="flex flex-col gap-3 border-t border-spice-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-spice-text-muted">
          <label className="inline-flex items-center gap-2">
            <span className="whitespace-nowrap font-medium text-spice-text-medium">
              Rows
            </span>
            <Select
              aria-label="Run history rows per page"
              className="h-8 w-[4.5rem] px-2 text-xs"
              value={String(pageSize)}
              options={RUN_HISTORY_PAGE_SIZE_OPTIONS.map((size) => ({
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
              max={totalPages > 0 ? totalPages : undefined}
              step={1}
              inputMode="numeric"
              aria-label="Run history page number"
              className="h-8 w-14 rounded-md border border-spice-border-mid bg-spice-bg-surface px-2 text-center text-xs font-semibold text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/25"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onBlur={commitPageInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
            />
            <span className="whitespace-nowrap">
              of{' '}
              <span className="font-semibold text-spice-text-medium">
                {Math.max(totalPages, 1)}
              </span>
            </span>
          </label>

          {rows.length ? (
            <span className="whitespace-nowrap">
              Showing{' '}
              <span className="font-semibold text-spice-text-medium">
                {rangeStart}
              </span>
              –
              <span className="font-semibold text-spice-text-medium">
                {rangeEnd}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-spice-text-medium">
                {totalRuns}
              </span>
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
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            disabled={!hasNextPage}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
};
