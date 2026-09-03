import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronIcon } from '@/assets/icon';
import {
  EmptyState,
  InfiniteScrollContainer,
  SearchInput,
  Select,
  StatusBadge,
  Tabs,
} from '@/components/ui';
import { useFetchTeamActivityQuery } from '@/features/admin-dashboard/api/dashboardApi';
import {
  DashboardHierarchySkeleton,
  DashboardTableSkeleton,
} from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { SkDetailDrawer } from '@/features/admin-dashboard/components/SkDetailDrawer';
import {
  buildDashboardListFilterKey,
  useAccumulatedFilterPages,
  useFilterKeyedOffset,
} from '@/features/admin-dashboard/hooks/useDashboardListPagination';
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

function teamMemberItemId(member: TeamActivityMember): string {
  return String(member.user_id);
}

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

  const modules = memberModuleStats(member);
  const atRisk = isMemberAtRisk(member);
  const canExpand = member.can_drill_down;
  const isSkRow =
    !member.can_drill_down || hierarchyRoleKind(member.role) === 'sk';

  const descendantFilterKey = buildDashboardListFilterKey(
    fromDate,
    toDate,
    geography,
    sortKey,
    member.user_id,
    expanded,
  );
  const [descendantOffset, setDescendantOffset] =
    useFilterKeyedOffset(descendantFilterKey);

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
  const descendantMembersData = descendantsQuery.currentData?.members;
  const totalDescendants = descendantsQuery.currentData?.total_members ?? 0;

  const children = useAccumulatedFilterPages({
    filterKey: descendantFilterKey,
    queryOffset: descendantOffset,
    pageItems: expanded ? descendantMembersData : undefined,
    getItemId: teamMemberItemId,
  });

  const loadedInactiveChildCount = children.filter(
    (child) => !child.is_active,
  ).length;
  const descendantSkCount = resolveMemberDescendantSkCount(
    member,
    descendantsQuery.currentData,
    children.length,
  );
  const descendantInactiveCount = resolveMemberDescendantInactiveCount(
    member,
    descendantsQuery.currentData,
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
    (descendantsQuery.currentData?.offset ?? descendantOffset) +
      TEAM_HIERARCHY_PAGE_LIMIT <
    totalDescendants;
  const isLoadingMoreDescendants =
    descendantOffset > 0 && descendantsQuery.isFetching;
  const showDescendantsLoading =
    descendantOffset === 0 &&
    (descendantsUi.showLoading ||
      (descendantsQuery.isFetching && children.length === 0));

  const handleLoadMoreDescendants = useCallback(() => {
    if (!hasMoreDescendants || descendantsQuery.isFetching) return;
    setDescendantOffset((prev) => prev + TEAM_HIERARCHY_PAGE_LIMIT);
  }, [hasMoreDescendants, descendantsQuery.isFetching, setDescendantOffset]);

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
      <div className="flex items-center gap-3 px-4 py-3">
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
                    <ChevronIcon className="h-3.5 w-3.5" expanded={expanded} />
                  </button>
                ) : (
                  <span className="invisible h-9 w-full" aria-hidden />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {expanded ? (
        <div>
          {showDescendantsLoading ? (
            <div className="px-4 py-3">
              <DashboardTableSkeleton rows={3} columns={4} />
            </div>
          ) : descendantsUi.showError && descendantOffset === 0 ? (
            <div className="px-4 py-3">
              <DashboardWidgetErrorState
                compact
                error={descendantsQuery.error}
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
              className="overflow-x-hidden"
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
  const roleTabItems = useMemo(
    () =>
      roleTabs.map((tab) => ({
        value: tab.value,
        label: t(tab.labelKey),
      })),
    [roleTabs, t],
  );
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

  const filterKey = buildDashboardListFilterKey(
    fromDate,
    toDate,
    geography,
    roleTab,
    nameQuery,
    sortKey,
  );
  const [offset, setOffset] = useFilterKeyedOffset(filterKey);

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
  const membersData = query.currentData?.members;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);
  const totalMembers = query.currentData?.total_members ?? 0;

  const members = useAccumulatedFilterPages({
    filterKey,
    queryOffset: offset,
    pageItems: membersData,
    getItemId: teamMemberItemId,
  });

  const hasMore =
    (query.currentData?.offset ?? offset) + TEAM_HIERARCHY_PAGE_LIMIT <
    totalMembers;
  const isLoadingMore = offset > 0 && isFetching;
  const showListLoading =
    offset === 0 && (showLoading || (isFetching && members.length === 0));

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isFetching) return;
    setOffset((prev) => prev + TEAM_HIERARCHY_PAGE_LIMIT);
  }, [hasMore, isFetching, setOffset]);
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

  return (
    <>
      <DashboardWidgetShell
        title={t(`adminDashboard.hierarchy.tabs.${roleTab}`)}
        description={t(`adminDashboard.hierarchy.description.${roleTab}`)}
        flush
        size="lg"
        actions={
          <>
            <Select
              options={sortOptions}
              value={sortKey}
              onChange={(value) => onSortChange(value as TeamHierarchySortKey)}
              className="w-auto min-w-[16rem]"
              triggerClassName="rounded-lg border-spice-border bg-spice-bg-tint text-sm"
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
        <div className="sticky top-0 z-10 bg-spice-bg-surface px-4 pt-3">
          <Tabs
            idBase="team-hierarchy-role"
            items={roleTabItems}
            value={roleTab}
            onChange={(value) => setRoleTab(value as HierarchyRoleTab)}
          />
        </div>

        {showListLoading ? (
          <DashboardHierarchySkeleton rows={5} />
        ) : showError && offset === 0 ? (
          <div className="px-4 py-4">
            <DashboardWidgetErrorState
              error={query.error}
              onRetry={() => void refetch()}
            />
          </div>
        ) : members.length === 0 ? (
          <div className="px-4 py-4">
            <EmptyState
              title={t('adminDashboard.hierarchy.emptyTitle')}
              description={t('adminDashboard.hierarchy.emptyDescription')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[48rem]">
              <InfiniteScrollContainer
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
                loadedCount={members.length}
                isLoadingMore={isLoadingMore}
                error={showError}
                onRetry={() => void refetch()}
                className="overflow-x-hidden"
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
            </div>
          </div>
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
