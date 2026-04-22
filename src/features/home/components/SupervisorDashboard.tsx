import { ErrorState, LoadingState } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { SectionStateCard } from '@/components/common/SectionStateCard';
import { Button } from '@/components/ui';
import { DashboardEmptyState } from '@/features/home/components/DashboardEmptyState';
import { FlagsCard } from '@/features/home/components/FlagsCard';
import { InsightCard } from '@/features/home/components/InsightCard';
import { KPISection } from '@/features/home/components/KPISection';
import { LeaderboardCard } from '@/features/home/components/LeaderboardCard';
import { ModuleProgressCard } from '@/features/home/components/ModuleProgressCard';
import { PerformanceMatrix } from '@/features/home/components/PerformanceMatrix';
import { SUPERVISOR_DASHBOARD_CONSTANTS } from '@/features/home/constants/supervisorDashboardConstants';
import { useSupervisorDashboard } from '@/features/home/hooks/useSupervisorDashboard';
import { paths } from '@/constants/routes';
import { useNavigate } from 'react-router-dom';

export const SupervisorDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    summary,
    leaderboard,
    alerts,
    performance,
    modules,
    isLoading,
    isError,
    summaryState,
    leaderboardState,
    alertsState,
    performanceState,
    modulesState,
  } = useSupervisorDashboard();

  const hasSummaryData = Boolean(summary?.kpis?.length);
  const hasAnyData =
    hasSummaryData ||
    leaderboard.length > 0 ||
    alerts.length > 0 ||
    performance.length > 0 ||
    modules.length > 0;

  const isInitialLoading = isLoading && !hasAnyData;
  if (isInitialLoading) {
    return (
      <LoadingState
        label={t(SUPERVISOR_DASHBOARD_CONSTANTS.LOADING.INITIAL_LABEL)}
      />
    );
  }

  const isAllError = isError && !hasAnyData;
  if (isAllError) {
    return (
      <ErrorState
        title={t(SUPERVISOR_DASHBOARD_CONSTANTS.ERROR.ALL_TITLE)}
        description={t(SUPERVISOR_DASHBOARD_CONSTANTS.ERROR.ALL_DESCRIPTION)}
      />
    );
  }

  const isEmpty =
    !hasSummaryData &&
    leaderboard.length === 0 &&
    alerts.length === 0 &&
    performance.length === 0 &&
    modules.length === 0;

  if (isEmpty) {
    return <DashboardEmptyState />;
  }

  const summaryContent = summaryState.isError ? (
    <SectionStateCard
      title={t(SUPERVISOR_DASHBOARD_CONSTANTS.SECTIONS.SUMMARY)}
      state="error"
      errorDescription={t(
        SUPERVISOR_DASHBOARD_CONSTANTS.ERROR.SUMMARY_DESCRIPTION,
      )}
    />
  ) : summaryState.isLoading ? (
    <SectionStateCard
      title={t(SUPERVISOR_DASHBOARD_CONSTANTS.SECTIONS.SUMMARY)}
      state="loading"
      loadingLabel={t(SUPERVISOR_DASHBOARD_CONSTANTS.LOADING.SUMMARY_LABEL)}
    />
  ) : summary ? (
    <div className="space-y-6">
      <KPISection kpis={summary.kpis} />
      <InsightCard
        title={summary.insight.title}
        description={summary.insight.description}
        tone="info"
        actionLabel={summary.insight.recommended_action}
        onAction={() => undefined}
      />
    </div>
  ) : null;

  const leaderboardContent = leaderboardState.isError ? (
    <SectionStateCard
      title={t('home.dashboard.sections.topPerformance')}
      state="error"
    />
  ) : leaderboardState.isLoading ? (
    <SectionStateCard
      title={t('home.dashboard.sections.topPerformance')}
      state="loading"
      loadingLabel={t(SUPERVISOR_DASHBOARD_CONSTANTS.LOADING.LEADERBOARD_LABEL)}
    />
  ) : (
    <LeaderboardCard
      title={t('home.dashboard.sections.topPerformance')}
      items={leaderboard}
      onViewAll={() => undefined}
    />
  );

  const performanceContent = performanceState.isError ? (
    <SectionStateCard
      title={t('home.dashboard.sections.performanceMatrix')}
      state="error"
    />
  ) : performanceState.isLoading ? (
    <SectionStateCard
      title={t('home.dashboard.sections.performanceMatrix')}
      state="loading"
      loadingLabel={t(SUPERVISOR_DASHBOARD_CONSTANTS.LOADING.PERFORMANCE_LABEL)}
    />
  ) : (
    <PerformanceMatrix
      title={t('home.dashboard.sections.performanceMatrix')}
      rows={performance}
      onRowClick={(row) => {
        navigate(`${paths.chwProfiles}/${encodeURIComponent(row.chw_id)}`);
      }}
    />
  );

  const flagsContent = alertsState.isError ? (
    <SectionStateCard
      title={t('home.dashboard.sections.priorityFlags')}
      state="error"
    />
  ) : alertsState.isLoading ? (
    <SectionStateCard
      title={t('home.dashboard.sections.priorityFlags')}
      state="loading"
      loadingLabel={t(SUPERVISOR_DASHBOARD_CONSTANTS.LOADING.FLAGS_LABEL)}
    />
  ) : (
    <FlagsCard
      title={t('home.dashboard.sections.priorityFlags')}
      subtitle={t('home.dashboard.flags.subtitle', { count: alerts.length })}
      items={alerts}
      primaryActionLabel={t('home.dashboard.actions.viewAll')}
      onPrimaryAction={() => undefined}
    />
  );

  const modulesContent = modulesState.isError ? (
    <SectionStateCard
      title={t('home.dashboard.sections.moduleProgress')}
      state="error"
    />
  ) : modulesState.isLoading ? (
    <SectionStateCard
      title={t('home.dashboard.sections.moduleProgress')}
      state="loading"
      loadingLabel={t(SUPERVISOR_DASHBOARD_CONSTANTS.LOADING.MODULES_LABEL)}
    />
  ) : (
    <ModuleProgressCard
      title={t('home.dashboard.sections.moduleProgress')}
      items={modules}
      onNew={() => undefined}
    />
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          {t(SUPERVISOR_DASHBOARD_CONSTANTS.HEADER.TITLE)}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => undefined}>
            {t('home.supervisorDashboard.actions.exportReport')}
          </Button>
          <Button onClick={() => undefined}>
            {t('home.supervisorDashboard.actions.assignModule')}
          </Button>
        </div>
      </div>

      {summaryContent}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {leaderboardContent}
          {performanceContent}
        </div>

        <div className="space-y-6">
          {flagsContent}
          {modulesContent}
        </div>
      </div>
    </section>
  );
};
