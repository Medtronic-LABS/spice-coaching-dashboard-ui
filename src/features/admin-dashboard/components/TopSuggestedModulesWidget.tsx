import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetchModuleCreationSuggestionsQuery } from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardActorViewToggle } from '@/features/admin-dashboard/components/DashboardActorViewToggle';
import {
  TopModuleDemandWidget,
  type TopModuleDemandRow,
} from '@/features/admin-dashboard/components/TopModuleDemandWidget';
import type {
  DashboardActorView,
  DashboardGeographyFilters,
  ModuleCreationSuggestionListItem,
} from '@/features/admin-dashboard/types/dashboard.types';
import { SuggestedModuleInlineEvidence } from '@/features/admin-dashboard/components/ModuleDemandInlineEvidence';
import { useDashboardArgChangeLoading } from '@/features/admin-dashboard/hooks/useDashboardArgChangeLoading';
import {
  buildModuleDemandFilterKey,
  useAccumulatedModuleDemandPages,
} from '@/features/admin-dashboard/hooks/useTopModuleDemandPagination';
import { TOP_MODULE_DEMAND_LIMIT } from '@/features/admin-dashboard/utils/moduleDemand';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';

interface TopSuggestedModulesWidgetProps {
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
  skip?: boolean;
  showActions: boolean;
  publishLabel: string;
  createLabel: string;
  onPublish: (moduleId: string) => void;
  onCreate: (topic: string) => void;
}

function mapSuggestionsToRows(
  suggestions: ModuleCreationSuggestionListItem[],
  showActions: boolean,
  publishLabel: string,
  createLabel: string,
  onPublish: (moduleId: string) => void,
  onCreate: (topic: string) => void,
): TopModuleDemandRow[] {
  return suggestions.map((suggestion) => {
    const canPublish =
      suggestion.suggestion_kind === 'matched_draft' &&
      Boolean(suggestion.matched_module_id);
    const topic =
      suggestion.proposed_topic?.trim() || suggestion.display_title.trim();

    return {
      id: suggestion.id,
      title: suggestion.display_title,
      searchCount: suggestion.evidence_count,
      actionLabel: showActions
        ? canPublish
          ? publishLabel
          : createLabel
        : undefined,
      onAction: showActions
        ? () => {
            if (canPublish && suggestion.matched_module_id) {
              onPublish(suggestion.matched_module_id);
              return;
            }
            if (topic) onCreate(topic);
          }
        : undefined,
    };
  });
}

export const TopSuggestedModulesWidget = ({
  fromDate,
  toDate,
  geography,
  skip = false,
  showActions,
  publishLabel,
  createLabel,
  onPublish,
  onCreate,
}: TopSuggestedModulesWidgetProps) => {
  const { t } = useTranslation();
  const [actorView, setActorView] = useState<DashboardActorView>('sk');
  const [offset, setOffset] = useState(0);
  const filterKey = buildModuleDemandFilterKey(
    fromDate,
    toDate,
    geography,
    actorView,
  );
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    setOffset(0);
  }

  const query = useFetchModuleCreationSuggestionsQuery(
    {
      from_date: fromDate,
      to_date: toDate,
      limit: TOP_MODULE_DEMAND_LIMIT,
      offset,
      geography,
      view: actorView,
    },
    { skip },
  );
  const ui = resolveDashboardQueryUiState(query);
  const pageData = query.currentData;
  const totalItems = pageData?.total_suggestions ?? 0;

  const accumulatedSuggestions = useAccumulatedModuleDemandPages({
    filterKey,
    fromDate,
    toDate,
    queryOffset: offset,
    pageData: pageData
      ? {
          from_date: pageData.from_date,
          to_date: pageData.to_date,
          offset: pageData.offset,
          items: pageData.suggestions,
        }
      : undefined,
    getItemId: (suggestion) => suggestion.id,
    fulfilledTimeStamp: query.fulfilledTimeStamp,
  });

  const rows = useMemo(
    () =>
      mapSuggestionsToRows(
        accumulatedSuggestions,
        showActions,
        publishLabel,
        createLabel,
        onPublish,
        onCreate,
      ),
    [
      accumulatedSuggestions,
      showActions,
      publishLabel,
      createLabel,
      onPublish,
      onCreate,
    ],
  );

  const hasMore =
    (pageData?.offset ?? offset) + TOP_MODULE_DEMAND_LIMIT < totalItems;
  const isLoadingMore = offset > 0 && query.isFetching;
  const argChangeLoading = useDashboardArgChangeLoading(
    filterKey,
    query.isFetching,
  );
  const showLoading =
    offset === 0 &&
    (ui.showLoading ||
      argChangeLoading ||
      (query.isFetching && accumulatedSuggestions.length === 0));

  const handleSeeMore = useCallback(() => {
    if (!hasMore || query.isFetching) return;
    setOffset((value) => value + TOP_MODULE_DEMAND_LIMIT);
  }, [hasMore, query.isFetching]);

  return (
    <TopModuleDemandWidget
      key={filterKey}
      title={t('adminDashboard.suggestedModules.title')}
      description={t('adminDashboard.suggestedModules.description')}
      titleColumnLabel={t('adminDashboard.suggestedModules.columns.topic')}
      rows={rows}
      showLoading={showLoading}
      showError={ui.showError}
      error={query.error}
      onRetry={() => void query.refetch()}
      showActions={showActions}
      emptyTitle={t('adminDashboard.suggestedModules.emptyTitle')}
      emptyDescription={t('adminDashboard.suggestedModules.emptyDescription')}
      hasMore={hasMore}
      onSeeMore={handleSeeMore}
      isLoadingMore={isLoadingMore}
      headerActions={
        <DashboardActorViewToggle
          value={actorView}
          onChange={setActorView}
          label={t('adminDashboard.moduleDemand.actorViewLabel')}
        />
      }
      renderExpandedContent={(rowId) => (
        <SuggestedModuleInlineEvidence
          suggestionId={rowId}
          geography={geography}
          actorView={actorView}
        />
      )}
    />
  );
};
