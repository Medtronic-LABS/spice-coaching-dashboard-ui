import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TruncatedText } from '@/components/ui';
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
      headerClassName: 'w-14',
      className: 'w-14 tabular-nums text-spice-text-muted',
    },
    {
      key: 'document_title',
      header: t('adminDashboard.documentUsage.columns.title'),
      headerClassName: 'min-w-0',
      className: 'min-w-0',
      render: (row) => (
        <TruncatedText
          text={row.document_title}
          className="font-medium text-spice-text-primary"
        />
      ),
    },
    {
      key: 'trend',
      header: t('adminDashboard.documentUsage.columns.trend'),
      headerClassName: 'w-36',
      className: 'w-36',
      render: (row) => (
        <ProgressBar
          value={row.trend}
          className="h-2 w-full"
          barClassName="bg-spice-brand-primary"
        />
      ),
    },
    {
      key: 'total_views',
      header: t('adminDashboard.documentUsage.columns.views'),
      headerClassName: 'w-20',
      className: 'w-20 tabular-nums',
    },
    {
      key: 'unique_users',
      header: t('adminDashboard.documentUsage.columns.users'),
      headerClassName: 'w-20',
      className: 'w-20 tabular-nums',
      render: (row) => row.unique_users ?? '—',
    },
  ];

  return (
    <div>
      <Table<TopDocumentTableRow>
        data={rows}
        columns={columns}
        className="table-fixed"
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
