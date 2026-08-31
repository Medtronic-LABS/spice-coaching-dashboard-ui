import { useTranslation } from 'react-i18next';
import { BookIcon, EyeIcon, UsersIcon } from '@/assets/icon';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import { StatCard } from '@/components/ui';
import { WidgetSubheading } from '@/features/admin-dashboard/components/document-usage/DocumentUsageChrome';
import type { DocumentUsageEventRow } from '@/features/admin-dashboard/types/dashboard.types';
import {
  formatDocumentUsageRoleAbbreviation,
  PAGE_SIZE_OPTIONS,
} from '@/features/admin-dashboard/utils/documentUsage';
import {
  DOC_TABLE_CELL,
  DOCUMENT_USAGE_TABLE_PROPS,
} from '@/features/admin-dashboard/utils/documentUsageTableLayout';
import { tableHasNextPage, tableHasPrevPage } from '@/utils/tablePagination';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  DISPLAY_DATETIME_TABLE_COLUMN_CLASS,
} from '@/utils/formatDisplayDateTime';

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
      colClassName: 'w-[14rem]',
      headerClassName: `max-w-[14rem] ${DOC_TABLE_CELL.compact}`,
      className: `max-w-[14rem] ${DOC_TABLE_CELL.wrap} ${DOC_TABLE_CELL.compact}`,
      render: (row) => {
        const name =
          row.user_name ?? t('adminDashboard.documentUsage.unknownUser');
        return (
          <span className="font-medium text-spice-text-primary">{name}</span>
        );
      },
    },
    {
      key: 'user_role',
      header: t('adminDashboard.documentUsage.eventColumns.role'),
      colClassName: 'w-14',
      headerClassName: `w-14 ${DOC_TABLE_CELL.compact}`,
      className: `w-14 ${DOC_TABLE_CELL.nowrap} ${DOC_TABLE_CELL.compact}`,
      render: (row) => formatDocumentUsageRoleAbbreviation(row.user_role),
    },
    {
      key: 'viewed_at',
      header: t('adminDashboard.documentUsage.eventColumns.viewedAt'),
      colClassName: 'w-[13.5rem]',
      headerClassName: `${DISPLAY_DATETIME_TABLE_COLUMN_CLASS} ${DOC_TABLE_CELL.compact}`,
      className: `${DISPLAY_DATETIME_TABLE_COLUMN_CLASS} ${DOC_TABLE_CELL.compact}`,
      render: (row) => formatDisplayDateTime(row.viewed_at),
    },
    {
      key: 'geography',
      header: t('adminDashboard.documentUsage.eventColumns.geography'),
      // No fixed max-width — takes remaining space after Role / Opened At.
      headerClassName: DOC_TABLE_CELL.compact,
      className: `${DOC_TABLE_CELL.wrap} ${DOC_TABLE_CELL.compact}`,
      render: (row) => row.geography,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid items-stretch gap-2 sm:grid-cols-3">
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
          labelClassName="shrink-0 whitespace-nowrap"
          value={formatDisplayDate(lastViewedAt)}
          valueClassName="text-base font-bold leading-snug"
          allowValueWrap
        />
      </div>
      <WidgetSubheading title={t('adminDashboard.documentUsage.opensTitle')} />
      <Table<EventTableRow>
        data={eventRows}
        columns={eventColumns}
        {...DOCUMENT_USAGE_TABLE_PROPS}
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
        hasPrevPage={tableHasPrevPage(page)}
        hasNextPage={tableHasNextPage(page, totalPages)}
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
