import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronIcon } from '@/assets/icon';
import {
  EmptyState,
  InfiniteScrollContainer,
  SearchInput,
  Select,
  StatusBadge,
} from '@/components/ui';
import { useFetchTeamActivityQuery } from '@/features/admin-dashboard/api/dashboardApi';
import {
  DashboardHierarchySkeleton,
  DashboardTableSkeleton,
} from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { SkDetailDrawer } from '@/features/admin-dashboard/components/SkDetailDrawer';
import type {
  DashboardGeographyFilters,
  TeamActivityMember,
  TeamHierarchySortKey,
} from '@/features/admin-dashboard/types/dashboard.types';
import { buildTeamActivityQueryArgs } from '@/features/admin-dashboard/utils/dashboardQueryArgs';
import { resolveModuleCompletionTone } from '@/features/admin-dashboard/utils/moduleCompletionTones';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import {
  hierarchyChildrenActionKind,
  hierarchyRoleKind,
  hierarchyTabDepth,
  isMemberAtRisk,
  memberInitials,
  memberModuleStats,
  resolveMemberDescendantInactiveCount,
  resolveMemberDescendantSkCount,
  toTeamActivitySortParams,
  type HierarchyRoleTab,
} from '@/features/admin-dashboard/utils/teamActivity';
import { getAuthSession } from '@/features/auth/services/authSession';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/utils';

interface TeamHierarchySectionProps {
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
  sortKey: TeamHierarchySortKey;
  onSortChange: (sort: TeamHierarchySortKey) => void;
}

const TEAM_HIERARCHY_PAGE_LIMIT = 20;
const TEAM_HIERARCHY_SEARCH_DEBOUNCE_MS = 300;

const ROLE_TABS: Array<{ value: HierarchyRoleTab; labelKey: string }> = [
  { value: 'am', labelKey: 'adminDashboard.hierarchy.tabs.am' },
  { value: 'po', labelKey: 'adminDashboard.hierarchy.tabs.po' },
  { value: 'sk', labelKey: 'adminDashboard.hierarchy.tabs.sk' },
];

/** True when the logged-in Spice role is an Area Manager. */
function isLoggedInAreaManager(): boolean {
  return hierarchyRoleKind(getAuthSession()?.role ?? '') === 'am';
}

function visibleHierarchyRoleTabs(): Array<{
  value: HierarchyRoleTab;
  labelKey: string;
}> {
  if (isLoggedInAreaManager()) {
    return ROLE_TABS.filter((tab) => tab.value !== 'am');
  }
  return ROLE_TABS;
}

function defaultHierarchyRoleTab(): HierarchyRoleTab {
  return isLoggedInAreaManager() ? 'po' : 'am';
}

const SORT_OPTIONS: Array<{ value: TeamHierarchySortKey }> = [
  { value: 'name' },
  { value: 'at_risk_first' },
  { value: 'lowest_completion' },
  { value: 'lowest_chatbot' },
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

function moduleCompletionTone(
  completed: number,
  total: number,
): string | undefined {
  if (total <= 0) return undefined;
  const percent = (completed / total) * 100;
  return resolveModuleCompletionTone(percent).textClassName;
}

function MetricCell({
  value,
  label,
  className,
  valueClassName,
}: {
  value: string | number;
  label: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn('shrink-0 text-right', className)}>
      <div
        className={cn(
          'text-sm font-semibold tabular-nums text-spice-text-primary',
          valueClassName,
        )}
      >
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
  geography: DashboardGeographyFilters;
  sortKey: TeamHierarchySortKey;
  depth: number;
  onSelectSk: (member: TeamActivityMember) => void;
}

const HierarchyMemberRow = ({
  member,
  fromDate,
  toDate,
  geography,
  sortKey,
  depth,
  onSelectSk,
}: HierarchyMemberRowProps) => {
  const { t } = useTranslation();
  const { roleLabel, childrenActionLabel } = useHierarchyLabels();
  const [expanded, setExpanded] = useState(false);
  const [descendantOffset, setDescendantOffset] = useState(0);
  const [accumulatedDescendants, setAccumulatedDescendants] = useState<
    TeamActivityMember[]
  >([]);

  const modules = memberModuleStats(member);
  const atRisk = isMemberAtRisk(member);
  const canExpand = member.can_drill_down;
  const isSkRow =
    !member.can_drill_down || hierarchyRoleKind(member.role) === 'sk';

  useEffect(() => {
    setDescendantOffset(0);
  }, [
    expanded,
    fromDate,
    toDate,
    geography.divisionId,
    geography.districtId,
    geography.upazilaId,
    sortKey,
  ]);

  const descendantsQuery = useFetchTeamActivityQuery(
    buildTeamActivityQueryArgs(fromDate, toDate, geography, {
      user_id: member.user_id,
      limit: TEAM_HIERARCHY_PAGE_LIMIT,
      offset: descendantOffset,
      ...toTeamActivitySortParams(sortKey),
    }),
    { skip: !canExpand || !expanded },
  );
  const descendantsUi = resolveDashboardQueryUiState(descendantsQuery);
  const descendantMembersData =
    descendantsQuery.currentData?.members ?? descendantsQuery.data?.members;
  const totalDescendants =
    descendantsQuery.currentData?.total_members ??
    descendantsQuery.data?.total_members ??
    0;

  useEffect(() => {
    if (!descendantMembersData || !expanded) return;
    setAccumulatedDescendants((prev) => {
      if (descendantOffset === 0) {
        // Prefer member object identity over user_id so date/filter refetches
        // with the same roster still replace stale activity fields.
        if (
          prev.length === descendantMembersData.length &&
          prev.every((item, idx) => item === descendantMembersData[idx])
        ) {
          return prev;
        }
        return descendantMembersData;
      }
      const existingIds = new Set(prev.map((item) => item.user_id));
      const newItems = descendantMembersData.filter(
        (item) => !existingIds.has(item.user_id),
      );
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });
  }, [descendantMembersData, descendantOffset, expanded]);

  const children = accumulatedDescendants;

  const loadedInactiveChildCount = children.filter(
    (child) => !child.is_active,
  ).length;
  const descendantSkCount = resolveMemberDescendantSkCount(
    member,
    descendantsQuery.data,
    children.length,
  );
  const descendantInactiveCount = resolveMemberDescendantInactiveCount(
    member,
    descendantsQuery.data,
    loadedInactiveChildCount,
  );
  const peopleValue = !canExpand
    ? '—'
    : descendantSkCount != null
      ? descendantSkCount
      : expanded && descendantsUi.showLoading
        ? '…'
        : '—';
  const inactiveValue = !canExpand
    ? '—'
    : descendantInactiveCount != null
      ? descendantInactiveCount
      : expanded && descendantsUi.showLoading
        ? '…'
        : '—';

  const peopleLabel = t('adminDashboard.hierarchy.metrics.sksLabel');

  const hasMoreDescendants =
    ((descendantsQuery.currentData ?? descendantsQuery.data)?.offset ??
      descendantOffset) +
      TEAM_HIERARCHY_PAGE_LIMIT <
    totalDescendants;
  const isLoadingMoreDescendants =
    descendantOffset > 0 && descendantsQuery.isFetching;

  const handleLoadMoreDescendants = useCallback(() => {
    if (!hasMoreDescendants || descendantsQuery.isFetching) return;
    setDescendantOffset((prev) => prev + TEAM_HIERARCHY_PAGE_LIMIT);
  }, [hasMoreDescendants, descendantsQuery.isFetching]);

  const personBlock = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spice-palette-purpleLt text-xs font-semibold text-spice-palette-purple">
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
    </>
  );

  return (
    <div
      className={cn(
        'border-b border-spice-border/70 last:border-b-0',
        depth > 0 && 'bg-spice-bg-tint/30',
      )}
    >
      <div className="overflow-x-auto">
        <div className="flex min-w-[48rem] items-center gap-3 px-4 py-3">
          {isSkRow ? (
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition hover:bg-spice-brand-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spice-brand-primary"
              style={{ paddingLeft: `${depth * 24}px` }}
              onClick={() => onSelectSk(member)}
              title={t('adminDashboard.hierarchy.openSkDetail')}
            >
              {personBlock}
            </button>
          ) : (
            <div
              className="flex min-w-0 flex-1 items-center gap-3"
              style={{ paddingLeft: `${depth * 24}px` }}
            >
              {personBlock}
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-6">
            {isSkRow ? (
              <>
                <MetricCell
                  className="w-[6.5rem]"
                  value={`${modules.completed}/${modules.total}`}
                  label={t('adminDashboard.hierarchy.metrics.modulesLabel')}
                  valueClassName={moduleCompletionTone(
                    modules.completed,
                    modules.total,
                  )}
                />
                <MetricCell
                  className="w-[5.5rem]"
                  value={member.chatbot_query_count}
                  label={t('adminDashboard.hierarchy.metrics.queriesLabel')}
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
              </>
            ) : (
              <>
                <MetricCell
                  className="w-[4.5rem]"
                  value={peopleValue}
                  label={peopleLabel}
                />
                <MetricCell
                  className="w-[9.5rem]"
                  value={inactiveValue}
                  label={t('adminDashboard.hierarchy.metrics.inactiveLabel')}
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
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-spice-palette-purple/40 bg-spice-bg-surface px-2 text-xs font-semibold text-spice-palette-purple transition hover:bg-spice-palette-purpleLt"
                      onClick={() => setExpanded((value) => !value)}
                    >
                      {childrenActionLabel(member.role, expanded)}
                      <ChevronIcon
                        className="h-3.5 w-3.5"
                        expanded={expanded}
                      />
                    </button>
                  ) : (
                    <span className="invisible h-9 w-full" aria-hidden />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {expanded ? (
        <div>
          {descendantsUi.showLoading && descendantOffset === 0 ? (
            <div className="px-4 py-3">
              <DashboardTableSkeleton rows={3} columns={4} />
            </div>
          ) : descendantsUi.showError && descendantOffset === 0 ? (
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
            <InfiniteScrollContainer
              hasMore={hasMoreDescendants}
              onLoadMore={handleLoadMoreDescendants}
              loadedCount={children.length}
              isLoadingMore={isLoadingMoreDescendants}
              error={descendantsUi.showError}
              onRetry={() => void descendantsQuery.refetch()}
            >
              {children.map((child) => (
                <HierarchyMemberRow
                  key={child.user_id}
                  member={child}
                  fromDate={fromDate}
                  toDate={toDate}
                  geography={geography}
                  sortKey={sortKey}
                  depth={depth + 1}
                  onSelectSk={onSelectSk}
                />
              ))}
            </InfiniteScrollContainer>
          )}
        </div>
      ) : null}
    </div>
  );
};

export const TeamHierarchySection = ({
  fromDate,
  toDate,
  geography,
  sortKey,
  onSortChange,
}: TeamHierarchySectionProps) => {
  const { t } = useTranslation();
  const roleTabs = useMemo(() => visibleHierarchyRoleTabs(), []);
  const viewerIsAreaManager = isLoggedInAreaManager();
  const [roleTab, setRoleTab] = useState<HierarchyRoleTab>(
    defaultHierarchyRoleTab,
  );
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(
    search,
    TEAM_HIERARCHY_SEARCH_DEBOUNCE_MS,
  );
  const nameQuery = debouncedSearch.trim() || undefined;
  const [selectedSk, setSelectedSk] = useState<TeamActivityMember | null>(null);
  const [offset, setOffset] = useState(0);
  const [accumulatedMembers, setAccumulatedMembers] = useState<
    TeamActivityMember[]
  >([]);

  useEffect(() => {
    setOffset(0);
  }, [
    roleTab,
    fromDate,
    toDate,
    geography.divisionId,
    geography.districtId,
    geography.upazilaId,
    nameQuery,
    sortKey,
  ]);

  const depth = hierarchyTabDepth(roleTab, { viewerIsAreaManager });
  const query = useFetchTeamActivityQuery(
    buildTeamActivityQueryArgs(fromDate, toDate, geography, {
      limit: TEAM_HIERARCHY_PAGE_LIMIT,
      offset,
      depth,
      q: nameQuery,
      ...toTeamActivitySortParams(sortKey),
    }),
  );
  const { refetch, isFetching } = query;
  const membersData = query.currentData?.members ?? query.data?.members;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);
  const totalMembers =
    query.currentData?.total_members ?? query.data?.total_members ?? 0;

  useEffect(() => {
    if (!membersData) return;
    setAccumulatedMembers((prev) => {
      if (offset === 0) {
        // Prefer member object identity over user_id so date/filter refetches
        // with the same roster still replace stale activity fields.
        if (
          prev.length === membersData.length &&
          prev.every((item, idx) => item === membersData[idx])
        ) {
          return prev;
        }
        return membersData;
      }
      const existingIds = new Set(prev.map((item) => item.user_id));
      const newItems = membersData.filter(
        (item) => !existingIds.has(item.user_id),
      );
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });
  }, [membersData, offset]);

  const members = accumulatedMembers;

  const hasMore =
    ((query.currentData ?? query.data)?.offset ?? offset) +
      TEAM_HIERARCHY_PAGE_LIMIT <
    totalMembers;
  const isLoadingMore = offset > 0 && isFetching;

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isFetching) return;
    setOffset((prev) => prev + TEAM_HIERARCHY_PAGE_LIMIT);
  }, [hasMore, isFetching]);

  const sortOptions = useMemo(
    () =>
      SORT_OPTIONS.map((option) => ({
        label: t(`adminDashboard.filters.sort.${option.value}`),
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

  const handleRefresh = useCallback(() => {
    if (offset !== 0) {
      setOffset(0);
      return;
    }
    void refetch();
  }, [offset, refetch]);

  return (
    <>
      <DashboardWidgetShell
        title={t(`adminDashboard.hierarchy.tabs.${roleTab}`)}
        description={t(`adminDashboard.hierarchy.description.${roleTab}`)}
        flush
        size="lg"
        onRefresh={handleRefresh}
        isRefreshing={isFetching && offset === 0 && members.length > 0}
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
        <div className="sticky top-0 z-10 border-b border-spice-border bg-spice-bg-surface px-4 pt-3">
          <div className="flex gap-6" role="tablist">
            {roleTabs.map((tab) => {
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
                      ? 'border-spice-palette-purple text-spice-palette-purple'
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

        {showLoading && offset === 0 ? (
          <DashboardHierarchySkeleton rows={5} />
        ) : showError && offset === 0 ? (
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
          <InfiniteScrollContainer
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            loadedCount={members.length}
            isLoadingMore={isLoadingMore}
            error={showError}
            onRetry={() => void refetch()}
          >
            {members.map((member) => (
              <HierarchyMemberRow
                key={member.user_id}
                member={member}
                fromDate={fromDate}
                toDate={toDate}
                geography={geography}
                sortKey={sortKey}
                depth={0}
                onSelectSk={setSelectedSk}
              />
            ))}
          </InfiniteScrollContainer>
        )}
      </DashboardWidgetShell>
      <SkDetailDrawer
        member={selectedSk}
        fromDate={fromDate}
        toDate={toDate}
        geography={geography}
        onClose={() => setSelectedSk(null)}
      />
    </>
  );
};
