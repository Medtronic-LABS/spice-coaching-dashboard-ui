import { useEffect, useMemo, useState } from 'react';
import { Table, type ColumnDef } from '@/components/common/Table';
import { SectionQueryErrorState } from '@/components/common/SectionQueryErrorState';
import { TablePagination } from '@/components/common/TablePagination';
import { Card } from '@/components/ui';
import {
  useFetchConfigChangesQuery,
  type ConfigThresholdChangeItem,
} from '@/features/admin-configs/api/adminConfigsApi';
import { formatConfigDurationValue } from '@/features/admin-configs/utils/configDuration';
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
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [paginationTotalPages, setPaginationTotalPages] = useState(1);

  const {
    page,
    setPage,
    pageInput,
    resetPage,
    commitPageInput,
    handlePageInputChange,
  } = useTablePageInput(paginationTotalPages);

  useEffect(() => {
    resetPage();
  }, [refreshNonce, configKey, resetPage]);

  const { data, isLoading, isError, error, refetch } =
    useFetchConfigChangesQuery({
      key: configKey,
      limit: pageSize,
      offset: tablePageOffset(page, pageSize),
    });

  const totalChanges = data?.total_changes ?? 0;
  const totalPages = data?.total_pages ?? 0;

  useEffect(() => {
    setPaginationTotalPages(totalPages);
  }, [totalPages]);

  const rows = useMemo<ConfigHistoryRow[]>(() => {
    return (data?.changes ?? []).map((change, index) =>
      toHistoryRow(change, tablePageOffset(page, pageSize) + index),
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

  const { start: rangeStart, end: rangeEnd } = tablePaginationRange(
    page,
    pageSize,
    rows.length,
  );

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
        <SectionQueryErrorState
          error={error}
          errorTitle="Unable to load configuration history"
          onRetry={() => void refetch()}
        />
      ) : null}

      <Table<ConfigHistoryRow>
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.id}
        caption="Configuration history"
        isLoading={isLoading}
        loadingMessage="Loading configuration history…"
        emptyMessage="No configuration changes yet."
      />

      <TablePagination
        page={page}
        pageSize={pageSize}
        pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
        totalItems={totalChanges}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        pageInput={pageInput}
        hasPrevPage={tableHasPrevPage(page)}
        hasNextPage={tableHasNextPage(page, totalPages)}
        onPageSizeChange={(next) => {
          setPageSize(next);
          resetPage();
        }}
        onPageInputChange={handlePageInputChange}
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
