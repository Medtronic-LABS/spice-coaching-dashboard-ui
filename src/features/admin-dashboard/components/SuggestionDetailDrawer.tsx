import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Drawer } from '@/components/ui';
import { useFetchModuleCreationSuggestionDetailQuery } from '@/features/admin-dashboard/api/dashboardApi';
import { EvidenceQueryRow } from '@/features/admin-dashboard/components/EvidenceQueryRow';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import {
  enrichRowsWithUserLookup,
  useChwUserLookup,
} from '@/features/admin-dashboard/hooks/useChwUserLookup';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';
import {
  canPerformDashboardAdminActions,
  canViewDemandMetadataTimestamps,
} from '@/features/admin-dashboard/utils/dashboardRoles';
import {
  mapSuggestionEvidenceToRows,
  resolveSuggestionReasonLabel,
  sortDemandRowsByTimestamp,
} from '@/features/admin-dashboard/utils/moduleDemand';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';

interface SuggestionDetailDrawerProps {
  open: boolean;
  suggestionId: string | null;
  focusUserId?: number;
  geography: DashboardGeographyFilters;
  onClose: () => void;
  onPublish: (moduleId: string) => void;
  onCreate: (topic: string) => void;
}

export const SuggestionDetailDrawer = ({
  open,
  suggestionId,
  focusUserId,
  geography,
  onClose,
  onPublish,
  onCreate,
}: SuggestionDetailDrawerProps) => {
  const { t } = useTranslation();
  const lookup = useChwUserLookup();
  const showAdminActions = canPerformDashboardAdminActions();
  const showTimestamp = canViewDemandMetadataTimestamps();
  const hideSkName = focusUserId != null;
  const skip = !open || !suggestionId;
  const detailQuery = useFetchModuleCreationSuggestionDetailQuery(
    {
      suggestionId: suggestionId ?? '',
      geography,
    },
    { skip },
  );

  const suggestion = detailQuery.data?.suggestion;
  const canPublish =
    suggestion?.suggestion_kind === 'matched_draft' &&
    Boolean(suggestion.matched_module_id);
  const topic =
    suggestion?.proposed_topic?.trim() ||
    suggestion?.display_title?.trim() ||
    '';

  const reasonLabel = suggestion
    ? resolveSuggestionReasonLabel(suggestion, t)
    : null;

  const questionRows = useMemo(() => {
    if (!detailQuery.data || !reasonLabel) return [];
    const rows = mapSuggestionEvidenceToRows(
      detailQuery.data.questions,
      'q',
      reasonLabel,
    );
    return sortDemandRowsByTimestamp(enrichRowsWithUserLookup(rows, lookup));
  }, [detailQuery.data, lookup, reasonLabel]);

  const requestRows = useMemo(() => {
    if (!detailQuery.data || !reasonLabel) return [];
    const rows = mapSuggestionEvidenceToRows(
      detailQuery.data.requests,
      'r',
      reasonLabel,
    );
    return sortDemandRowsByTimestamp(enrichRowsWithUserLookup(rows, lookup));
  }, [detailQuery.data, lookup, reasonLabel]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      labelledBy="suggestion-demand-drawer-title"
      panelClassName="flex w-full max-w-lg flex-col"
    >
      <div className="flex items-start justify-between gap-3 border-b border-spice-border px-5 py-4">
        <div className="min-w-0">
          <h2
            id="suggestion-demand-drawer-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            {suggestion?.display_title ??
              t('adminDashboard.suggestedModules.detailFallback')}
          </h2>
          {reasonLabel ? (
            <p className="mt-1 text-xs text-spice-text-muted">
              {t('adminDashboard.suggestedModules.reasonHeading')}:{' '}
              {reasonLabel}
            </p>
          ) : null}
        </div>
        <Button
          variant="secondary"
          className="h-9 shrink-0 text-xs"
          onClick={onClose}
        >
          {t('common.close')}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {showAdminActions ? (
          <div className="mb-4 flex flex-wrap justify-end gap-2">
            {canPublish && suggestion?.matched_module_id ? (
              <Button
                className="h-9 text-xs"
                onClick={() =>
                  onPublish(suggestion.matched_module_id as string)
                }
              >
                {t('adminDashboard.moduleDemand.actions.publish')}
              </Button>
            ) : (
              <Button
                className="h-9 text-xs"
                disabled={!topic}
                onClick={() => onCreate(topic)}
              >
                {t('adminDashboard.moduleDemand.actions.create')}
              </Button>
            )}
          </div>
        ) : null}

        {detailQuery.isError ? (
          <Banner tone="critical">
            {formatRtkQueryError(detailQuery.error) ||
              t('adminDashboard.suggestedModules.loadDetailError')}
          </Banner>
        ) : null}

        {detailQuery.isLoading || lookup.isLoading ? (
          <DashboardListSkeleton rows={6} />
        ) : (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-spice-text-muted">
                {t('adminDashboard.suggestedModules.queriesHeading')}
              </h3>
              {questionRows.length === 0 ? (
                <p className="text-sm text-spice-text-muted">
                  {t('adminDashboard.suggestedModules.emptyQueries')}
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
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-spice-text-muted">
                {t('adminDashboard.suggestedModules.requestsHeading')}
              </h3>
              {requestRows.length === 0 ? (
                <p className="text-sm text-spice-text-muted">
                  {t('adminDashboard.suggestedModules.emptyRequests')}
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
            </section>
          </div>
        )}
      </div>
    </Drawer>
  );
};
