import { useTranslation } from 'react-i18next';
import { BookIcon, EyeIcon, UsersIcon } from '@/assets/icon';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import { StatCard } from '@/components/ui';
import { WidgetSubheading } from '@/features/admin-dashboard/components/document-usage/DocumentUsageChrome';
import type { DocumentUsageEventRow } from '@/features/admin-dashboard/types/dashboard.types';
import { PAGE_SIZE_OPTIONS } from '@/features/admin-dashboard/utils/documentUsage';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

type EventTableRow = DocumentUsageEventRow & { geography: string };

interface DocumentUsageDetailViewProps {
  totalViews: number;
  uniqueUsers: number;
  lastViewedAt: string | null;
  eventRows: EventTableRow[];
  page: number;
  pageSize: number;
  pageInput: string;
  totalItems: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  onPageSizeChange: (next: number) => void;
  onPageInputChange: (raw: string) => void;
  onCommitPageInput: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const DocumentUsageDetailView = ({
  totalViews,
  uniqueUsers,
  lastViewedAt,
  eventRows,
  page,
  pageSize,
  pageInput,
  totalItems,
  totalPages,
  rangeStart,
  rangeEnd,
  onPageSizeChange,
  onPageInputChange,
  onCommitPageInput,
  onPrevPage,
  onNextPage,
}: DocumentUsageDetailViewProps) => {
  const { t } = useTranslation();

  const eventColumns: Array<ColumnDef<EventTableRow>> = [
    {
      key: 'user_name',
      header: t('adminDashboard.documentUsage.eventColumns.user'),
      render: (row) =>
        row.user_name ?? t('adminDashboard.documentUsage.unknownUser'),
    },
    {
      key: 'user_role',
      header: t('adminDashboard.documentUsage.eventColumns.role'),
      render: (row) => row.user_role ?? '—',
    },
    {
      key: 'viewed_at',
      header: t('adminDashboard.documentUsage.eventColumns.viewedAt'),
      render: (row) => formatDisplayDateTime(row.viewed_at),
    },
    {
      key: 'geography',
      header: t('adminDashboard.documentUsage.eventColumns.geography'),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <StatCard
          icon={<EyeIcon className="h-3.5 w-3.5" />}
          label={t('adminDashboard.documentUsage.kpis.views')}
          value={totalViews}
        />
        <StatCard
          icon={<UsersIcon className="h-3.5 w-3.5" />}
          label={t('adminDashboard.documentUsage.kpis.users')}
          value={uniqueUsers}
        />
        <StatCard
          icon={<BookIcon className="h-3.5 w-3.5" />}
          label={t('adminDashboard.documentUsage.columns.lastViewed')}
          value={formatDisplayDateTime(lastViewedAt)}
          valueClassName="text-sm"
        />
      </div>
      <WidgetSubheading title={t('adminDashboard.documentUsage.opensTitle')} />
      <Table<EventTableRow>
        data={eventRows}
        columns={eventColumns}
        keyExtractor={(row) => row.event_id}
        caption={t('adminDashboard.documentUsage.opensTitle')}
        emptyMessage={t('common.noData')}
      />
      <TablePagination
        page={page}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        totalItems={totalItems}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        pageInput={pageInput}
        hasPrevPage={page > 0}
        hasNextPage={page + 1 < totalPages}
        onPageSizeChange={onPageSizeChange}
        onPageInputChange={onPageInputChange}
        onCommitPageInput={onCommitPageInput}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
        rowsPerPageAriaLabel={t(
          'adminDashboard.documentUsage.eventRowsPerPage',
        )}
        pageNumberAriaLabel={t('adminDashboard.documentUsage.eventPageNumber')}
        className="border-t border-spice-border px-0 pt-3"
      />
    </div>
  );
};
