import type {
  DashboardStatusFilter,
  TeamActivityMember,
  TeamHierarchySortKey,
} from '@/features/admin-dashboard/types/dashboard.types';

export type HierarchyRoleTab = 'am' | 'po' | 'sk';

export function isMemberAtRisk(member: TeamActivityMember): boolean {
  return !member.is_active && !member.has_completed_module_in_range;
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

export function filterMembersBySearch(
  members: TeamActivityMember[],
  query: string,
  resolveRoleLabel: (role: string) => string,
): TeamActivityMember[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return members;
  return members.filter((member) => {
    const roleLabel = resolveRoleLabel(member.role).toLowerCase();
    return (
      member.name.toLowerCase().includes(normalized) ||
      roleLabel.includes(normalized) ||
      member.role.toLowerCase().includes(normalized)
    );
  });
}

export function hierarchyTabDepth(tab: HierarchyRoleTab): number | undefined {
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

export function filterTeamMembersByStatus(
  members: TeamActivityMember[],
  status: DashboardStatusFilter,
): TeamActivityMember[] {
  if (status === 'all') return members;
  if (status === 'at_risk') {
    return members.filter((member) => isMemberAtRisk(member));
  }
  return members.filter((member) => !isMemberAtRisk(member));
}

function moduleCompletionRate(member: TeamActivityMember): number {
  const assigned = member.assigned_modules.length;
  if (assigned === 0) return member.has_completed_module_in_range ? 1 : 0;
  const completed = member.assigned_modules.filter(
    (module) => module.completed_in_range,
  ).length;
  return completed / assigned;
}

function inactiveScore(member: TeamActivityMember): number {
  if (!member.last_active_at) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(member.last_active_at);
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  return Date.now() - parsed;
}

export function sortTeamMembers(
  members: TeamActivityMember[],
  sortKey: TeamHierarchySortKey,
): TeamActivityMember[] {
  const copy = [...members];
  switch (sortKey) {
    case 'at_risk_first':
      return copy.sort((a, b) => {
        const aRisk = isMemberAtRisk(a);
        const bRisk = isMemberAtRisk(b);
        if (aRisk !== bRisk) return aRisk ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    case 'lowest_completion':
      return copy.sort((a, b) => {
        const delta = moduleCompletionRate(a) - moduleCompletionRate(b);
        if (delta !== 0) return delta;
        return a.name.localeCompare(b.name);
      });
    case 'lowest_chatbot':
      return copy.sort((a, b) => {
        const delta = a.chatbot_query_count - b.chatbot_query_count;
        if (delta !== 0) return delta;
        return a.name.localeCompare(b.name);
      });
    case 'most_inactive':
      return copy.sort((a, b) => {
        const delta = inactiveScore(a) - inactiveScore(b);
        if (delta !== 0) return delta;
        return a.name.localeCompare(b.name);
      });
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'default':
    default:
      return copy;
  }
}

export type HierarchyRoleKind = 'am' | 'po' | 'sk' | 'unknown';

export function hierarchyRoleKind(role: string): HierarchyRoleKind {
  const normalized = role.trim().toUpperCase();
  if (normalized.includes('AREA')) return 'am';
  if (normalized === 'PO' || normalized.includes('PROGRAM')) return 'po';
  if (normalized.includes('SHASTIYA') || normalized === 'SK') return 'sk';
  return 'unknown';
}
