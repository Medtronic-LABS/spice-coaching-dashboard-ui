import { useTranslation } from 'react-i18next';
import {
  BookIcon,
  ChatIcon,
  LayersIcon,
  SmileIcon,
  UsersIcon,
} from '@/assets/icon';
import { StatCard } from '@/components/ui';
import {
  useFetchPublishedModuleCompletionsQuery,
  useFetchTeamActivityQuery,
} from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardKpiSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';
import {
  buildPublishedModuleCompletionsQueryArgs,
  buildTeamActivityQueryArgs,
} from '@/features/admin-dashboard/utils/dashboardQueryArgs';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';

interface DashboardKpiRowProps {
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
}

const iconClassName = 'h-4 w-4';
const iconProps = { className: iconClassName, strokeWidth: 2 } as const;

export const DashboardKpiRow = ({
  fromDate,
  toDate,
  geography,
}: DashboardKpiRowProps) => {
  const { t } = useTranslation();
  const teamQuery = useFetchTeamActivityQuery(
    buildTeamActivityQueryArgs(fromDate, toDate, geography, {
      // Summary is scope-wide; members are not needed for KPI cards.
      limit: 1,
      offset: 0,
    }),
  );
  const modulesQuery = useFetchPublishedModuleCompletionsQuery(
    buildPublishedModuleCompletionsQueryArgs(fromDate, toDate, geography),
  );

  const teamUi = resolveDashboardQueryUiState(teamQuery);
  const modulesUi = resolveDashboardQueryUiState(modulesQuery);

  if (teamUi.showLoading) {
    return <DashboardKpiSkeleton />;
  }

  if (teamUi.showError) {
    return (
      <DashboardWidgetErrorState
        error={teamQuery.error}
        onRetry={() => {
          void teamQuery.refetch();
          void modulesQuery.refetch();
        }}
      />
    );
  }

  const summary = teamQuery.currentData?.summary;
  const totalUsers = summary?.total_users ?? 0;
  const totalModulesValue = modulesUi.showLoading
    ? '…'
    : modulesUi.showError
      ? '—'
      : (modulesQuery.currentData?.total_modules ??
        modulesQuery.currentData?.modules?.length ??
        0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        tone="purple"
        icon={<UsersIcon {...iconProps} />}
        label={t('adminDashboard.kpis.active')}
        value={summary?.active_users ?? 0}
        outOf={totalUsers > 0 ? totalUsers : undefined}
        tooltip={t('adminDashboard.kpis.activeTooltip')}
      />
      <StatCard
        tone="amber"
        icon={<SmileIcon {...iconProps} />}
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
        tone="violet"
        icon={<LayersIcon {...iconProps} />}
        label={t('adminDashboard.kpis.totalModules')}
        value={totalModulesValue}
        tooltip={t('adminDashboard.kpis.totalModulesTooltip')}
      />
    </div>
  );
};
