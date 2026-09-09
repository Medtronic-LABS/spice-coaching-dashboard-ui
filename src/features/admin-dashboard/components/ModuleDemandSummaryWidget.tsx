import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { useFetchModuleDemandSummaryQuery } from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { useDashboardArgChangeLoading } from '@/features/admin-dashboard/hooks/useDashboardArgChangeLoading';
import { buildDashboardListFilterKey } from '@/features/admin-dashboard/hooks/useDashboardListPagination';
import type {
  DashboardGeographyFilters,
  ModuleDemandPatternItem,
} from '@/features/admin-dashboard/types/dashboard.types';
import { buildModuleDemandSummaryQueryArgs } from '@/features/admin-dashboard/utils/dashboardQueryArgs';
import {
  hasModuleDemandSummaryContent,
  normalizeModuleDemandSummaryResponse,
} from '@/features/admin-dashboard/utils/normalizeModuleDemandSummaryResponse';
import { TOP_MODULE_DEMAND_LIMIT } from '@/features/admin-dashboard/utils/moduleDemand';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import { cn } from '@/utils';

interface ModuleDemandSummaryWidgetProps {
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
  skip?: boolean;
}

function SummarySkeleton() {
  return (
    <div className="min-w-0 flex-1 space-y-3" aria-hidden>
      <div className="space-y-1.5">
        <div className="h-5 w-56 animate-pulse rounded bg-spice-palette-purple/10" />
        <div className="h-4 w-36 animate-pulse rounded bg-spice-palette-purple/10" />
      </div>
      <div className="h-16 w-full animate-pulse rounded bg-spice-palette-purple/10" />
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-spice-palette-purple/10" />
        <div className="h-4 w-full animate-pulse rounded bg-spice-palette-purple/10" />
        <div className="h-4 w-[92%] animate-pulse rounded bg-spice-palette-purple/10" />
      </div>
    </div>
  );
}

function DemandPatternItem({ item }: { item: ModuleDemandPatternItem }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-snug text-spice-text-primary">
      <span
        aria-hidden="true"
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-spice-brand-primary"
      />
      <span>
        <span className="font-semibold">{item.title}</span>
        {item.description ? (
          <>
            {' '}
            <span className="text-spice-text-medium">— {item.description}</span>
          </>
        ) : null}
      </span>
    </li>
  );
}

function ModuleDemandSummaryContent({
  summary,
  emptyFallback,
}: {
  summary: ReturnType<typeof normalizeModuleDemandSummaryResponse>;
  emptyFallback: string;
}) {
  const { t } = useTranslation();

  if (!hasModuleDemandSummaryContent(summary)) {
    return (
      <p className="text-sm leading-relaxed text-spice-text-primary">
        {summary.empty_message ?? emptyFallback}
      </p>
    );
  }

  return (
    <article className="space-y-3">
      <header className="space-y-0.5">
        <h3 className="text-base font-bold leading-snug text-spice-text-primary">
          {summary.title ||
            t('adminDashboard.moduleDemand.summaryInsightsTitle')}
        </h3>
        {summary.date_label ? (
          <p className="text-sm italic text-spice-text-muted">
            {summary.date_label}
          </p>
        ) : null}
      </header>

      {summary.narrative ? (
        <blockquote className="border-l-2 border-spice-border pl-3 text-sm leading-relaxed text-spice-text-primary">
          {summary.narrative}
        </blockquote>
      ) : null}

      {summary.demand_pattern.length > 0 ? (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-spice-text-primary">
            {t('adminDashboard.moduleDemand.demandPatternHeading')}
          </h4>
          <ul className="space-y-2">
            {summary.demand_pattern.map((item) => (
              <DemandPatternItem
                key={`${item.bucket}-${item.title}`}
                item={item}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

export const ModuleDemandSummaryWidget = ({
  fromDate,
  toDate,
  geography,
  skip = false,
}: ModuleDemandSummaryWidgetProps) => {
  const { t } = useTranslation();
  const query = useFetchModuleDemandSummaryQuery(
    buildModuleDemandSummaryQueryArgs(fromDate, toDate, geography, {
      top_limit: TOP_MODULE_DEMAND_LIMIT,
    }),
    { skip },
  );
  const filterKey = buildDashboardListFilterKey(fromDate, toDate, geography);
  const ui = resolveDashboardQueryUiState(query);
  const argChangeLoading = useDashboardArgChangeLoading(
    filterKey,
    query.isFetching,
  );
  const summary =
    query.currentData ?? normalizeModuleDemandSummaryResponse(undefined);
  const emptyFallback = t('adminDashboard.moduleDemand.summaryEmptyFallback', {
    fromDate,
    toDate,
  });

  return (
    <Card
      className={cn(
        'border border-spice-brand-primary/15 bg-spice-palette-purpleLt/60 p-4 shadow-none md:p-4',
      )}
    >
      <div className="flex items-start gap-3">
        {ui.showLoading || argChangeLoading ? (
          <SummarySkeleton />
        ) : ui.showError ? (
          <div className="min-w-0 flex-1">
            <DashboardWidgetErrorState
              compact
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <ModuleDemandSummaryContent
              summary={summary}
              emptyFallback={emptyFallback}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
