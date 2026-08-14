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
  hideSkName?: boolean;
}

export const ExistingModuleInlineEvidence = ({
  moduleId,
  fromDate,
  toDate,
  geography,
  hideSkName = false,
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
  });
  const requestsQuery = useFetchDigitalHelpModuleRequestsQuery({
    moduleId,
    from_date: fromDate,
    to_date: toDate,
    limit: INLINE_EVIDENCE_LIMIT,
    offset: 0,
    geography,
  });

  const questionRows = useMemo(() => {
    if (!questionsQuery.data) return [] as ModuleDemandQueryRow[];
    return sortDemandRowsByTimestamp(
      mapDigitalHelpQuestionsToRows(questionsQuery.data.questions),
    );
  }, [questionsQuery.data]);

  const requestRows = useMemo(() => {
    if (!requestsQuery.data) return [] as ModuleDemandQueryRow[];
    return sortDemandRowsByTimestamp(
      mapDigitalHelpRequestsToRows(
        requestsQuery.data.requests,
        requestFallback,
      ),
    );
  }, [requestFallback, requestsQuery.data]);

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
      hideSkName={hideSkName}
    />
  );
};

interface SuggestedModuleInlineEvidenceProps {
  suggestionId: string;
  geography: DashboardGeographyFilters;
  hideSkName?: boolean;
}

export const SuggestedModuleInlineEvidence = ({
  suggestionId,
  geography,
  hideSkName = false,
}: SuggestedModuleInlineEvidenceProps) => {
  const { t } = useTranslation();
  const showTimestamp = canViewDemandMetadataTimestamps();
  const detailQuery = useFetchModuleCreationSuggestionDetailQuery({
    suggestionId,
    geography,
  });

  const suggestion = detailQuery.data?.suggestion;
  const reasonLabel = suggestion
    ? resolveSuggestionReasonLabel(suggestion, t)
    : null;

  const questionRows = useMemo(() => {
    if (!detailQuery.data || !reasonLabel) return [] as ModuleDemandQueryRow[];
    return sortDemandRowsByTimestamp(
      mapSuggestionEvidenceToRows(detailQuery.data.questions, 'q', reasonLabel),
    );
  }, [detailQuery.data, reasonLabel]);

  const requestRows = useMemo(() => {
    if (!detailQuery.data || !reasonLabel) return [] as ModuleDemandQueryRow[];
    return sortDemandRowsByTimestamp(
      mapSuggestionEvidenceToRows(detailQuery.data.requests, 'r', reasonLabel),
    );
  }, [detailQuery.data, reasonLabel]);

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
      hideSkName={hideSkName}
      reasonLabel={reasonLabel}
    />
  );
};
