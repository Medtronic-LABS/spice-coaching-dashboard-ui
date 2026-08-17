import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { useFetchModuleDemandSummaryQuery } from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetRefreshButton } from '@/features/admin-dashboard/components/DashboardWidgetRefreshButton';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';
import { buildModuleDemandSummaryQueryArgs } from '@/features/admin-dashboard/utils/dashboardQueryArgs';
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
    <div className="min-w-0 flex-1 space-y-2" aria-hidden>
      <div className="h-4 w-full animate-pulse rounded bg-spice-palette-purple/10" />
      <div className="h-4 w-[94%] animate-pulse rounded bg-spice-palette-purple/10" />
      <div className="h-4 w-[72%] animate-pulse rounded bg-spice-palette-purple/10" />
    </div>
  );
}

function CollapsibleSummaryText({ text }: { text: string }) {
  const { t } = useTranslation();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  useLayoutEffect(() => {
    setExpanded(false);
  }, [text]);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const measureOverflow = () => {
      if (expanded) return;
      setCanToggle(el.scrollHeight > el.clientHeight + 1);
    };

    measureOverflow();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measureOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  const showToggle = canToggle || expanded;
  const toggleLabel = expanded
    ? t('adminDashboard.moduleDemand.seeLess')
    : t('adminDashboard.moduleDemand.seeMore');

  return (
    <div className="relative min-w-0 flex-1">
      <p
        ref={textRef}
        className={cn(
          'text-base font-semibold leading-snug text-pretty text-spice-text-primary',
          !expanded && 'line-clamp-3',
          showToggle && !expanded && 'pr-[4.75rem]',
        )}
      >
        {text}
        {showToggle && expanded ? (
          <>
            {' '}
            <button
              type="button"
              className="inline text-sm font-bold text-spice-brand-primary hover:underline"
              onClick={() => setExpanded(false)}
              aria-expanded
            >
              {toggleLabel}
            </button>
          </>
        ) : null}
      </p>
      {showToggle && !expanded ? (
        <button
          type="button"
          className={cn(
            'absolute bottom-0 right-0 bg-gradient-to-l from-spice-palette-purpleLt via-spice-palette-purpleLt to-transparent',
            'pl-6 text-sm font-bold text-spice-brand-primary hover:underline',
          )}
          onClick={() => setExpanded(true)}
          aria-expanded={false}
        >
          {toggleLabel}
        </button>
      ) : null}
    </div>
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
  const ui = resolveDashboardQueryUiState(query);
  const summary = query.data?.summary?.trim() ?? '';
  const displayText =
    summary ||
    t('adminDashboard.moduleDemand.summaryEmptyFallback', {
      fromDate,
      toDate,
    });
  const handleRefresh = () => {
    void query.refetch();
  };

  return (
    <Card
      className={cn(
        'border border-spice-brand-primary/15 bg-spice-palette-purpleLt/60 p-3 shadow-none md:p-3',
      )}
    >
      <div className="flex items-start gap-3">
        {ui.showLoading ? (
          <SummarySkeleton />
        ) : ui.showError ? (
          <div className="min-w-0 flex-1">
            <DashboardWidgetErrorState compact onRetry={handleRefresh} />
          </div>
        ) : (
          <CollapsibleSummaryText text={displayText} />
        )}
        {!ui.showError ? (
          <DashboardWidgetRefreshButton
            onRefresh={handleRefresh}
            isRefreshing={query.isFetching}
            className="h-8 w-8 border-0 bg-spice-bg-surface/80 shadow-none hover:bg-spice-bg-surface"
          />
        ) : null}
      </div>
    </Card>
  );
};
