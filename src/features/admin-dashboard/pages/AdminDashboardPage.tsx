import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@/components/common/PageTitle';
import { Banner, Button } from '@/components/ui';
import { getCurrentRole } from '@/constants/role';
import { DashboardFilterBar } from '@/features/admin-dashboard/components/DashboardFilterBar';
import { DashboardKpiRow } from '@/features/admin-dashboard/components/DashboardKpiRow';
import { DocumentUsageSection } from '@/features/admin-dashboard/components/DocumentUsageSection';
import { ModuleDemandDetailDrawer } from '@/features/admin-dashboard/components/ModuleDemandDetailDrawer';
import { ModulePerformanceSection } from '@/features/admin-dashboard/components/ModulePerformanceSection';
import { TeamHierarchySection } from '@/features/admin-dashboard/components/TeamHierarchySection';
import type { HierarchyFocusSelection } from '@/features/admin-dashboard/types/dashboard.types';
import {
  TopModuleDemandWidget,
  type TopModuleDemandRow,
} from '@/features/admin-dashboard/components/TopModuleDemandWidget';
import { TrainingModulesSection } from '@/features/admin-dashboard/components/TrainingModulesSection';
import { useDashboardFilters } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { useModuleDemandWidgets } from '@/features/admin-dashboard/hooks/useModuleDemandWidgets';
import type { DigitalHelpModuleUsageItem } from '@/features/admin-dashboard/types/dashboard.types';
import {
  existingModuleSearchCount,
  suggestedModuleRequestCount,
} from '@/features/admin-dashboard/utils/moduleDemand';
import { ModuleAssignmentDialog } from '@/features/modules/components/AssignmentDialog';
import { resolveDisplayText } from '@/config/deploymentLocale';

const DashboardPageHeader = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <PageTitle title={title} />
      <p className="mt-1 text-sm text-spice-text-muted">{description}</p>
    </div>
    {children}
  </div>
);

function toDemandRows(
  modules: DigitalHelpModuleUsageItem[],
  countOf: (module: DigitalHelpModuleUsageItem) => number,
  options: {
    isAdmin: boolean;
    assignLabel: string;
    onAssign: (moduleId: string, title: string) => void;
  },
): TopModuleDemandRow[] {
  return modules.map((module) => {
    const title = resolveDisplayText(module.title);
    return {
      id: module.module_id,
      title,
      searchCount: countOf(module),
      actionLabel: options.isAdmin ? options.assignLabel : undefined,
      onAction: options.isAdmin
        ? () => options.onAssign(module.module_id, title)
        : undefined,
    };
  });
}

export const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const isAdmin = getCurrentRole() === 'programManager';
  const {
    filters,
    dateRange,
    isDateRangeValid,
    setDurationPreset,
    setCustomFrom,
    setCustomTo,
    setStatus,
    setGeography,
    hierarchySort,
    setHierarchySort,
    clearCustomDateRange,
  } = useDashboardFilters();

  const [detailModule, setDetailModule] = useState<{
    kind: 'searched' | 'requested';
    moduleId: string;
    title: string;
  } | null>(null);
  const [assignmentTarget, setAssignmentTarget] = useState<{
    moduleId: string;
    title: string;
  } | null>(null);
  const [hierarchyFocus, setHierarchyFocus] =
    useState<HierarchyFocusSelection | null>(null);

  const {
    query: modulesQuery,
    ui: modulesUi,
    searchedModules,
    suggestedModules,
  } = useModuleDemandWidgets({
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    skip: !isDateRangeValid,
  });

  const assignLabel = t('adminDashboard.moduleDemand.actions.assign');
  const assignOptions = useMemo(
    () => ({
      isAdmin,
      assignLabel,
      onAssign: (moduleId: string, title: string) =>
        setAssignmentTarget({ moduleId, title }),
    }),
    [assignLabel, isAdmin],
  );

  const searchedRows = useMemo(
    () =>
      toDemandRows(searchedModules, existingModuleSearchCount, assignOptions),
    [assignOptions, searchedModules],
  );

  const suggestedRows = useMemo(
    () =>
      toDemandRows(
        suggestedModules,
        suggestedModuleRequestCount,
        assignOptions,
      ),
    [assignOptions, suggestedModules],
  );

  const filterControls = (
    <DashboardFilterBar
      filters={filters}
      onDurationChange={setDurationPreset}
      onCustomFromChange={setCustomFrom}
      onCustomToChange={setCustomTo}
      onStatusChange={setStatus}
      onGeographyChange={setGeography}
    />
  );

  return (
    <div className="space-y-4">
      <DashboardPageHeader
        title={t('adminDashboard.title')}
        description={t('adminDashboard.description')}
      >
        {filterControls}
      </DashboardPageHeader>

      {!isDateRangeValid ? (
        <Banner tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold">
                {t('adminDashboard.filters.invalidRangeTitle')}
              </p>
              <p>{t('adminDashboard.filters.invalidRangeDescription')}</p>
            </div>
            <Button variant="secondary" onClick={clearCustomDateRange}>
              {t('adminDashboard.filters.clearCustomRange')}
            </Button>
          </div>
        </Banner>
      ) : (
        <>
          <DashboardKpiRow
            fromDate={dateRange.fromDate}
            toDate={dateRange.toDate}
          />

          <TeamHierarchySection
            fromDate={dateRange.fromDate}
            toDate={dateRange.toDate}
            status={filters.status}
            sortKey={hierarchySort}
            onSortChange={setHierarchySort}
            focusUserId={hierarchyFocus?.userId ?? null}
            onFocusChange={setHierarchyFocus}
          />

          <TrainingModulesSection
            fromDate={dateRange.fromDate}
            toDate={dateRange.toDate}
          />

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-spice-text-muted">
              {t('adminDashboard.insightsTitle')}
            </h2>
            <ModulePerformanceSection
              fromDate={dateRange.fromDate}
              toDate={dateRange.toDate}
            />
            <DocumentUsageSection
              fromDate={dateRange.fromDate}
              toDate={dateRange.toDate}
              geography={filters.geography}
              userId={hierarchyFocus?.userId}
              focusUserName={hierarchyFocus?.userName}
              onClearFocus={() => setHierarchyFocus(null)}
            />
          </div>

          <div className="grid items-stretch gap-3 xl:grid-cols-2">
            <TopModuleDemandWidget
              title={t('adminDashboard.existingModules.title')}
              description={t('adminDashboard.existingModules.description')}
              rows={searchedRows}
              showLoading={modulesUi.showLoading}
              showError={modulesUi.showError}
              onRetry={() => void modulesQuery.refetch()}
              showActions={isAdmin}
              footerNote={t('adminDashboard.existingModules.footer')}
              emptyTitle={t('adminDashboard.existingModules.emptyTitle')}
              emptyDescription={t(
                'adminDashboard.existingModules.emptyDescription',
              )}
              onRowClick={(rowId) => {
                const row = searchedRows.find((item) => item.id === rowId);
                if (!row) return;
                setDetailModule({
                  kind: 'searched',
                  moduleId: rowId,
                  title: row.title,
                });
              }}
            />
            <TopModuleDemandWidget
              title={t('adminDashboard.suggestedModules.title')}
              description={t('adminDashboard.suggestedModules.description')}
              rows={suggestedRows}
              showLoading={modulesUi.showLoading}
              showError={modulesUi.showError}
              onRetry={() => void modulesQuery.refetch()}
              showActions={isAdmin}
              footerNote={t('adminDashboard.suggestedModules.footer')}
              emptyTitle={t('adminDashboard.suggestedModules.emptyTitle')}
              emptyDescription={t(
                'adminDashboard.suggestedModules.emptyDescription',
              )}
              onRowClick={(rowId) => {
                const row = suggestedRows.find((item) => item.id === rowId);
                if (!row) return;
                setDetailModule({
                  kind: 'requested',
                  moduleId: rowId,
                  title: row.title,
                });
              }}
            />
          </div>

          <ModuleDemandDetailDrawer
            open={detailModule !== null}
            mode={detailModule}
            fromDate={dateRange.fromDate}
            toDate={dateRange.toDate}
            geography={filters.geography}
            onClose={() => setDetailModule(null)}
            onAssign={(moduleId, title) =>
              setAssignmentTarget({ moduleId, title })
            }
          />

          {assignmentTarget ? (
            <ModuleAssignmentDialog
              open
              moduleId={assignmentTarget.moduleId}
              moduleTitle={assignmentTarget.title}
              onClose={() => setAssignmentTarget(null)}
            />
          ) : null}
        </>
      )}
    </div>
  );
};
