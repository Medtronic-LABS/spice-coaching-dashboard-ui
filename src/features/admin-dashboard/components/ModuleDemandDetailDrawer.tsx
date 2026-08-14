import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Drawer } from '@/components/ui';
import { EvidenceQueryRow } from '@/features/admin-dashboard/components/EvidenceQueryRow';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import {
  useFetchDigitalHelpModuleQuestionsQuery,
  useFetchDigitalHelpModuleRequestsQuery,
} from '@/features/admin-dashboard/api/dashboardApi';
import type {
  DashboardGeographyFilters,
  ModuleDemandQueryRow,
} from '@/features/admin-dashboard/types/dashboard.types';
import {
  enrichRowsWithUserLookup,
  useChwUserLookup,
} from '@/features/admin-dashboard/hooks/useChwUserLookup';
import {
  canPerformDashboardAdminActions,
  canViewDemandMetadataTimestamps,
} from '@/features/admin-dashboard/utils/dashboardRoles';
import {
  mapDigitalHelpQuestionsToRows,
  mapDigitalHelpRequestsToRows,
  sortDemandRowsByTimestamp,
} from '@/features/admin-dashboard/utils/moduleDemand';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';

type ModuleDemandDetailMode = {
  kind: 'searched';
  moduleId: string;
  title: string;
};

interface ModuleDemandDetailDrawerProps {
  open: boolean;
  mode: ModuleDemandDetailMode | null;
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
  focusUserId?: number;
  onClose: () => void;
  onAssign?: (moduleId: string, title: string) => void;
}

function DrillDownPagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-spice-border pt-3">
      <Button
        variant="secondary"
        className="h-8 text-xs"
        disabled={page === 0}
        onClick={onPrevious}
      >
        {t('common.previous')}
      </Button>
      <span className="text-xs text-spice-text-muted">
        {t('common.pageOf', {
          page: page + 1,
          total: totalPages,
        })}
      </span>
      <Button
        variant="secondary"
        className="h-8 text-xs"
        disabled={page + 1 >= totalPages}
        onClick={onNext}
      >
        {t('common.next')}
      </Button>
    </div>
  );
}

export const ModuleDemandDetailDrawer = ({
  open,
  mode,
  fromDate,
  toDate,
  geography,
  focusUserId,
  onClose,
  onAssign,
}: ModuleDemandDetailDrawerProps) => {
  const { t } = useTranslation();
  const lookup = useChwUserLookup();
  const showAdminActions = canPerformDashboardAdminActions();
  const showTimestamp = canViewDemandMetadataTimestamps();
  const hideSkName = focusUserId != null;
  const [questionsPage, setQuestionsPage] = useState(0);
  const [requestsPage, setRequestsPage] = useState(0);
  const limit = 50;

  const moduleId = mode?.moduleId ?? '';
  const requestFallback = t('adminDashboard.moduleDemand.requestFallback');

  const questionsQuery = useFetchDigitalHelpModuleQuestionsQuery(
    {
      moduleId,
      from_date: fromDate,
      to_date: toDate,
      limit,
      offset: questionsPage * limit,
      geography,
    },
    {
      skip: !open || !moduleId,
    },
  );

  const requestsQuery = useFetchDigitalHelpModuleRequestsQuery(
    {
      moduleId,
      from_date: fromDate,
      to_date: toDate,
      limit,
      offset: requestsPage * limit,
      geography,
    },
    {
      skip: !open || !moduleId,
    },
  );

  useEffect(() => {
    if (!open) {
      setQuestionsPage(0);
      setRequestsPage(0);
      return;
    }
    setQuestionsPage(0);
    setRequestsPage(0);
  }, [
    open,
    mode?.moduleId,
    fromDate,
    toDate,
    geography.division,
    geography.district,
    geography.upazila,
  ]);

  const questionRows = useMemo(() => {
    if (!questionsQuery.data) return [] as ModuleDemandQueryRow[];
    const rows = mapDigitalHelpQuestionsToRows(questionsQuery.data.questions);
    return sortDemandRowsByTimestamp(enrichRowsWithUserLookup(rows, lookup));
  }, [lookup, questionsQuery.data]);

  const requestRows = useMemo(() => {
    if (!requestsQuery.data) return [] as ModuleDemandQueryRow[];
    const rows = mapDigitalHelpRequestsToRows(
      requestsQuery.data.requests,
      requestFallback,
    );
    return sortDemandRowsByTimestamp(enrichRowsWithUserLookup(rows, lookup));
  }, [lookup, requestFallback, requestsQuery.data]);

  const questionsUi = resolveDashboardQueryUiState(questionsQuery);
  const requestsUi = resolveDashboardQueryUiState(requestsQuery);

  const showLoading =
    questionsUi.showLoading || requestsUi.showLoading || lookup.isLoading;
  const showError = questionsUi.showError || requestsUi.showError;
  const refetch = () => {
    void questionsQuery.refetch();
    void requestsQuery.refetch();
  };

  const title = mode?.title ?? '';
  const titleId = 'module-demand-detail-title';

  const actionButton =
    showAdminActions && mode && onAssign ? (
      <Button
        className="h-9 text-xs"
        onClick={() => onAssign(mode.moduleId, mode.title)}
      >
        {t('adminDashboard.moduleDemand.actions.assign')}
      </Button>
    ) : null;

  return (
    <Drawer open={open} labelledBy={titleId} onClose={onClose}>
      <div className="flex h-full flex-col bg-spice-bg-surface">
        <div className="border-b border-spice-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id={titleId}
                className="text-base font-semibold text-spice-text-primary"
              >
                {title}
              </h2>
              <p className="mt-1 text-xs text-spice-text-muted">
                {t('adminDashboard.moduleDemand.detailDescription')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {actionButton}
              <Button
                variant="secondary"
                className="h-9 text-xs"
                onClick={onClose}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {showLoading ? (
            <DashboardListSkeleton rows={6} />
          ) : showError ? (
            <DashboardWidgetErrorState onRetry={refetch} />
          ) : (
            <>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-spice-text-muted">
                  {t('adminDashboard.existingModules.queriesHeading')}
                </h3>
                {questionRows.length === 0 ? (
                  <p className="text-sm text-spice-text-muted">
                    {t('adminDashboard.existingModules.emptyQueries')}
                  </p>
                ) : (
                  questionRows.map((row) => (
                    <EvidenceQueryRow
                      key={row.id}
                      row={row}
                      showMetadata
                      showTimestamp={showTimestamp}
                      hideSkName={hideSkName}
                    />
                  ))
                )}
                <DrillDownPagination
                  page={questionsPage}
                  totalPages={questionsQuery.data?.total_pages ?? 1}
                  onPrevious={() =>
                    setQuestionsPage((current) => Math.max(0, current - 1))
                  }
                  onNext={() => setQuestionsPage((current) => current + 1)}
                />
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-spice-text-muted">
                  {t('adminDashboard.existingModules.requestsHeading')}
                </h3>
                {requestRows.length === 0 ? (
                  <p className="text-sm text-spice-text-muted">
                    {t('adminDashboard.existingModules.emptyRequests')}
                  </p>
                ) : (
                  requestRows.map((row) => (
                    <EvidenceQueryRow
                      key={row.id}
                      row={row}
                      showMetadata
                      showTimestamp={showTimestamp}
                      hideSkName={hideSkName}
                    />
                  ))
                )}
                <DrillDownPagination
                  page={requestsPage}
                  totalPages={requestsQuery.data?.total_pages ?? 1}
                  onPrevious={() =>
                    setRequestsPage((current) => Math.max(0, current - 1))
                  }
                  onNext={() => setRequestsPage((current) => current + 1)}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
};
