import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useFetchDigitalHelpModuleQuestionsQuery,
  useFetchDigitalHelpModuleRequestsQuery,
  useFetchModuleCreationSuggestionDetailQuery,
} from '@/features/admin-dashboard/api/dashboardApi';
import { ModuleDemandEvidenceList } from '@/features/admin-dashboard/components/EvidenceQueryRow';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import type {
  DashboardActorView,
  DashboardGeographyFilters,
  ModuleDemandQueryRow,
} from '@/features/admin-dashboard/types/dashboard.types';
import { canViewDemandMetadataTimestamps } from '@/features/admin-dashboard/utils/dashboardRoles';
import {
  mapDigitalHelpQuestionsToRows,
  mapDigitalHelpRequestsToRows,
  mapSuggestionEvidenceToRows,
  resolveSuggestionReasonLabel,
  sortDemandRowsByTimestamp,
} from '@/features/admin-dashboard/utils/moduleDemand';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';

const INLINE_EVIDENCE_LIMIT = 50;

interface ExistingModuleInlineEvidenceProps {
  moduleId: string;
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
  actorView?: DashboardActorView;
}

export const ExistingModuleInlineEvidence = ({
  moduleId,
  fromDate,
  toDate,
  geography,
  actorView,
}: ExistingModuleInlineEvidenceProps) => {
  const { t } = useTranslation();
  const showTimestamp = canViewDemandMetadataTimestamps();
  const requestFallback = t('adminDashboard.moduleDemand.requestFallback');

  const questionsQuery = useFetchDigitalHelpModuleQuestionsQuery({
    moduleId,
    from_date: fromDate,
    to_date: toDate,
    limit: INLINE_EVIDENCE_LIMIT,
    offset: 0,
    geography,
    view: actorView,
  });
  const requestsQuery = useFetchDigitalHelpModuleRequestsQuery({
    moduleId,
    from_date: fromDate,
    to_date: toDate,
    limit: INLINE_EVIDENCE_LIMIT,
    offset: 0,
    geography,
    view: actorView,
  });

  const questionRows = useMemo(() => {
    if (!questionsQuery.currentData) return [] as ModuleDemandQueryRow[];
    return sortDemandRowsByTimestamp(
      mapDigitalHelpQuestionsToRows(questionsQuery.currentData.questions),
    );
  }, [questionsQuery.currentData]);

  const requestRows = useMemo(() => {
    if (!requestsQuery.currentData) return [] as ModuleDemandQueryRow[];
    return sortDemandRowsByTimestamp(
      mapDigitalHelpRequestsToRows(
        requestsQuery.currentData.requests,
        requestFallback,
      ),
    );
  }, [requestFallback, requestsQuery.currentData]);

  const questionsUi = resolveDashboardQueryUiState(questionsQuery);
  const requestsUi = resolveDashboardQueryUiState(requestsQuery);
  const showLoading = questionsUi.showLoading || requestsUi.showLoading;
  const showError = questionsUi.showError || requestsUi.showError;

  if (showLoading) return <DashboardListSkeleton rows={3} />;
  if (showError) {
    return (
      <DashboardWidgetErrorState
        onRetry={() => {
          void questionsQuery.refetch();
          void requestsQuery.refetch();
        }}
      />
    );
  }

  return (
    <ModuleDemandEvidenceList
      questionRows={questionRows}
      requestRows={requestRows}
      queriesHeading={t('adminDashboard.existingModules.queriesHeading')}
      requestsHeading={t('adminDashboard.existingModules.requestsHeading')}
      emptyQueries={t('adminDashboard.existingModules.emptyQueries')}
      emptyRequests={t('adminDashboard.existingModules.emptyRequests')}
      showTimestamp={showTimestamp}
    />
  );
};

interface SuggestedModuleInlineEvidenceProps {
  suggestionId: string;
  geography: DashboardGeographyFilters;
  actorView?: DashboardActorView;
}

export const SuggestedModuleInlineEvidence = ({
  suggestionId,
  geography,
  actorView,
}: SuggestedModuleInlineEvidenceProps) => {
  const { t } = useTranslation();
  const showTimestamp = canViewDemandMetadataTimestamps();
  const detailQuery = useFetchModuleCreationSuggestionDetailQuery({
    suggestionId,
    geography,
    view: actorView,
  });

  const suggestion = detailQuery.currentData?.suggestion;
  const reasonLabel = suggestion
    ? resolveSuggestionReasonLabel(suggestion, t)
    : null;

  const questionRows = useMemo(() => {
    if (!detailQuery.currentData || !reasonLabel)
      return [] as ModuleDemandQueryRow[];
    return sortDemandRowsByTimestamp(
      mapSuggestionEvidenceToRows(
        detailQuery.currentData.questions,
        'q',
        reasonLabel,
      ),
    );
  }, [detailQuery.currentData, reasonLabel]);

  const requestRows = useMemo(() => {
    if (!detailQuery.currentData || !reasonLabel)
      return [] as ModuleDemandQueryRow[];
    return sortDemandRowsByTimestamp(
      mapSuggestionEvidenceToRows(
        detailQuery.currentData.requests,
        'r',
        reasonLabel,
      ),
    );
  }, [detailQuery.currentData, reasonLabel]);

  const ui = resolveDashboardQueryUiState(detailQuery);
  if (ui.showLoading) return <DashboardListSkeleton rows={3} />;
  if (ui.showError) {
    return (
      <DashboardWidgetErrorState
        onRetry={() => {
          void detailQuery.refetch();
        }}
      />
    );
  }

  return (
    <ModuleDemandEvidenceList
      questionRows={questionRows}
      requestRows={requestRows}
      queriesHeading={t('adminDashboard.suggestedModules.queriesHeading')}
      requestsHeading={t('adminDashboard.suggestedModules.requestsHeading')}
      emptyQueries={t('adminDashboard.suggestedModules.emptyQueries')}
      emptyRequests={t('adminDashboard.suggestedModules.emptyRequests')}
      showTimestamp={showTimestamp}
      reasonLabel={reasonLabel}
    />
  );
};
