import type {
  TeamActivityApiSortBy,
  TeamActivityApiSortDir,
  TeamActivityMember,
  TeamActivityResponse,
  TeamHierarchySortKey,
} from '@/features/admin-dashboard/types/dashboard.types';

export function resolveMemberDescendantSkCount(
  member: TeamActivityMember,
  descendants:
    | Pick<TeamActivityResponse, 'total_users' | 'summary'>
    | null
    | undefined,
  loadedChildCount: number,
): number | undefined {
  if (member.summary != null) return member.summary.total_users;
  if (descendants == null) return undefined;
  return (
    descendants.total_users ??
    descendants.summary?.total_users ??
    loadedChildCount
  );
}

export function resolveMemberDescendantInactiveCount(
  member: TeamActivityMember,
  descendants: Pick<TeamActivityResponse, 'summary'> | null | undefined,
  loadedInactiveChildCount: number,
): number | undefined {
  if (member.summary != null) return member.summary.non_active_users;
  if (descendants == null) return undefined;
  return descendants.summary?.non_active_users ?? loadedInactiveChildCount;
}

export type HierarchyRoleTab = 'am' | 'po' | 'sk';

export function isMemberAtRisk(member: TeamActivityMember): boolean {
  return member.performance_status === 'at_risk';
}

export function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export function memberModuleStats(member: TeamActivityMember): {
  completed: number;
  total: number;
} {
  const total = member.assigned_modules.length;
  const completed = member.assigned_modules.filter(
    (module) => module.completed_in_range,
  ).length;
  if (total > 0) return { completed, total };
  return {
    completed: member.has_completed_module_in_range ? 1 : 0,
    total: member.has_completed_module_in_range ? 1 : 0,
  };
}

/** Maps hierarchy sort dropdown values to GET /dashboard/team-activity params. */
export function toTeamActivitySortParams(sortKey: TeamHierarchySortKey): {
  sort_by?: TeamActivityApiSortBy;
  sort_dir?: TeamActivityApiSortDir;
} {
  switch (sortKey) {
    case 'at_risk_first':
      return { sort_by: 'performance_status', sort_dir: 'asc' };
    case 'lowest_chatbot':
      return { sort_by: 'chatbot_engagement', sort_dir: 'asc' };
    case 'lowest_completion':
      return { sort_by: 'module_completion', sort_dir: 'asc' };
    case 'name':
    case 'default':
    default:
      return { sort_by: 'name', sort_dir: 'asc' };
  }
}

export function hierarchyTabDepth(
  tab: HierarchyRoleTab,
  options?: { viewerIsAreaManager?: boolean },
): number | undefined {
  if (options?.viewerIsAreaManager) {
    if (tab === 'sk') return 1;
    return undefined;
  }
  if (tab === 'po') return 1;
  if (tab === 'sk') return 2;
  return undefined;
}

export type HierarchyChildrenActionKind = 'pos' | 'sks' | 'generic';

export function hierarchyChildrenActionKind(
  role: string,
): HierarchyChildrenActionKind {
  const normalized = role.trim().toUpperCase();
  if (normalized.includes('AREA')) return 'pos';
  if (normalized === 'PO' || normalized.includes('PROGRAM')) return 'sks';
  return 'generic';
}

export type HierarchyRoleKind = 'am' | 'po' | 'sk' | 'unknown';

export function hierarchyRoleKind(role: string): HierarchyRoleKind {
  const normalized = role.trim().toUpperCase();
  if (normalized.includes('AREA')) return 'am';
  if (normalized === 'PO' || normalized.includes('PROGRAM')) return 'po';
  if (normalized.includes('SHASTIYA') || normalized === 'SK') return 'sk';
  return 'unknown';
}
