import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronIcon } from '@/assets/icon';
import { EmptyState, SearchInput, Select, StatusBadge } from '@/components/ui';
import { useFetchTeamActivityQuery } from '@/features/admin-dashboard/api/dashboardApi';
import {
  DashboardHierarchySkeleton,
  DashboardTableSkeleton,
} from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import type {
  DashboardStatusFilter,
  TeamActivityMember,
  TeamHierarchySortKey,
} from '@/features/admin-dashboard/types/dashboard.types';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import {
  filterMembersBySearch,
  filterTeamMembersByStatus,
  hierarchyChildrenActionKind,
  hierarchyRoleKind,
  hierarchyTabDepth,
  isMemberAtRisk,
  memberInitials,
  memberModuleStats,
  sortTeamMembers,
  type HierarchyRoleTab,
} from '@/features/admin-dashboard/utils/teamActivity';
import { cn } from '@/utils';

interface TeamHierarchySectionProps {
  fromDate: string;
  toDate: string;
  status: DashboardStatusFilter;
  sortKey: TeamHierarchySortKey;
  onSortChange: (sort: TeamHierarchySortKey) => void;
}

const ROLE_TABS: Array<{ value: HierarchyRoleTab; labelKey: string }> = [
  { value: 'am', labelKey: 'adminDashboard.hierarchy.tabs.am' },
  { value: 'po', labelKey: 'adminDashboard.hierarchy.tabs.po' },
  { value: 'sk', labelKey: 'adminDashboard.hierarchy.tabs.sk' },
];

const SORT_OPTIONS: Array<{ value: TeamHierarchySortKey }> = [
  { value: 'default' },
  { value: 'at_risk_first' },
  { value: 'lowest_completion' },
  { value: 'lowest_chatbot' },
  { value: 'most_inactive' },
  { value: 'name' },
];

function useHierarchyLabels() {
  const { t } = useTranslation();

  const roleLabel = useCallback(
    (role: string): string => {
      const kind = hierarchyRoleKind(role);
      if (kind === 'unknown') return role;
      return t(`adminDashboard.hierarchy.roleLabels.${kind}`);
    },
    [t],
  );

  const childrenActionLabel = useCallback(
    (role: string, expanded: boolean): string => {
      const kind = hierarchyChildrenActionKind(role);
      if (expanded) {
        return t(`adminDashboard.hierarchy.hideChildrenActions.${kind}`);
      }
      return t(`adminDashboard.hierarchy.viewChildrenActions.${kind}`);
    },
    [t],
  );

  return { roleLabel, childrenActionLabel };
}

function MetricCell({
  value,
  label,
  className,
}: {
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('shrink-0 text-right', className)}>
      <div className="text-sm font-semibold tabular-nums text-spice-text-primary">
        {value}{' '}
        <span className="text-xs font-normal text-spice-text-muted">
          {label}
        </span>
      </div>
    </div>
  );
}

interface HierarchyMemberRowProps {
  member: TeamActivityMember;
  fromDate: string;
  toDate: string;
  status: DashboardStatusFilter;
  sortKey: TeamHierarchySortKey;
  depth: number;
}

const HierarchyMemberRow = ({
  member,
  fromDate,
  toDate,
  status,
  sortKey,
  depth,
}: HierarchyMemberRowProps) => {
  const { t } = useTranslation();
  const { roleLabel, childrenActionLabel } = useHierarchyLabels();
  const [expanded, setExpanded] = useState(false);
  const modules = memberModuleStats(member);
  const atRisk = isMemberAtRisk(member);
  const canExpand = member.can_drill_down;

  const descendantsQuery = useFetchTeamActivityQuery(
    {
      from_date: fromDate,
      to_date: toDate,
      user_id: member.user_id,
      limit: 100,
      offset: 0,
    },
    { skip: !canExpand || !expanded },
  );
  const descendantsUi = resolveDashboardQueryUiState(descendantsQuery);

  const children = useMemo(() => {
    const base = descendantsQuery.data?.members ?? [];
    return sortTeamMembers(filterTeamMembersByStatus(base, status), sortKey);
  }, [descendantsQuery.data?.members, sortKey, status]);

  const hasDescendantData = descendantsQuery.data != null;
  const peopleValue = !canExpand
    ? '—'
    : descendantsUi.showLoading
      ? '…'
      : hasDescendantData
        ? (descendantsQuery.data?.total_users ??
          descendantsQuery.data?.summary?.total_users ??
          children.length)
        : '—';
  const inactiveValue = !canExpand
    ? '—'
    : descendantsUi.showLoading
      ? '…'
      : hasDescendantData
        ? (descendantsQuery.data?.summary?.non_active_users ??
          children.filter((child) => !child.is_active).length)
        : '—';

  const peopleLabel = t('adminDashboard.hierarchy.metrics.sksLabel');

  return (
    <div
      className={cn(
        'border-b border-spice-border/70 last:border-b-0',
        depth > 0 && 'bg-spice-bg-tint/30',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex min-w-0 flex-1 items-center gap-3"
          style={{ paddingLeft: `${depth * 24}px` }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spice-brand-primary/15 text-xs font-semibold text-spice-brand-primary">
            {memberInitials(member.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-spice-text-primary">
              {member.name}
            </div>
            <div className="truncate text-xs text-spice-text-muted">
              {roleLabel(member.role)}
            </div>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-6">
          <MetricCell
            className="w-[4.5rem]"
            value={peopleValue}
            label={peopleLabel}
          />
          <MetricCell
            className="w-[5.5rem]"
            value={inactiveValue}
            label={t('adminDashboard.hierarchy.metrics.inactiveLabel')}
          />
          <MetricCell
            className="w-[6.5rem]"
            value={`${modules.completed}/${modules.total}`}
            label={t('adminDashboard.hierarchy.metrics.modulesLabel')}
          />

          <div className="flex w-[5.75rem] justify-end">
            <StatusBadge
              status={atRisk ? 'critical' : 'success'}
              label={
                atRisk
                  ? t('adminDashboard.filters.status.at_risk')
                  : t('adminDashboard.filters.status.on_track')
              }
            />
          </div>

          <div className="flex w-[7.25rem] justify-end">
            {canExpand ? (
              <button
                type="button"
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-spice-brand-primary/40 bg-spice-bg-surface px-2 text-xs font-semibold text-spice-brand-primary transition hover:bg-spice-brand-primary/5"
                onClick={() => setExpanded((value) => !value)}
              >
                {childrenActionLabel(member.role, expanded)}
                <ChevronIcon className="h-3.5 w-3.5" expanded={expanded} />
              </button>
            ) : (
              <span className="invisible h-9 w-full" aria-hidden />
            )}
          </div>
        </div>
      </div>

      {expanded ? (
        <div>
          {descendantsUi.showLoading ? (
            <div className="px-4 py-3">
              <DashboardTableSkeleton rows={3} columns={4} />
            </div>
          ) : descendantsUi.showError ? (
            <div className="px-4 py-3">
              <DashboardWidgetErrorState
                compact
                onRetry={() => void descendantsQuery.refetch()}
              />
            </div>
          ) : children.length === 0 ? (
            <p className="px-4 py-2.5 text-xs text-spice-text-muted">
              {t('adminDashboard.hierarchy.emptyChildren')}
            </p>
          ) : (
            children.map((child) => (
              <HierarchyMemberRow
                key={child.user_id}
                member={child}
                fromDate={fromDate}
                toDate={toDate}
                status={status}
                sortKey={sortKey}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};

export const TeamHierarchySection = ({
  fromDate,
  toDate,
  status,
  sortKey,
  onSortChange,
}: TeamHierarchySectionProps) => {
  const { t } = useTranslation();
  const { roleLabel } = useHierarchyLabels();
  const [roleTab, setRoleTab] = useState<HierarchyRoleTab>('am');
  const [search, setSearch] = useState('');

  const depth = hierarchyTabDepth(roleTab);
  const query = useFetchTeamActivityQuery({
    from_date: fromDate,
    to_date: toDate,
    limit: 100,
    offset: 0,
    depth,
  });
  const { data, refetch } = query;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);

  const members = useMemo(() => {
    const base = data?.members ?? [];
    const filtered = filterMembersBySearch(
      filterTeamMembersByStatus(base, status),
      search,
      roleLabel,
    );
    return sortTeamMembers(filtered, sortKey);
  }, [data?.members, roleLabel, search, sortKey, status]);

  const sortOptions = useMemo(
    () =>
      SORT_OPTIONS.map((option) => ({
        label:
          option.value === 'default'
            ? `${t('adminDashboard.filters.sortLabel')} ${t(
                `adminDashboard.filters.sort.${option.value}`,
              )}`
            : t(`adminDashboard.filters.sort.${option.value}`),
        value: option.value,
      })),
    [t],
  );

  const searchPlaceholder =
    roleTab === 'am'
      ? t('adminDashboard.hierarchy.searchPlaceholder')
      : roleTab === 'po'
        ? t('adminDashboard.hierarchy.searchPlaceholderPo')
        : t('adminDashboard.hierarchy.searchPlaceholderSk');

  return (
    <DashboardWidgetShell
      title={t(`adminDashboard.hierarchy.tabs.${roleTab}`)}
      description={t('adminDashboard.hierarchy.description')}
      flush
      size="lg"
      actions={
        <>
          <Select
            options={sortOptions}
            value={sortKey}
            onChange={(value) => onSortChange(value as TeamHierarchySortKey)}
            className="h-10 w-auto min-w-[10rem] rounded-lg border-spice-border bg-spice-bg-surface text-sm"
          />
          <div className="w-52 shrink-0 [&>div]:min-w-0 [&>div]:sm:min-w-0">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={searchPlaceholder}
              className="h-10 rounded-lg"
            />
          </div>
        </>
      }
    >
      <div className="sticky top-0 z-10 border-b border-spice-border bg-spice-bg-surface px-4">
        <div className="flex gap-6" role="tablist">
          {ROLE_TABS.map((tab) => {
            const isActive = roleTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={cn(
                  '-mb-px border-b-2 pb-2.5 text-sm font-medium transition',
                  isActive
                    ? 'border-spice-brand-primary text-spice-brand-primary'
                    : 'border-transparent text-spice-text-muted hover:text-spice-text-primary',
                )}
                onClick={() => setRoleTab(tab.value)}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {showLoading ? (
        <DashboardHierarchySkeleton rows={5} />
      ) : showError ? (
        <div className="px-4 py-4">
          <DashboardWidgetErrorState onRetry={() => void refetch()} />
        </div>
      ) : members.length === 0 ? (
        <div className="px-4 py-4">
          <EmptyState
            title={t('adminDashboard.hierarchy.emptyTitle')}
            description={t('adminDashboard.hierarchy.emptyDescription')}
          />
        </div>
      ) : (
        <div>
          {members.map((member) => (
            <HierarchyMemberRow
              key={member.user_id}
              member={member}
              fromDate={fromDate}
              toDate={toDate}
              status={status}
              sortKey={sortKey}
              depth={0}
            />
          ))}
        </div>
      )}
    </DashboardWidgetShell>
  );
};
