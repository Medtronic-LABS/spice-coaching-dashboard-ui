import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/common/ProgressBar';
import { EmptyState, StatCard } from '@/components/ui';
import { useFetchDocumentUsageQuery } from '@/features/admin-dashboard/api/dashboardApi';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';

interface DocumentUsageSectionProps {
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
  compact?: boolean;
}

export const DocumentUsageSection = ({
  fromDate,
  toDate,
  geography,
  compact = false,
}: DocumentUsageSectionProps) => {
  const { t } = useTranslation();
  const query = useFetchDocumentUsageQuery({
    from: fromDate,
    to: toDate,
    district: geography.district || undefined,
    upazila_id: geography.upazila || undefined,
    top_limit: compact ? 8 : 10,
    documents_limit: compact ? 8 : 20,
    documents_offset: 0,
    events_limit: 20,
    events_offset: 0,
  });
  const { data, refetch } = query;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);

  const topDocuments = useMemo(() => {
    const docs = data?.top_documents ?? [];
    const maxViews = Math.max(...docs.map((item) => item.view_count), 1);
    return docs.map((item) => ({
      id: item.document_id,
      title: item.document_title ?? item.document_id,
      views: item.view_count,
      percent: (item.view_count / maxViews) * 100,
    }));
  }, [data?.top_documents]);

  return (
    <DashboardWidgetShell
      title={t('adminDashboard.documentUsage.title')}
      description={t('adminDashboard.documentUsage.description')}
    >
      {showLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-md bg-spice-bg-tint"
                aria-hidden
              />
            ))}
          </div>
          <DashboardListSkeleton rows={compact ? 6 : 8} />
        </div>
      ) : showError ? (
        <DashboardWidgetErrorState onRetry={() => void refetch()} />
      ) : !data ? (
        <EmptyState
          title={t('adminDashboard.documentUsage.emptyTitle')}
          description={t('adminDashboard.documentUsage.emptyDescription')}
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label={t('adminDashboard.documentUsage.kpis.views')}
              value={data.total_views}
            />
            <StatCard
              label={t('adminDashboard.documentUsage.kpis.documents')}
              value={data.unique_documents}
            />
            <StatCard
              label={t('adminDashboard.documentUsage.kpis.users')}
              value={data.unique_users}
            />
          </div>
          {topDocuments.length === 0 ? (
            <EmptyState
              title={t('adminDashboard.documentUsage.emptyTitle')}
              description={t('adminDashboard.documentUsage.emptyDescription')}
            />
          ) : (
            <ul className="space-y-3">
              {topDocuments.map((doc) => (
                <li key={doc.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium text-spice-text-primary">
                      {doc.title}
                    </span>
                    <span className="shrink-0 tabular-nums text-spice-text-muted">
                      {doc.views}
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
        </>
      )}
    </DashboardWidgetShell>
  );
};
