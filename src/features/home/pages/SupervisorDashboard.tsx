import {
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { SectionStateCard } from '@/components/common/SectionStateCard';
import { FlagsCard } from '@/features/home/components/FlagsCard';
import { InsightCard } from '@/features/home/components/InsightCard';
import { KPISection } from '@/features/home/components/KPISection';
import { LeaderboardCard } from '@/features/home/components/LeaderboardCard';
import { ModuleProgressCard } from '@/features/home/components/ModuleProgressCard';
import { PerformanceMatrix } from '@/features/home/components/PerformanceMatrix';
import { useSupervisorDashboard } from '@/features/home/hooks/useSupervisorDashboard';

export const SupervisorDashboard = () => {
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
    return <LoadingState label="Loading supervisor dashboard" />;
  }

  const isAllError = isError && !hasAnyData;
  if (isAllError) {
    return (
      <ErrorState
        title="Supervisor dashboard unavailable"
        description="Please try again in a moment."
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
        title="No supervisor data yet"
        description="Once activity is available, you’ll see KPIs, flags, and progress here."
      />
    );
  }

  const summaryContent = summaryState.isError ? (
    <SectionStateCard
      title="Summary"
      state="error"
      errorDescription="We couldn’t load KPIs."
    />
  ) : summaryState.isLoading ? (
    <SectionStateCard
      title="Summary"
      state="loading"
      loadingLabel="Loading summary"
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
    <SectionStateCard title="Leaderboard" state="error" />
  ) : leaderboardState.isLoading ? (
    <SectionStateCard
      title="Leaderboard"
      state="loading"
      loadingLabel="Loading leaderboard"
    />
  ) : (
    <LeaderboardCard items={leaderboard} />
  );

  const performanceContent = performanceState.isError ? (
    <SectionStateCard title="CHW matrix" state="error" />
  ) : performanceState.isLoading ? (
    <SectionStateCard
      title="CHW matrix"
      state="loading"
      loadingLabel="Loading CHW matrix"
    />
  ) : (
    <PerformanceMatrix rows={performance} />
  );

  const flagsContent = alertsState.isError ? (
    <SectionStateCard title="Flags" state="error" />
  ) : alertsState.isLoading ? (
    <SectionStateCard
      title="Flags"
      state="loading"
      loadingLabel="Loading flags"
    />
  ) : (
    <FlagsCard
      items={alerts}
      primaryActionLabel="View all"
      onPrimaryAction={() => undefined}
    />
  );

  const modulesContent = modulesState.isError ? (
    <SectionStateCard title="Module progress" state="error" />
  ) : modulesState.isLoading ? (
    <SectionStateCard
      title="Module progress"
      state="loading"
      loadingLabel="Loading modules"
    />
  ) : (
    <ModuleProgressCard items={modules} />
  );

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Supervisor dashboard"
        subtitle="Quick overview of performance, flags, and module progress."
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
