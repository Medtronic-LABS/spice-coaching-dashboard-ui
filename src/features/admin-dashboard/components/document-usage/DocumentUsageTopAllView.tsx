import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Table, type ColumnDef } from '@/components/common/Table';
import { TruncatedText } from '@/components/ui';
import type { DocumentUsageTopCard } from '@/features/admin-dashboard/utils/documentUsage';
import {
  DOC_TABLE_CELL,
  DOCUMENT_USAGE_TABLE_PROPS,
} from '@/features/admin-dashboard/utils/documentUsageTableLayout';

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
      colClassName: 'w-10',
      headerClassName: `w-10 tabular-nums text-spice-text-muted ${DOC_TABLE_CELL.compact}`,
      className: `w-10 tabular-nums text-spice-text-muted ${DOC_TABLE_CELL.nowrap} ${DOC_TABLE_CELL.compact}`,
    },
    {
      key: 'document_title',
      header: t('adminDashboard.documentUsage.columns.title'),
      colClassName: 'w-[11rem]',
      headerClassName: `max-w-[11rem] ${DOC_TABLE_CELL.compact}`,
      className: `max-w-[11rem] ${DOC_TABLE_CELL.truncate} ${DOC_TABLE_CELL.compact}`,
      render: (row) => (
        <TruncatedText
          text={row.document_title}
          className="min-w-0 font-medium text-spice-text-primary"
        />
      ),
    },
    {
      key: 'trend',
      header: t('adminDashboard.documentUsage.columns.trend'),
      colClassName: 'w-24',
      headerClassName: `w-24 ${DOC_TABLE_CELL.compact}`,
      className: `w-24 ${DOC_TABLE_CELL.compact}`,
      render: (row) => (
        <ProgressBar
          value={row.trend}
          className="h-2 w-full min-w-0"
          barClassName="bg-spice-brand-primary"
        />
      ),
    },
    {
      key: 'total_views',
      header: t('adminDashboard.documentUsage.columns.views'),
      colClassName: 'w-14',
      headerClassName: `w-14 text-right ${DOC_TABLE_CELL.compact}`,
      className: `w-14 text-right tabular-nums ${DOC_TABLE_CELL.nowrap} ${DOC_TABLE_CELL.compact}`,
    },
    {
      key: 'unique_users',
      header: t('adminDashboard.documentUsage.columns.users'),
      colClassName: 'w-14',
      headerClassName: `w-14 text-right ${DOC_TABLE_CELL.compact}`,
      className: `w-14 text-right tabular-nums ${DOC_TABLE_CELL.nowrap} ${DOC_TABLE_CELL.compact}`,
      render: (row) => row.unique_users ?? '—',
    },
  ];

  return (
    <div>
      <Table<TopDocumentTableRow>
        data={rows}
        columns={columns}
        {...DOCUMENT_USAGE_TABLE_PROPS}
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
