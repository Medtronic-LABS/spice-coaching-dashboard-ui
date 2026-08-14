import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetchModuleCreationSuggestionsQuery } from '@/features/admin-dashboard/api/dashboardApi';
import {
  TopModuleDemandWidget,
  type TopModuleDemandRow,
} from '@/features/admin-dashboard/components/TopModuleDemandWidget';
import type {
  DashboardGeographyFilters,
  ModuleCreationSuggestionListItem,
} from '@/features/admin-dashboard/types/dashboard.types';
import { SuggestedModuleInlineEvidence } from '@/features/admin-dashboard/components/ModuleDemandInlineEvidence';
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
  hideSkName?: boolean;
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
  hideSkName = false,
}: TopSuggestedModulesWidgetProps) => {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const filterKey = buildModuleDemandFilterKey(fromDate, toDate, geography);

  const query = useFetchModuleCreationSuggestionsQuery(
    {
      from_date: fromDate,
      to_date: toDate,
      limit: TOP_MODULE_DEMAND_LIMIT,
      offset,
      geography,
    },
    { skip },
  );
  const ui = resolveDashboardQueryUiState(query);
  const pageData = query.currentData;
  const totalItems =
    pageData?.total_suggestions ?? query.data?.total_suggestions ?? 0;

  useEffect(() => {
    setOffset(0);
  }, [filterKey]);

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
  const showLoading =
    offset === 0 && rows.length === 0 && (ui.showLoading || query.isFetching);

  const handleSeeMore = useCallback(() => {
    if (!hasMore || query.isFetching) return;
    setOffset((value) => value + TOP_MODULE_DEMAND_LIMIT);
  }, [hasMore, query.isFetching]);

  const handleRefresh = useCallback(() => {
    if (offset !== 0) {
      setOffset(0);
      return;
    }
    void query.refetch();
  }, [offset, query]);

  return (
    <TopModuleDemandWidget
      title={t('adminDashboard.suggestedModules.title')}
      description={t('adminDashboard.suggestedModules.description')}
      titleColumnLabel={t('adminDashboard.suggestedModules.columns.topic')}
      rows={rows}
      showLoading={showLoading}
      showError={ui.showError}
      onRetry={() => void query.refetch()}
      onRefresh={handleRefresh}
      isRefreshing={query.isFetching && offset === 0 && rows.length > 0}
      showActions={showActions}
      emptyTitle={t('adminDashboard.suggestedModules.emptyTitle')}
      emptyDescription={t('adminDashboard.suggestedModules.emptyDescription')}
      hasMore={hasMore}
      onSeeMore={handleSeeMore}
      isLoadingMore={isLoadingMore}
      renderExpandedContent={(rowId) => (
        <SuggestedModuleInlineEvidence
          suggestionId={rowId}
          geography={geography}
          hideSkName={hideSkName}
        />
      )}
    />
  );
};
