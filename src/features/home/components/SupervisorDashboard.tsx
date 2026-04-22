import {
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { SectionStateCard } from '@/components/common/SectionStateCard';
import { FlagsCard } from '@/features/home/components/FlagsCard';
import { InsightCard } from '@/features/home/components/InsightCard';
import { KPISection } from '@/features/home/components/KPISection';
import { LeaderboardCard } from '@/features/home/components/LeaderboardCard';
import { ModuleProgressCard } from '@/features/home/components/ModuleProgressCard';
import { PerformanceMatrix } from '@/features/home/components/PerformanceMatrix';
import { SUPERVISOR_DASHBOARD_CONSTANTS } from '@/features/home/constants/supervisorDashboardConstants';
import { useSupervisorDashboard } from '@/features/home/hooks/useSupervisorDashboard';

export const SupervisorDashboard = () => {
  const { t } = useTranslation();
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

  const hasAnyData =
    Boolean(summary) ||
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
    !summary &&
    leaderboard.length === 0 &&
    alerts.length === 0 &&
    performance.length === 0 &&
    modules.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        title={t(SUPERVISOR_DASHBOARD_CONSTANTS.EMPTY.TITLE)}
        description={t(SUPERVISOR_DASHBOARD_CONSTANTS.EMPTY.DESCRIPTION)}
      />
    );
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
      title={t(SUPERVISOR_DASHBOARD_CONSTANTS.SECTIONS.LEADERBOARD)}
      state="error"
    />
  ) : leaderboardState.isLoading ? (
    <SectionStateCard
      title={t(SUPERVISOR_DASHBOARD_CONSTANTS.SECTIONS.LEADERBOARD)}
      state="loading"
      loadingLabel={t(SUPERVISOR_DASHBOARD_CONSTANTS.LOADING.LEADERBOARD_LABEL)}
    />
  ) : (
    <LeaderboardCard items={leaderboard} />
  );

  const performanceContent = performanceState.isError ? (
    <SectionStateCard
      title={t(SUPERVISOR_DASHBOARD_CONSTANTS.SECTIONS.PERFORMANCE)}
      state="error"
    />
  ) : performanceState.isLoading ? (
    <SectionStateCard
      title={t(SUPERVISOR_DASHBOARD_CONSTANTS.SECTIONS.PERFORMANCE)}
      state="loading"
      loadingLabel={t(SUPERVISOR_DASHBOARD_CONSTANTS.LOADING.PERFORMANCE_LABEL)}
    />
  ) : (
    <PerformanceMatrix rows={performance} />
  );

  const flagsContent = alertsState.isError ? (
    <SectionStateCard
      title={t(SUPERVISOR_DASHBOARD_CONSTANTS.SECTIONS.FLAGS)}
      state="error"
    />
  ) : alertsState.isLoading ? (
    <SectionStateCard
      title={t(SUPERVISOR_DASHBOARD_CONSTANTS.SECTIONS.FLAGS)}
      state="loading"
      loadingLabel={t(SUPERVISOR_DASHBOARD_CONSTANTS.LOADING.FLAGS_LABEL)}
    />
  ) : (
    <FlagsCard
      items={alerts}
      primaryActionLabel={t(SUPERVISOR_DASHBOARD_CONSTANTS.ACTIONS.VIEW_ALL)}
      onPrimaryAction={() => undefined}
    />
  );

  const modulesContent = modulesState.isError ? (
    <SectionStateCard
      title={t(SUPERVISOR_DASHBOARD_CONSTANTS.SECTIONS.MODULES)}
      state="error"
    />
  ) : modulesState.isLoading ? (
    <SectionStateCard
      title={t(SUPERVISOR_DASHBOARD_CONSTANTS.SECTIONS.MODULES)}
      state="loading"
      loadingLabel={t(SUPERVISOR_DASHBOARD_CONSTANTS.LOADING.MODULES_LABEL)}
    />
  ) : (
    <ModuleProgressCard items={modules} />
  );

  return (
    <section className="space-y-6">
      <SectionHeader
        variant="h2"
        title={t(SUPERVISOR_DASHBOARD_CONSTANTS.HEADER.TITLE)}
        subtitle={t(SUPERVISOR_DASHBOARD_CONSTANTS.HEADER.SUBTITLE)}
      />

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
