import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Table, type ColumnDef } from '@/components/common/Table';
import type { DocumentUsageTopCard } from '@/features/admin-dashboard/utils/documentUsage';

type TopDocumentTableRow = {
  document_id: string;
  rank: number;
  document_title: string;
  trend: number;
  total_views: number;
  unique_users: number | null;
};

interface DocumentUsageTopAllViewProps {
  topDocuments: DocumentUsageTopCard[];
}

export const DocumentUsageTopAllView = ({
  topDocuments,
}: DocumentUsageTopAllViewProps) => {
  const { t } = useTranslation();

  const rows: TopDocumentTableRow[] = topDocuments.map((doc) => ({
    document_id: doc.id,
    rank: doc.rank,
    document_title: doc.title,
    trend: doc.percent,
    total_views: doc.views,
    unique_users: doc.uniqueUsers,
  }));

  const columns: Array<ColumnDef<TopDocumentTableRow>> = [
    {
      key: 'rank',
      header: t('adminDashboard.documentUsage.columns.rank'),
      className: 'tabular-nums text-spice-text-muted',
    },
    {
      key: 'document_title',
      header: t('adminDashboard.documentUsage.columns.title'),
      render: (row) => (
        <span className="max-w-[16rem] truncate font-medium text-spice-text-primary">
          {row.document_title}
        </span>
      ),
    },
    {
      key: 'trend',
      header: t('adminDashboard.documentUsage.columns.trend'),
      render: (row) => (
        <ProgressBar
          value={row.trend}
          className="h-2 min-w-[6rem]"
          barClassName="bg-spice-brand-primary"
        />
      ),
    },
    {
      key: 'total_views',
      header: t('adminDashboard.documentUsage.columns.views'),
      className: 'tabular-nums',
    },
    {
      key: 'unique_users',
      header: t('adminDashboard.documentUsage.columns.users'),
      className: 'tabular-nums',
      render: (row) => row.unique_users ?? '—',
    },
  ];

  return (
    <div>
      <Table<TopDocumentTableRow>
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.document_id}
        caption={t('adminDashboard.documentUsage.topAllTitle')}
        emptyMessage={t('adminDashboard.documentUsage.emptyTitle')}
      />
      <p className="mt-3 text-xs text-spice-text-muted">
        {t('adminDashboard.documentUsage.topAllFooter')}
      </p>
    </div>
  );
};
