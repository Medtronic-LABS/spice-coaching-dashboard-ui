import { useTranslation } from 'react-i18next';
import {
  AlertCircleIcon,
  BookIcon,
  CalendarIcon,
  ChatIcon,
  UsersIcon,
} from '@/assets/icon';
import { StatCard } from '@/components/ui';
import {
  useFetchPublishedModuleCompletionsQuery,
  useFetchTeamActivityQuery,
} from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardKpiSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { buildPublishedModuleCompletionsQueryArgs } from '@/features/admin-dashboard/utils/publishedModuleCompletions';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';

interface DashboardKpiRowProps {
  fromDate: string;
  toDate: string;
}

const iconClassName = 'h-4 w-4';
const iconProps = { className: iconClassName, strokeWidth: 2 } as const;

export const DashboardKpiRow = ({ fromDate, toDate }: DashboardKpiRowProps) => {
  const { t } = useTranslation();
  const teamQuery = useFetchTeamActivityQuery({
    from_date: fromDate,
    to_date: toDate,
    // Summary is scope-wide; members are not needed for KPI cards.
    limit: 1,
    offset: 0,
  });
  const modulesQuery = useFetchPublishedModuleCompletionsQuery(
    buildPublishedModuleCompletionsQueryArgs(fromDate, toDate),
  );

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
        tone="pink"
        icon={<UsersIcon {...iconProps} />}
        label={t('adminDashboard.kpis.active')}
        value={summary?.active_users ?? 0}
        outOf={totalUsers > 0 ? totalUsers : undefined}
        tooltip={t('adminDashboard.kpis.activeTooltip')}
      />
      <StatCard
        tone="amber"
        icon={<AlertCircleIcon {...iconProps} />}
        label={t('adminDashboard.kpis.inactive')}
        value={summary?.non_active_users ?? 0}
        outOf={totalUsers > 0 ? totalUsers : undefined}
        tooltip={t('adminDashboard.kpis.inactiveTooltip')}
      />
      <StatCard
        tone="blue"
        icon={<BookIcon {...iconProps} />}
        label={t('adminDashboard.kpis.finishedModules')}
        value={summary?.users_completed_module ?? 0}
        outOf={totalUsers > 0 ? totalUsers : undefined}
        tooltip={t('adminDashboard.kpis.finishedModulesTooltip')}
      />
      <StatCard
        tone="violet"
        icon={<ChatIcon {...iconProps} />}
        label={t('adminDashboard.kpis.chatbotEngaged')}
        value={summary?.users_chatbot_engaged ?? 0}
        outOf={totalUsers > 0 ? totalUsers : undefined}
        tooltip={t('adminDashboard.kpis.chatbotEngagedTooltip')}
      />
      <StatCard
        tone="purple"
        icon={<CalendarIcon {...iconProps} />}
        label={t('adminDashboard.kpis.totalModules')}
        value={totalModulesValue}
        tooltip={t('adminDashboard.kpis.totalModulesTooltip')}
      />
    </div>
  );
};
