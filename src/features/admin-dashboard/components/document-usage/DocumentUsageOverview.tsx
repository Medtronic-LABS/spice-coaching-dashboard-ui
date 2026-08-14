import { useTranslation } from 'react-i18next';
import { BookIcon, EyeIcon, UsersIcon } from '@/assets/icon';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Table, type ColumnDef } from '@/components/common/Table';
import { EmptyState, StatCard, TruncatedText } from '@/components/ui';
import {
  TextLink,
  WidgetSubheading,
} from '@/features/admin-dashboard/components/document-usage/DocumentUsageChrome';
import type { DocumentUsageDocumentRow } from '@/features/admin-dashboard/types/dashboard.types';
import {
  OVERVIEW_DOCUMENTS_LIMIT,
  type DocumentUsageTopCard,
} from '@/features/admin-dashboard/utils/documentUsage';
import { DOCUMENT_USAGE_TABLE_PROPS } from '@/features/admin-dashboard/utils/documentUsageTableLayout';

type DocumentTableRow = DocumentUsageDocumentRow & { actions: '' };

interface DocumentUsageOverviewProps {
  totalViews: number;
  uniqueDocuments: number;
  uniqueUsers: number;
  totalDocumentRows: number;
  topDocuments: DocumentUsageTopCard[];
  documentRows: DocumentTableRow[];
  documentColumns: Array<ColumnDef<DocumentTableRow>>;
  onViewAllTop: () => void;
  onViewAllDocuments: () => void;
}

export const DocumentUsageOverview = ({
  totalViews,
  uniqueDocuments,
  uniqueUsers,
  totalDocumentRows,
  topDocuments,
  documentRows,
  documentColumns,
  onViewAllTop,
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
          title={t('adminDashboard.documentUsage.chartLabel')}
          action={
            topDocuments.length > 0 ? (
              <TextLink
                label={t('adminDashboard.documentUsage.viewAll')}
                onClick={onViewAllTop}
              />
            ) : null
          }
        />
        {topDocuments.length === 0 ? (
          <EmptyState
            title={t('adminDashboard.documentUsage.emptyTitle')}
            description={t('adminDashboard.documentUsage.emptyDescription')}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {topDocuments.map((doc) => (
              <li
                key={doc.id}
                className="rounded-lg border border-spice-border/70 bg-spice-bg-surface px-3 py-2.5"
              >
                <div className="mb-1.5 flex items-center gap-2 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-spice-bg-tint text-[10px] font-semibold tabular-nums text-spice-text-muted">
                    {doc.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <TruncatedText
                      text={doc.title}
                      className="font-medium text-spice-text-primary"
                    />
                  </div>
                  <span className="shrink-0 tabular-nums text-spice-text-muted">
                    {t('adminDashboard.documentUsage.viewsCount', {
                      count: doc.views,
                    })}
                  </span>
                </div>
                <ProgressBar
                  value={doc.percent}
                  className="h-2"
                  barClassName="bg-spice-brand-primary"
                />
              </li>
            ))}
          </ul>
        )}
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
