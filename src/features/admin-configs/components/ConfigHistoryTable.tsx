import { useEffect, useMemo, useState } from 'react';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import { Button, Card, ErrorState, Loader } from '@/components/ui';
import {
  useFetchConfigChangesQuery,
  type ConfigThresholdChangeItem,
} from '@/features/admin-configs/api/adminConfigsApi';
import { formatConfigDurationValue } from '@/features/admin-configs/utils/configDuration';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

const HISTORY_PAGE_SIZE_OPTIONS = [5, 10, 15, 25] as const;
const DEFAULT_HISTORY_PAGE_SIZE = 10;

type ConfigHistoryRow = {
  id: string;
  updatedAtLabel: string;
  updatedBy: string;
  daysLabel: string;
};

export interface ConfigHistoryTableProps {
  configKey: string;
  /** Increment after a successful config save to jump back to the first page. */
  refreshNonce?: number;
}

export const ConfigHistoryTable = ({
  configKey,
  refreshNonce = 0,
}: ConfigHistoryTableProps) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_HISTORY_PAGE_SIZE);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    setPage(0);
    setPageInput('1');
  }, [refreshNonce, configKey]);

  const { data, isLoading, isError, refetch } = useFetchConfigChangesQuery({
    key: configKey,
    limit: pageSize,
    offset: page * pageSize,
  });

  const totalChanges = data?.total_changes ?? 0;
  const totalPages = data?.total_pages ?? 0;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPageInput(String(page + 1));
  }, [page]);

  const rows = useMemo<ConfigHistoryRow[]>(() => {
    return (data?.changes ?? []).map((change, index) =>
      toHistoryRow(change, page * pageSize + index),
    );
  }, [data?.changes, page, pageSize]);

  const columns = useMemo<Array<ColumnDef<ConfigHistoryRow>>>(
    () => [
      {
        key: 'updatedAtLabel',
        header: 'Last Updated Date & Time',
        headerClassName: 'whitespace-nowrap',
        className: 'whitespace-nowrap',
        render: (row) => row.updatedAtLabel,
      },
      {
        key: 'updatedBy',
        header: 'Updated By',
        render: (row) => row.updatedBy,
      },
      {
        key: 'daysLabel',
        header: 'No. of Days',
        headerClassName: 'whitespace-nowrap',
        className: 'whitespace-nowrap',
        render: (row) => row.daysLabel,
      },
    ],
    [],
  );

  const rangeStart = rows.length ? page * pageSize + 1 : 0;
  const rangeEnd = rows.length ? page * pageSize + rows.length : 0;
  const hasPrevPage = page > 0;
  const hasNextPage = totalPages > 0 && page < totalPages - 1;

  const commitPageInput = () => {
    const parsed = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setPageInput(String(page + 1));
      return;
    }
    const nextPage = Math.min(Math.max(parsed, 1), Math.max(totalPages, 1));
    setPage(nextPage - 1);
    setPageInput(String(nextPage));
  };

  return (
    <Card variant="elevated" className="space-y-4 p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-spice-text-primary">
          Configuration History
        </h2>
        <p className="text-sm text-spice-text-muted">
          Audit trail of Quiz Reattempt Validity updates.
        </p>
      </div>

      {isError ? (
        <ErrorState
          title="Unable to load configuration history"
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}

      <Loader open={isLoading} label="Loading configuration history…" />

      <Table<ConfigHistoryRow>
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.id}
        caption="Configuration history"
        emptyMessage={
          isLoading
            ? 'Loading configuration history…'
            : 'No configuration changes yet.'
        }
      />

      <TablePagination
        page={page}
        pageSize={pageSize}
        pageSizeOptions={HISTORY_PAGE_SIZE_OPTIONS}
        totalItems={totalChanges}
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
        onPageInputChange={setPageInput}
        onCommitPageInput={commitPageInput}
        onPrevPage={() => setPage((current) => Math.max(0, current - 1))}
        onNextPage={() => setPage((current) => current + 1)}
        rowsPerPageAriaLabel="Configuration history rows per page"
        pageNumberAriaLabel="Configuration history page number"
        className="border-t border-spice-border px-0 pt-3"
      />
    </Card>
  );
};

function toHistoryRow(
  change: ConfigThresholdChangeItem,
  index: number,
): ConfigHistoryRow {
  const days = formatConfigDurationValue(change.current_value_json);
  return {
    id: `${change.updated_at}-${change.updated_by}-${index}`,
    updatedAtLabel: formatDisplayDateTime(change.updated_at),
    updatedBy: change.updated_by.trim() || '—',
    daysLabel: days || '—',
  };
}
