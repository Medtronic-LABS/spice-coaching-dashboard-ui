import type { AdminUser } from '../api/adminAssignmentApi';
import { userMatchesUpazila } from './mapHierarchyUsersToAdminUsers';

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
  const selectedSet = new Set(selectedUserIds);

  switch (mode) {
    case 'po_sk': {
      return selectedUserIds.flatMap((userId) => {
        const po = allUsers.find(
          (user) => user.id === userId && user.role === 'PO',
        );
        if (!po) {
          return [];
        }

        const skUsers = allUsers
          .filter(
            (user) =>
              user.role === 'SK' &&
              user.parent_id === userId &&
              selectedSet.has(user.id),
          )
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

/** Flat PO/SK cards for the assignment success page (no mode grouping). */
export function buildFlatAssignedUserEntries(
  userIds: number[],
  allUsers: AdminUser[],
): AssignedIndividualUser[] {
  const usersById = new Map(allUsers.map((user) => [user.id, user]));
  return userIds.flatMap((userId) => {
    const user = usersById.get(userId);
    if (!user || (user.role !== 'PO' && user.role !== 'SK')) {
      return [];
    }
    return [
      {
        kind: 'individual' as const,
        userId: user.id,
        role: user.role,
        name: user.name,
      },
    ];
  });
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

/** Build summary entries from a flat assigned-users list (GET …/users). */
export function buildEntriesFromAssignedUsers(
  assignedUsers: AdminUser[],
  hierarchyUsers: AdminUser[],
): AssignedUserEntry[] {
  const assignedIds = new Set(assignedUsers.map((user) => user.id));
  const assignedPos = assignedUsers.filter((user) => user.role === 'PO');
  const assignedSk = assignedUsers.filter((user) => user.role === 'SK');

  const poSkEntries = buildAssignedUserEntries(
    'po_sk',
    assignedPos.map((user) => user.id),
    hierarchyUsers.length ? hierarchyUsers : assignedUsers,
  );

  const coveredByPo = new Set(
    poSkEntries.flatMap((entry) =>
      entry.kind === 'po_sk'
        ? [entry.poId, ...entry.skUsers.map((sk) => sk.userId)]
        : [],
    ),
  );

  const individualEntries: AssignedUserEntry[] = assignedSk
    .filter((user) => !coveredByPo.has(user.id))
    .map((user) => ({
      kind: 'individual' as const,
      userId: user.id,
      role: 'SK' as const,
      name: user.name,
    }));

  const upazilaNames = Array.from(
    new Set(
      assignedUsers.flatMap((user) =>
        user.upazilas?.length
          ? user.upazilas
          : user.upazila
            ? [user.upazila]
            : [],
      ),
    ),
  );

  const upazilaEntries: AssignedUserEntry[] = upazilaNames.flatMap(
    (upazilaName) => {
      const members = (hierarchyUsers.length ? hierarchyUsers : assignedUsers)
        .filter(
          (user) =>
            (user.role === 'PO' || user.role === 'SK') &&
            userMatchesUpazila(user, upazilaName),
        )
        .map((user) => user.id);
      if (members.length === 0) return [];
      if (!members.every((id) => assignedIds.has(id))) return [];

      const skUsers = assignedSk
        .filter((user) => userMatchesUpazila(user, upazilaName))
        .map((user) => ({ userId: user.id, name: user.name }));

      return [
        {
          kind: 'upazila' as const,
          upazilaName,
          skUsers,
        },
      ];
    },
  );

  // Prefer role grouping when both exist; avoid duplicating fully covered upazilas
  // when every member is already represented via PO+SK / individual.
  if (poSkEntries.length || individualEntries.length) {
    return [...poSkEntries, ...individualEntries];
  }

  return upazilaEntries;
}

export function formatAssignedUserLabel(user: AdminUser): string {
  if (user.role === 'PO') return `PO - ${user.name}`;
  if (user.role === 'SK') return `SK - ${user.name}`;
  return user.name;
}
