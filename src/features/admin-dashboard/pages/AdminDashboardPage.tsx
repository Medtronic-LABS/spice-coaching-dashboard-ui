import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@/components/common/PageTitle';
import { Banner, Button } from '@/components/ui';
import { adminModuleReviewPaths, paths } from '@/constants/routes';
import { DashboardFilterBar } from '@/features/admin-dashboard/components/DashboardFilterBar';
import { DashboardKpiRow } from '@/features/admin-dashboard/components/DashboardKpiRow';
import { DocumentUsageSection } from '@/features/admin-dashboard/components/DocumentUsageSection';
import { ModuleDemandSummaryWidget } from '@/features/admin-dashboard/components/ModuleDemandSummaryWidget';
import { TeamHierarchySection } from '@/features/admin-dashboard/components/TeamHierarchySection';
import { TopSearchedModulesWidget } from '@/features/admin-dashboard/components/TopSearchedModulesWidget';
import { TopSuggestedModulesWidget } from '@/features/admin-dashboard/components/TopSuggestedModulesWidget';
import { TrainingModulesSection } from '@/features/admin-dashboard/components/TrainingModulesSection';
import { useDashboardFilters } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { ModuleAssignmentDialog } from '@/features/modules/components/AssignmentDialog';
import { buildOpenCreateModuleNavigationState } from '@/features/modules/types/moduleLibraryNavigation.types';

const DashboardPageHeader = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="relative z-40 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
    <div className="min-w-0 shrink-0">
      <PageTitle title={title} />
    </div>
    <div className="min-w-0 w-full xl:w-auto">{children}</div>
  </div>
);

export const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    filters,
    queryDateRange,
    isDateRangeValid,
    setDurationPreset,
    setCustomFrom,
    setCustomTo,
    setGeography,
    hierarchySort,
    setHierarchySort,
    clearCustomDateRange,
  } = useDashboardFilters();

  const [assignmentTarget, setAssignmentTarget] = useState<{
    moduleId: string;
    title: string;
  } | null>(null);

  const { fromDate, toDate } = queryDateRange;
  const { geography } = filters;

  const assignLabel = t('adminDashboard.moduleDemand.actions.assign');
  const publishLabel = t('adminDashboard.moduleDemand.actions.publish');
  const createLabel = t('adminDashboard.moduleDemand.actions.create');

  const handlePublish = (moduleId: string) => {
    navigate(adminModuleReviewPaths.publish(moduleId));
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
      ) : null}

      <DashboardKpiRow
        fromDate={fromDate}
        toDate={toDate}
        geography={geography}
      />

      <TeamHierarchySection
        fromDate={fromDate}
        toDate={toDate}
        geography={geography}
        sortKey={hierarchySort}
        onSortChange={setHierarchySort}
      />

      <TrainingModulesSection
        fromDate={fromDate}
        toDate={toDate}
        geography={geography}
      />

      <div className="space-y-3">
        <ModuleDemandSummaryWidget
          fromDate={fromDate}
          toDate={toDate}
          geography={geography}
        />
        <div className="grid items-stretch gap-3 xl:grid-cols-2">
          <TopSearchedModulesWidget
            fromDate={fromDate}
            toDate={toDate}
            geography={geography}
            showActions
            assignLabel={assignLabel}
            onAssign={(moduleId, title) =>
              setAssignmentTarget({ moduleId, title })
            }
          />
          <TopSuggestedModulesWidget
            fromDate={fromDate}
            toDate={toDate}
            geography={geography}
            showActions
            publishLabel={publishLabel}
            createLabel={createLabel}
            onPublish={handlePublish}
            onCreate={handleCreate}
          />
        </div>
      </div>

      <DocumentUsageSection
        fromDate={fromDate}
        toDate={toDate}
        geography={geography}
      />

      {assignmentTarget ? (
        <ModuleAssignmentDialog
          open
          moduleId={assignmentTarget.moduleId}
          moduleTitle={assignmentTarget.title}
          onClose={() => setAssignmentTarget(null)}
        />
      ) : null}
    </div>
  );
};
