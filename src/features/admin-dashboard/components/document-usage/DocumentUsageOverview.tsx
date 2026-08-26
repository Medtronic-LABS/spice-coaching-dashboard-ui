import { useTranslation } from 'react-i18next';
import { BookIcon, EyeIcon, UsersIcon } from '@/assets/icon';
import { Table, type ColumnDef } from '@/components/common/Table';
import { StatCard } from '@/components/ui';
import {
  TextLink,
  WidgetSubheading,
} from '@/features/admin-dashboard/components/document-usage/DocumentUsageChrome';
import type { DocumentUsageDocumentRow } from '@/features/admin-dashboard/types/dashboard.types';
import { OVERVIEW_DOCUMENTS_LIMIT } from '@/features/admin-dashboard/utils/documentUsage';
import { DOCUMENT_USAGE_TABLE_PROPS } from '@/features/admin-dashboard/utils/documentUsageTableLayout';

type DocumentTableRow = DocumentUsageDocumentRow & { actions: '' };

interface DocumentUsageOverviewProps {
  totalViews: number;
  uniqueDocuments: number;
  uniqueUsers: number;
  totalDocumentRows: number;
  documentRows: DocumentTableRow[];
  documentColumns: Array<ColumnDef<DocumentTableRow>>;
  onViewAllDocuments: () => void;
}

export const DocumentUsageOverview = ({
  totalViews,
  uniqueDocuments,
  uniqueUsers,
  totalDocumentRows,
  documentRows,
  documentColumns,
  onViewAllDocuments,
}: DocumentUsageOverviewProps) => {
  const { t } = useTranslation();
  const iconClassName = 'h-4 w-4';
  const iconProps = { className: iconClassName, strokeWidth: 2 } as const;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          tone="blue"
          icon={<EyeIcon {...iconProps} />}
          label={t('adminDashboard.documentUsage.kpis.views')}
          value={totalViews}
          tooltip={t('adminDashboard.documentUsage.kpis.viewsTooltip')}
        />
        <StatCard
          tone="green"
          icon={<BookIcon {...iconProps} />}
          label={t('adminDashboard.documentUsage.kpis.documents')}
          value={uniqueDocuments}
          tooltip={t('adminDashboard.documentUsage.kpis.documentsTooltip')}
        />
        <StatCard
          tone="purple"
          icon={<UsersIcon {...iconProps} />}
          label={t('adminDashboard.documentUsage.kpis.users')}
          value={uniqueUsers}
          tooltip={t('adminDashboard.documentUsage.kpis.usersTooltip')}
        />
      </div>

      <div>
        <WidgetSubheading
          title={t('adminDashboard.documentUsage.tableTitle')}
        />
        <Table<DocumentTableRow>
          data={documentRows}
          columns={documentColumns}
          {...DOCUMENT_USAGE_TABLE_PROPS}
          keyExtractor={(row) => row.document_id}
          caption={t('adminDashboard.documentUsage.tableTitle')}
          emptyMessage={t('common.noData')}
          getRowClassName={() => 'hover:bg-spice-brand-primary/5'}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-spice-text-muted">
            {t('adminDashboard.documentUsage.showingRange', {
              from: totalDocumentRows === 0 ? 0 : 1,
              to: Math.min(OVERVIEW_DOCUMENTS_LIMIT, totalDocumentRows),
              total: totalDocumentRows,
            })}
          </span>
          {totalDocumentRows > 0 ? (
            <TextLink
              label={t('adminDashboard.documentUsage.viewAllDocuments')}
              onClick={onViewAllDocuments}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};
