import type { AdminUser, ModuleAssignment } from '../api/adminAssignmentApi';

export type UserLevelAssignmentMode = 'po_sk' | 'po' | 'sk';

export interface AssignedIndividualUser {
  kind: 'individual';
  userId: number;
  role: 'PO' | 'SK';
  name: string;
}

export interface AssignedPoSkGroup {
  kind: 'po_sk';
  poId: number;
  poName: string;
  skUsers: Array<{ userId: number; name: string }>;
}

export interface AssignedUpazilaGroup {
  kind: 'upazila';
  upazilaName: string;
  skUsers: Array<{ userId: number; name: string }>;
}

export interface AssignedGeographicalEntry {
  kind: 'geographical';
  name: string;
}

export type AssignedUserEntry =
  | AssignedIndividualUser
  | AssignedPoSkGroup
  | AssignedUpazilaGroup
  | AssignedGeographicalEntry;

export function buildAssignedUserEntries(
  mode: UserLevelAssignmentMode,
  selectedUserIds: number[],
  allUsers: AdminUser[],
): AssignedUserEntry[] {
  switch (mode) {
    case 'po_sk': {
      return selectedUserIds.flatMap((userId) => {
        const po = allUsers.find((user) => user.id === userId);
        if (!po) {
          return [];
        }

        const skUsers = allUsers
          .filter((user) => user.role === 'SK' && user.parent_id === userId)
          .map((user) => ({ userId: user.id, name: user.name }));

        return [
          {
            kind: 'po_sk',
            poId: po.id,
            poName: po.name,
            skUsers,
          } satisfies AssignedPoSkGroup,
        ];
      });
    }
    case 'po': {
      return selectedUserIds.flatMap((userId) => {
        const po = allUsers.find((user) => user.id === userId);
        if (!po) {
          return [];
        }

        return [
          {
            kind: 'individual',
            userId: po.id,
            role: 'PO',
            name: po.name,
          } satisfies AssignedIndividualUser,
        ];
      });
    }
    case 'sk': {
      return selectedUserIds.flatMap((userId) => {
        const sk = allUsers.find((user) => user.id === userId);
        if (!sk) {
          return [];
        }

        return [
          {
            kind: 'individual',
            userId: sk.id,
            role: 'SK',
            name: sk.name,
          } satisfies AssignedIndividualUser,
        ];
      });
    }
    default: {
      const exhaustiveCheck: never = mode;
      return exhaustiveCheck;
    }
  }
}

export function buildGeographicalAssignedEntries(
  upazilaNames: string[],
): AssignedGeographicalEntry[] {
  return upazilaNames.map((name) => ({
    kind: 'geographical',
    name,
  }));
}

export function countAssignedUsers(entries: AssignedUserEntry[]): number {
  return entries.reduce((total, entry) => {
    switch (entry.kind) {
      case 'po_sk':
        return total + 1 + entry.skUsers.length;
      case 'upazila':
        return total + 1 + entry.skUsers.length;
      case 'individual':
      case 'geographical':
        return total + 1;
      default: {
        const exhaustiveCheck: never = entry;
        return exhaustiveCheck;
      }
    }
  }, 0);
}

export function buildAssignedUserDisplayNames(
  mode: UserLevelAssignmentMode,
  selectedUserIds: number[],
  allUsers: AdminUser[],
): string[] {
  return buildAssignedUserEntries(mode, selectedUserIds, allUsers).flatMap(
    (entry) => {
      switch (entry.kind) {
        case 'po_sk':
          return [
            `PO - ${entry.poName}`,
            ...entry.skUsers.map((sk) => `SK - ${sk.name}`),
          ];
        case 'upazila':
          return [
            `Upazila - ${entry.upazilaName}`,
            ...entry.skUsers.map((sk) => `SK - ${sk.name}`),
          ];
        case 'individual':
          return [`${entry.role} - ${entry.name}`];
        case 'geographical':
          return [entry.name];
        default: {
          const exhaustiveCheck: never = entry;
          return exhaustiveCheck;
        }
      }
    },
  );
}

export function formatAssignmentTarget(assignment: ModuleAssignment): string {
  switch (assignment.assignment_type) {
    case 'individual': {
      if (assignment.user?.name) {
        return `${assignment.user.role} - ${assignment.user.name}`;
      }
      if (assignment.user_id !== null) {
        return `User #${assignment.user_id}`;
      }
      return 'Unknown user';
    }
    case 'po_sk': {
      if (assignment.user?.name) {
        return `PO + SKs - ${assignment.user.name}`;
      }
      if (assignment.user_id !== null) {
        return `PO + SKs - User #${assignment.user_id}`;
      }
      return 'Unknown PO';
    }
    case 'geographical': {
      if (assignment.upazila) {
        return `Upazila - ${assignment.upazila}`;
      }
      return 'Unknown upazila';
    }
    case 'group': {
      if (assignment.tenant_id !== null) {
        return `Organization #${assignment.tenant_id}`;
      }
      return 'Unknown organization';
    }
    default: {
      const exhaustiveCheck: never = assignment.assignment_type;
      return exhaustiveCheck;
    }
  }
}
