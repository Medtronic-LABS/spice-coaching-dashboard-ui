import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@/components/common/PageTitle';
import { Banner, Button } from '@/components/ui';
import { buildPath, paths } from '@/constants/routes';
import { DashboardFilterBar } from '@/features/admin-dashboard/components/DashboardFilterBar';
import { DashboardKpiRow } from '@/features/admin-dashboard/components/DashboardKpiRow';
import { DocumentUsageSection } from '@/features/admin-dashboard/components/DocumentUsageSection';
import { TeamHierarchySection } from '@/features/admin-dashboard/components/TeamHierarchySection';
import { TopSearchedModulesWidget } from '@/features/admin-dashboard/components/TopSearchedModulesWidget';
import { TopSuggestedModulesWidget } from '@/features/admin-dashboard/components/TopSuggestedModulesWidget';
import { TrainingModulesSection } from '@/features/admin-dashboard/components/TrainingModulesSection';
import { useDashboardFilters } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { canPerformDashboardAdminActions } from '@/features/admin-dashboard/utils/dashboardRoles';
import { ModuleAssignmentDialog } from '@/features/modules/components/AssignmentDialog';
import { buildOpenCreateModuleNavigationState } from '@/features/modules/types/moduleLibraryNavigation.types';

const DashboardPageHeader = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
    <div className="min-w-0 shrink-0">
      <PageTitle title={title} className="text-2xl xl:text-[30px]" />
    </div>
    <div className="min-w-0 w-full xl:w-auto">{children}</div>
  </div>
);

export const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const showAdminActions = canPerformDashboardAdminActions();
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

  const [assignmentTarget, setAssignmentTarget] = useState<{
    moduleId: string;
    title: string;
  } | null>(null);

  const assignLabel = t('adminDashboard.moduleDemand.actions.assign');
  const publishLabel = t('adminDashboard.moduleDemand.actions.publish');
  const createLabel = t('adminDashboard.moduleDemand.actions.create');

  const handlePublish = (moduleId: string) => {
    navigate(buildPath(paths.adminModuleReviewPublish, { moduleId }));
  };

  const handleCreate = (topic: string) => {
    navigate(paths.moduleLibrary, {
      state: buildOpenCreateModuleNavigationState(topic),
    });
  };

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
      <DashboardPageHeader title={t('adminDashboard.title')}>
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
            geography={filters.geography}
          />

          <TeamHierarchySection
            fromDate={dateRange.fromDate}
            toDate={dateRange.toDate}
            geography={filters.geography}
            status={filters.status}
            sortKey={hierarchySort}
            onSortChange={setHierarchySort}
          />

          <TrainingModulesSection
            fromDate={dateRange.fromDate}
            toDate={dateRange.toDate}
            geography={filters.geography}
          />

          <div className="space-y-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-spice-text-muted">
              {t('adminDashboard.moduleDemand.sectionTitle')}
            </h2>
            <div className="grid items-stretch gap-3 xl:grid-cols-2">
              <TopSearchedModulesWidget
                fromDate={dateRange.fromDate}
                toDate={dateRange.toDate}
                geography={filters.geography}
                showActions={showAdminActions}
                assignLabel={assignLabel}
                onAssign={(moduleId, title) =>
                  setAssignmentTarget({ moduleId, title })
                }
              />
              <TopSuggestedModulesWidget
                fromDate={dateRange.fromDate}
                toDate={dateRange.toDate}
                geography={filters.geography}
                showActions={showAdminActions}
                publishLabel={publishLabel}
                createLabel={createLabel}
                onPublish={handlePublish}
                onCreate={handleCreate}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-spice-text-muted">
              {t('adminDashboard.insightsTitle')}
            </h2>
            <DocumentUsageSection
              fromDate={dateRange.fromDate}
              toDate={dateRange.toDate}
              geography={filters.geography}
            />
          </div>

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
