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
  mapDigitalHelpQuestionsToRows,
  matchesGeographyFilter,
} from '@/features/admin-dashboard/utils/moduleDemand';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import { getCurrentRole } from '@/constants/role';

type ModuleDemandDetailMode =
  | { kind: 'searched'; moduleId: string; title: string }
  | { kind: 'requested'; moduleId: string; title: string };

interface ModuleDemandDetailDrawerProps {
  open: boolean;
  mode: ModuleDemandDetailMode | null;
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
  onClose: () => void;
  onAssign?: (moduleId: string, title: string) => void;
}

export const ModuleDemandDetailDrawer = ({
  open,
  mode,
  fromDate,
  toDate,
  geography,
  onClose,
  onAssign,
}: ModuleDemandDetailDrawerProps) => {
  const { t } = useTranslation();
  const lookup = useChwUserLookup();
  const isAdmin = getCurrentRole() === 'programManager';
  const showTimestamp = isAdmin;
  const [page, setPage] = useState(0);
  const limit = 50;

  const searchedQuery = useFetchDigitalHelpModuleQuestionsQuery(
    {
      moduleId: mode?.kind === 'searched' ? mode.moduleId : '',
      from_date: fromDate,
      to_date: toDate,
      limit,
      offset: page * limit,
    },
    {
      skip: !open || mode?.kind !== 'searched',
    },
  );

  const requestedQuery = useFetchDigitalHelpModuleRequestsQuery(
    {
      moduleId: mode?.kind === 'requested' ? mode.moduleId : '',
      from_date: fromDate,
      to_date: toDate,
    },
    {
      skip: !open || mode?.kind !== 'requested',
    },
  );

  useEffect(() => {
    if (!open) setPage(0);
  }, [open, mode]);

  const rows = useMemo(() => {
    if (!mode) return [] as ModuleDemandQueryRow[];

    let baseRows: ModuleDemandQueryRow[] = [];
    if (mode.kind === 'searched' && searchedQuery.data) {
      baseRows = mapDigitalHelpQuestionsToRows(searchedQuery.data.questions);
    }
    if (mode.kind === 'requested' && requestedQuery.data) {
      baseRows = [
        {
          id: `requests-${mode.moduleId}`,
          primaryText: t('adminDashboard.moduleDemand.requestSummary', {
            count: requestedQuery.data.module_requested_count,
          }),
          occurrenceCount: requestedQuery.data.module_requested_count,
          timestamp: null,
          skId: null,
          skName: null,
          district: null,
          upazila: null,
          interactionType: 'assignment_requested',
          reason: null,
        },
      ];
    }

    const enriched = enrichRowsWithUserLookup(baseRows, lookup);
    return enriched.filter((row) =>
      matchesGeographyFilter(row, geography.district, geography.upazila),
    );
  }, [
    mode,
    searchedQuery.data,
    requestedQuery.data,
    lookup,
    geography.district,
    geography.upazila,
    t,
  ]);

  const searchedUi = resolveDashboardQueryUiState(searchedQuery);
  const requestedUi = resolveDashboardQueryUiState(requestedQuery);

  const showLoading =
    mode?.kind === 'searched'
      ? searchedUi.showLoading || lookup.isLoading
      : requestedUi.showLoading || lookup.isLoading;
  const showError =
    mode?.kind === 'searched' ? searchedUi.showError : requestedUi.showError;
  const refetch =
    mode?.kind === 'searched' ? searchedQuery.refetch : requestedQuery.refetch;

  const title = mode?.title ?? '';
  const titleId = 'module-demand-detail-title';

  const actionButton =
    isAdmin && mode && onAssign ? (
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
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {showLoading ? (
            <DashboardListSkeleton rows={6} />
          ) : showError ? (
            <DashboardWidgetErrorState onRetry={() => void refetch()} />
          ) : rows.length === 0 ? (
            <p className="text-sm text-spice-text-muted">
              {t('common.noData')}
            </p>
          ) : (
            rows.map((row) => (
              <EvidenceQueryRow
                key={row.id}
                row={row}
                showMetadata
                showTimestamp={showTimestamp}
              />
            ))
          )}
        </div>
        {mode?.kind === 'searched' &&
        searchedQuery.data &&
        searchedQuery.data.total_pages > 1 ? (
          <div className="flex items-center justify-between border-t border-spice-border px-5 py-3">
            <Button
              variant="secondary"
              className="h-8 text-xs"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              {t('common.previous')}
            </Button>
            <span className="text-xs text-spice-text-muted">
              {t('common.pageOf', {
                page: page + 1,
                total: searchedQuery.data.total_pages,
              })}
            </span>
            <Button
              variant="secondary"
              className="h-8 text-xs"
              disabled={page + 1 >= searchedQuery.data.total_pages}
              onClick={() => setPage((current) => current + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        ) : null}
      </div>
    </Drawer>
  );
};
