import { useTranslation } from 'react-i18next';
import { BookIcon, ClipboardIcon, KnowledgeIcon } from '@/assets/icon';
import { StatCard } from '@/components/ui';
import {
  useFetchPublishedModuleCompletionsQuery,
  useFetchTeamActivityQuery,
} from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardKpiSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';

interface DashboardKpiRowProps {
  fromDate: string;
  toDate: string;
}

export const DashboardKpiRow = ({ fromDate, toDate }: DashboardKpiRowProps) => {
  const { t } = useTranslation();
  const teamQuery = useFetchTeamActivityQuery({
    from_date: fromDate,
    to_date: toDate,
    limit: 1,
    offset: 0,
  });
  const modulesQuery = useFetchPublishedModuleCompletionsQuery({
    from_date: fromDate,
    to_date: toDate,
    limit: 1,
    offset: 0,
  });

  const teamUi = resolveDashboardQueryUiState(teamQuery);
  const modulesUi = resolveDashboardQueryUiState(modulesQuery);

  if (teamUi.showLoading) {
    return <DashboardKpiSkeleton />;
  }

  if (teamUi.showError) {
    return (
      <DashboardWidgetErrorState
        onRetry={() => {
          void teamQuery.refetch();
          void modulesQuery.refetch();
        }}
      />
    );
  }

  const summary = teamQuery.data?.summary;
  const totalUsers = summary?.total_users ?? 0;
  const fraction = (value: number) =>
    totalUsers > 0 ? `${value}/${totalUsers}` : String(value);

  const totalModulesValue = modulesUi.showLoading
    ? '…'
    : modulesUi.showError
      ? '—'
      : (modulesQuery.data?.total_modules ??
        modulesQuery.data?.modules?.length ??
        0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        icon={<ClipboardIcon className="h-4 w-4" />}
        label={t('adminDashboard.kpis.active')}
        value={fraction(summary?.active_users ?? 0)}
        valueClassName="text-spice-brand-primary"
      />
      <StatCard
        icon={<ClipboardIcon className="h-4 w-4" />}
        label={t('adminDashboard.kpis.inactive')}
        value={fraction(summary?.non_active_users ?? 0)}
        valueClassName="text-spice-semantic-warning"
      />
      <StatCard
        icon={<BookIcon className="h-4 w-4" />}
        label={t('adminDashboard.kpis.finishedModules')}
        value={fraction(summary?.users_completed_module ?? 0)}
        valueClassName="text-spice-semantic-info"
      />
      <StatCard
        icon={<KnowledgeIcon className="h-4 w-4" />}
        label={t('adminDashboard.kpis.chatbotEngaged')}
        value={fraction(summary?.users_chatbot_engaged ?? 0)}
        valueClassName="text-spice-brand-primary"
      />
      <StatCard
        icon={<BookIcon className="h-4 w-4" />}
        label={t('adminDashboard.kpis.totalModules')}
        value={totalModulesValue}
        valueClassName="text-spice-brand-primary"
      />
    </div>
  );
};
