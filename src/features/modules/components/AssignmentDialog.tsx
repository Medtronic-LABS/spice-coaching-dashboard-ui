import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Loader, Modal, Select, Tabs } from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  type AdminUser,
  type AssignmentType,
  type AssignmentUser,
  getProgramOrganizers,
  getSkUsers,
  getUniqueDistricts,
  getUniqueUpazilas,
  useCreateAssignmentMutation,
  useLazyFetchAdminUsersQuery,
  useLazyFetchAssignmentsQuery,
  useRevokeAssignmentMutation,
} from '@/features/modules/api/adminAssignmentApi';
import {
  useCreateVideoAssignmentMutation,
  useLazyFetchVideoAssignmentsQuery,
  useRevokeVideoAssignmentMutation,
} from '@/features/ingest/api/adminVideoAssignmentApi';
import {
  buildAssignedUserEntries,
  buildGeographicalAssignedEntries,
  countAssignedUsers,
  type AssignedUserEntry,
} from '@/features/modules/utils/assignmentDisplay';

type AssignmentTab = 'user' | 'geographical';

type UserLevelMode = 'po_sk' | 'po' | 'sk';

/** Shared shape used by module and video assignment helpers. */
type AssignableRecord = {
  id: string;
  assignment_type: AssignmentType;
  user_id: number | null;
  user?: AssignmentUser | null;
  upazila?: string | null;
};

export type AssignmentDialogTarget =
  | { kind: 'module'; id: string; title: string }
  | { kind: 'video'; id: string; title: string };

const USER_LEVEL_MODE_OPTIONS: Array<{ label: string; value: UserLevelMode }> =
  [
    { label: 'PO and SK', value: 'po_sk' },
    { label: 'PO', value: 'po' },
    { label: 'SK', value: 'sk' },
  ];

const ASSIGNMENT_TABS: Array<{ label: string; value: AssignmentTab }> = [
  { label: 'Role Based', value: 'user' },
  { label: 'Geographical', value: 'geographical' },
];

interface ModuleAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  moduleId: string;
  moduleTitle: string;
}

interface AssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  target: AssignmentDialogTarget;
  /** Called after a successful video assignment (modules navigate instead). */
  onAssigned?: () => void;
}

interface FetchRetryButtonProps {
  label: string;
  onRetry: () => void;
  disabled?: boolean;
}

interface UserAssignmentStatus {
  label: string;
  displayLabel: string;
  matchesCurrentMode: boolean;
  isInherited?: boolean;
  isDisabledInCurrentMode: boolean;
}

function isUserSelectableForAssignment(
  status: UserAssignmentStatus | undefined,
): boolean {
  return !status?.isDisabledInCurrentMode;
}

function getAssignmentStatusClassName(status: UserAssignmentStatus): string {
  const isCrossModeConflict =
    status.isDisabledInCurrentMode &&
    !status.matchesCurrentMode &&
    !status.isInherited;

  if (isCrossModeConflict) {
    return 'text-xs font-semibold text-spice-semantic-warning';
  }

  if (status.matchesCurrentMode || status.isInherited) {
    return 'text-xs font-semibold text-spice-brand-primary';
  }

  return 'text-xs text-spice-text-muted';
}

interface UserSelectionListProps {
  title: string;
  users: AdminUser[];
  selectedUserIds: number[];
  userAssignmentStatus: Map<number, UserAssignmentStatus>;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
  onSelectAll: () => void;
  onToggleUser: (userId: number) => void;
  emptyMessage: string;
  otherAssignmentUsers: AdminUser[];
}

function FetchRetryButton({ label, onRetry, disabled }: FetchRetryButtonProps) {
  return (
    <button
      type="button"
      onClick={onRetry}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-spice-text-muted transition-colors hover:bg-spice-bg-tint hover:text-spice-text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  );
}

function UserSelectionList({
  title,
  users,
  selectedUserIds,
  userAssignmentStatus,
  isLoading,
  isError,
  isFetching,
  onRetry,
  onSelectAll,
  onToggleUser,
  emptyMessage,
}: UserSelectionListProps) {
  const selectableUsers = users.filter((user) =>
    isUserSelectableForAssignment(userAssignmentStatus.get(user.id)),
  );
  const allSelectableSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((user) => selectedUserIds.includes(user.id));

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-spice-border">
        <div className="flex items-center justify-between border-b border-spice-border bg-spice-bg-tint px-3 py-2 text-xs font-semibold text-spice-text-medium">
          <div className="flex items-center gap-1.5">
            <span>{title}</span>
            {isError ? (
              <FetchRetryButton
                label={`Retry loading ${title.toLowerCase()}`}
                onRetry={onRetry}
                disabled={isFetching}
              />
            ) : null}
          </div>
          {selectableUsers.length > 0 ? (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-spice-brand-primary hover:underline"
            >
              {allSelectableSelected ? 'Deselect all' : 'Select all'}
            </button>
          ) : null}
        </div>

        <div className="max-h-[20vh] divide-y divide-spice-border overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-spice-text-muted">
              Loading users…
            </div>
          ) : isError ? (
            <div className="p-4 text-center text-sm text-spice-text-muted">
              Failed to load users.
            </div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-sm text-spice-text-muted">
              {emptyMessage}
            </div>
          ) : (
            users.map((user) => {
              const status = userAssignmentStatus.get(user.id);
              const isDisabled = Boolean(status?.isDisabledInCurrentMode);
              const isChecked = selectedUserIds.includes(user.id);
              const locationLabel = user.upazila
                ? `${user.district} · ${user.upazila}`
                : user.district;

              return (
                <label
                  key={user.id}
                  className={`flex items-center justify-between px-3 py-2.5 ${
                    isDisabled
                      ? 'cursor-not-allowed bg-spice-bg-tint/40 opacity-70'
                      : 'cursor-pointer hover:bg-spice-bg-tint/30'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-spice-text-primary">
                      {user.name}
                    </span>
                    <span className="text-xs text-spice-text-muted">
                      {user.role} · {locationLabel}
                    </span>
                    {status ? (
                      <span className={getAssignmentStatusClassName(status)}>
                        {status.displayLabel}
                      </span>
                    ) : null}
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => onToggleUser(user.id)}
                    className="h-4 w-4 rounded border-spice-border text-spice-brand-primary focus:ring-spice-brand-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function resolveAssignmentUserRole(
  assignment: AssignableRecord,
  users: AdminUser[],
): AdminUser['role'] | null {
  if (assignment.user?.role) {
    return assignment.user.role;
  }
  return users.find((user) => user.id === assignment.user_id)?.role ?? null;
}

function getPoSkAssignedPoIds(assignments: AssignableRecord[]): number[] {
  return assignments.flatMap((assignment) =>
    assignment.assignment_type === 'po_sk' && assignment.user_id !== null
      ? [assignment.user_id]
      : [],
  );
}

function getSkIdsCoveredByPoSk(
  users: AdminUser[],
  poSkPoIds: number[],
): number[] {
  if (poSkPoIds.length === 0) {
    return [];
  }

  return users.flatMap((user) =>
    user.role === 'SK' &&
    user.parent_id !== null &&
    poSkPoIds.includes(user.parent_id)
      ? [user.id]
      : [],
  );
}

function getRevocableAssignmentIdsForUsers(
  assignments: AssignableRecord[],
  userIds: number[],
  mode: UserLevelMode,
  users: AdminUser[],
): string[] {
  const userIdSet = new Set(userIds);

  return assignments.flatMap((assignment) => {
    if (assignment.user_id === null || !userIdSet.has(assignment.user_id)) {
      return [];
    }

    const role = resolveAssignmentUserRole(assignment, users);

    switch (mode) {
      case 'po_sk':
        return assignment.assignment_type === 'po_sk' ? [assignment.id] : [];
      case 'po':
        return assignment.assignment_type === 'individual' && role === 'PO'
          ? [assignment.id]
          : [];
      case 'sk':
        return assignment.assignment_type === 'individual' && role === 'SK'
          ? [assignment.id]
          : [];
      default: {
        const exhaustiveCheck: never = mode;
        return exhaustiveCheck;
      }
    }
  });
}

function getRevocableGeographicalAssignmentIds(
  assignments: AssignableRecord[],
  upazilas: string[],
): string[] {
  const upazilaSet = new Set(upazilas);

  return assignments.flatMap((assignment) =>
    assignment.assignment_type === 'geographical' &&
    assignment.upazila &&
    upazilaSet.has(assignment.upazila)
      ? [assignment.id]
      : [],
  );
}

function getAssignedUserIdsForMode(
  assignments: AssignableRecord[],
  mode: UserLevelMode,
  users: AdminUser[],
): number[] {
  if (mode === 'sk') {
    const directSkIds = assignments.flatMap((assignment) => {
      if (assignment.user_id === null) {
        return [];
      }

      const role = resolveAssignmentUserRole(assignment, users);
      return assignment.assignment_type === 'individual' && role === 'SK'
        ? [assignment.user_id]
        : [];
    });
    const inheritedSkIds = getSkIdsCoveredByPoSk(
      users,
      getPoSkAssignedPoIds(assignments),
    );

    return Array.from(new Set([...directSkIds, ...inheritedSkIds]));
  }

  return assignments.flatMap((assignment) => {
    if (assignment.user_id === null) {
      return [];
    }

    const role = resolveAssignmentUserRole(assignment, users);

    switch (mode) {
      case 'po_sk':
        return assignment.assignment_type === 'po_sk'
          ? [assignment.user_id]
          : [];
      case 'po':
        return assignment.assignment_type === 'individual' && role === 'PO'
          ? [assignment.user_id]
          : [];
      default: {
        const exhaustiveCheck: never = mode;
        return exhaustiveCheck;
      }
    }
  });
}

interface UserExistingAssignment {
  label: string;
  preselectInMode: (mode: UserLevelMode) => boolean;
  disableInMode: (mode: UserLevelMode) => boolean;
  isInherited?: boolean;
}

function getAssignmentDisplayLabel(
  entry: UserExistingAssignment,
  mode: UserLevelMode,
): string {
  if (entry.label === 'PO (Individual)' && mode === 'po_sk') {
    return 'Already assigned as PO (Individual)';
  }
  return `Assigned as ${entry.label}`;
}

function buildUserAssignmentStatusMap(
  assignments: AssignableRecord[],
  users: AdminUser[],
): Map<number, UserExistingAssignment> {
  const map = new Map<number, UserExistingAssignment>();

  const geographicalUpazilas = assignments.flatMap((assignment) =>
    assignment.assignment_type === 'geographical' && assignment.upazila
      ? [assignment.upazila]
      : [],
  );

  for (const user of users) {
    if (user.upazila && geographicalUpazilas.includes(user.upazila)) {
      map.set(user.id, {
        label: `Geographical (Upazila — ${user.upazila})`,
        preselectInMode: () => false,
        disableInMode: () => true,
      });
    }
  }

  for (const assignment of assignments) {
    if (assignment.user_id === null) {
      continue;
    }

    if (assignment.assignment_type === 'po_sk') {
      map.set(assignment.user_id, {
        label: 'PO and SK',
        preselectInMode: (mode) => mode === 'po_sk',
        disableInMode: (mode) => mode === 'po',
      });
      continue;
    }

    if (assignment.assignment_type === 'individual') {
      const role = resolveAssignmentUserRole(assignment, users);
      if (role === 'PO') {
        map.set(assignment.user_id, {
          label: 'PO (Individual)',
          preselectInMode: (mode) => mode === 'po',
          disableInMode: (mode) => mode !== 'po' && mode !== 'po_sk',
        });
      } else if (role === 'SK') {
        map.set(assignment.user_id, {
          label: 'SK (Individual)',
          preselectInMode: (mode) => mode === 'sk',
          disableInMode: (mode) => mode !== 'sk',
        });
      }
    }
  }

  const poSkPoIds = getPoSkAssignedPoIds(assignments);
  for (const user of users) {
    if (user.role !== 'SK' || user.parent_id === null) {
      continue;
    }
    if (!poSkPoIds.includes(user.parent_id) || map.has(user.id)) {
      continue;
    }

    const parentPo = users.find((candidate) => candidate.id === user.parent_id);
    const parentName = parentPo?.name ?? `PO #${user.parent_id}`;
    map.set(user.id, {
      label: `PO and SK (via ${parentName})`,
      preselectInMode: (mode) => mode === 'sk',
      disableInMode: (mode) => mode === 'sk',
      isInherited: true,
    });
  }

  return map;
}

function toUserAssignmentStatus(
  map: Map<number, UserExistingAssignment>,
  mode: UserLevelMode,
): Map<number, UserAssignmentStatus> {
  const result = new Map<number, UserAssignmentStatus>();
  for (const [userId, entry] of map) {
    const matchesCurrentMode = entry.preselectInMode(mode);
    result.set(userId, {
      label: entry.label,
      displayLabel: getAssignmentDisplayLabel(entry, mode),
      matchesCurrentMode,
      isInherited: entry.isInherited,
      isDisabledInCurrentMode:
        entry.disableInMode(mode) || Boolean(entry.isInherited),
    });
  }
  return result;
}

function getUserLevelAssignmentType(mode: UserLevelMode): AssignmentType {
  return mode === 'po_sk' ? 'po_sk' : 'individual';
}

function filterUsersByLocation(
  users: AdminUser[],
  district: string,
  upazila: string,
): AdminUser[] {
  return users.filter((user) => {
    if (district && user.district !== district) {
      return false;
    }
    if (upazila && user.upazila !== upazila) {
      return false;
    }
    return true;
  });
}

function getUsersForLevelMode(
  mode: UserLevelMode,
  allUsers: AdminUser[],
): AdminUser[] {
  switch (mode) {
    case 'po_sk':
    case 'po':
      return getProgramOrganizers(allUsers);
    case 'sk':
      return getSkUsers(allUsers);
    default: {
      const exhaustiveCheck: never = mode;
      return exhaustiveCheck;
    }
  }
}

function getSelectableUserIdsForMode(
  mode: UserLevelMode,
  users: AdminUser[],
  assignments: AssignableRecord[],
): number[] {
  const roleUsers = getUsersForLevelMode(mode, users);
  const statusMap = toUserAssignmentStatus(
    buildUserAssignmentStatusMap(assignments, users),
    mode,
  );

  return roleUsers
    .filter((user) => isUserSelectableForAssignment(statusMap.get(user.id)))
    .map((user) => user.id);
}

function entityNoun(kind: AssignmentDialogTarget['kind']): string {
  return kind === 'module' ? 'module' : 'video';
}

function getUserLevelHint(
  mode: UserLevelMode,
  kind: AssignmentDialogTarget['kind'],
): string {
  const noun = entityNoun(kind);
  switch (mode) {
    case 'po_sk':
      return `Assign this ${noun} to the selected PO and all SKs under them.`;
    case 'po':
      return `Assign this ${noun} to the selected PO only. No cascading assignment is applied.`;
    case 'sk':
      return `Assign this ${noun} to the selected SK only. All SKs are pre-selected by default.`;
    default: {
      const exhaustiveCheck: never = mode;
      return exhaustiveCheck;
    }
  }
}

function getUserLevelEmptyMessage(mode: UserLevelMode): string {
  switch (mode) {
    case 'po_sk':
    case 'po':
      return 'No program organizers found.';
    case 'sk':
      return 'No SK users found.';
    default: {
      const exhaustiveCheck: never = mode;
      return exhaustiveCheck;
    }
  }
}

export const AssignmentDialog = ({
  open,
  onClose,
  target,
  onAssigned,
}: AssignmentDialogProps) => {
  const navigate = useNavigate();
  const noun = entityNoun(target.kind);
  const [activeTab, setActiveTab] = useState<AssignmentTab>('user');
  const [userLevelMode, setUserLevelMode] = useState<UserLevelMode>('po_sk');

  const [
    triggerAdminUsers,
    {
      data: adminUsers,
      isLoading: loadingUsers,
      isError: usersError,
      isFetching: fetchingUsers,
    },
  ] = useLazyFetchAdminUsersQuery();

  const [triggerAssignments, { data: existingModuleAssignments }] =
    useLazyFetchAssignmentsQuery();
  const [createModuleAssignment, { isLoading: isAssigningModule }] =
    useCreateAssignmentMutation();
  const [revokeModuleAssignment, { isLoading: isRevokingModule }] =
    useRevokeAssignmentMutation();

  const [triggerVideoAssignments, { data: existingVideoAssignments }] =
    useLazyFetchVideoAssignmentsQuery();
  const [createVideoAssignment, { isLoading: isAssigningVideo }] =
    useCreateVideoAssignmentMutation();
  const [revokeVideoAssignment, { isLoading: isRevokingVideo }] =
    useRevokeVideoAssignmentMutation();

  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userIdsToRevoke, setUserIdsToRevoke] = useState<number[]>([]);
  const [upazilasToRevoke, setUpazilasToRevoke] = useState<string[]>([]);
  const [selectedUpazilaNames, setSelectedUpazilaNames] = useState<string[]>(
    [],
  );
  const [errorMsg, setErrorMsg] = useState('');

  const isAssigning = isAssigningModule || isAssigningVideo;
  const isRevoking = isRevokingModule || isRevokingVideo;
  const isSubmitting = isAssigning || isRevoking;

  const allUsers = useMemo(() => adminUsers ?? [], [adminUsers]);

  const targetAssignments = useMemo((): AssignableRecord[] => {
    switch (target.kind) {
      case 'module':
        return (existingModuleAssignments ?? []).filter(
          (assignment) => assignment.module_id === target.id,
        );
      case 'video':
        return (existingVideoAssignments ?? []).filter(
          (assignment) => assignment.source_document_id === target.id,
        );
      default: {
        const exhaustiveCheck: never = target;
        return exhaustiveCheck;
      }
    }
  }, [existingModuleAssignments, existingVideoAssignments, target]);

  const roleFilteredUsers = useMemo(
    () => getUsersForLevelMode(userLevelMode, allUsers),
    [allUsers, userLevelMode],
  );

  const userAssignmentStatus = useMemo(
    () =>
      toUserAssignmentStatus(
        buildUserAssignmentStatusMap(targetAssignments, allUsers),
        userLevelMode,
      ),
    [targetAssignments, allUsers, userLevelMode],
  );

  const alreadyAssignedUserIds = useMemo(() => {
    return getAssignedUserIdsForMode(
      targetAssignments,
      userLevelMode,
      allUsers,
    );
  }, [targetAssignments, userLevelMode, allUsers]);

  const alreadyAssignedUpazilas = useMemo(() => {
    return targetAssignments
      .filter(
        (assignment) =>
          assignment.assignment_type === 'geographical' && assignment.upazila,
      )
      .map((assignment) => assignment.upazila as string);
  }, [targetAssignments]);

  useEffect(() => {
    if (!open) return;

    setActiveTab('user');
    setUserLevelMode('po_sk');
    setSelectedDistrict('');
    setSelectedUpazila('');
    setSelectedUserIds([]);
    setUserIdsToRevoke([]);
    setUpazilasToRevoke([]);
    setSelectedUpazilaNames([]);
    setErrorMsg('');

    void triggerAdminUsers();

    switch (target.kind) {
      case 'module':
        void triggerAssignments({ module_id: target.id });
        break;
      case 'video':
        void triggerVideoAssignments({ source_document_id: target.id });
        break;
      default: {
        const exhaustiveCheck: never = target;
        return exhaustiveCheck;
      }
    }
  }, [
    open,
    target,
    triggerAdminUsers,
    triggerAssignments,
    triggerVideoAssignments,
  ]);

  const selectableSkUserIds = useMemo(
    () => getSelectableUserIdsForMode('sk', allUsers, targetAssignments),
    [allUsers, targetAssignments],
  );

  const prevUserLevelModeRef = useRef<UserLevelMode>(userLevelMode);

  useEffect(() => {
    if (!open) {
      prevUserLevelModeRef.current = 'po_sk';
      return;
    }
    if (activeTab !== 'user') return;

    const modeChanged = prevUserLevelModeRef.current !== userLevelMode;
    prevUserLevelModeRef.current = userLevelMode;

    setUserIdsToRevoke([]);

    if (userLevelMode === 'sk') {
      if (modeChanged) {
        setSelectedUserIds(
          Array.from(
            new Set([...selectableSkUserIds, ...alreadyAssignedUserIds]),
          ),
        );
      }
      return;
    }

    setSelectedUserIds(alreadyAssignedUserIds);
  }, [
    open,
    activeTab,
    userLevelMode,
    alreadyAssignedUserIds,
    selectableSkUserIds,
  ]);

  useEffect(() => {
    if (!open || activeTab !== 'geographical') return;
    setUpazilasToRevoke([]);
    setSelectedUpazilaNames(alreadyAssignedUpazilas);
  }, [open, activeTab, alreadyAssignedUpazilas]);

  const districtOptions = useMemo(() => {
    const uniqueDistricts = getUniqueDistricts(roleFilteredUsers);
    return [
      { label: 'All districts', value: '' },
      ...uniqueDistricts.map((district) => ({
        label: district,
        value: district,
      })),
    ];
  }, [roleFilteredUsers]);

  const upazilaFilterOptions = useMemo(() => {
    const uniqueUpazilas = getUniqueUpazilas(
      roleFilteredUsers,
      selectedDistrict,
    );
    return [
      { label: 'All upazilas', value: '' },
      ...uniqueUpazilas.map((upazila) => ({
        label: upazila,
        value: upazila,
      })),
    ];
  }, [roleFilteredUsers, selectedDistrict]);

  const displayedUserLevelUsers = useMemo(
    () =>
      filterUsersByLocation(
        roleFilteredUsers,
        selectedDistrict,
        selectedUpazila,
      ),
    [roleFilteredUsers, selectedDistrict, selectedUpazila],
  );

  const usersWithOtherAssignments = useMemo(
    () =>
      displayedUserLevelUsers.filter((user) => {
        const status = userAssignmentStatus.get(user.id);
        return Boolean(
          status?.isDisabledInCurrentMode &&
          !status.matchesCurrentMode &&
          !status.isInherited,
        );
      }),
    [displayedUserLevelUsers, userAssignmentStatus],
  );

  const selectableUserLevelUsers = useMemo(
    () =>
      displayedUserLevelUsers.filter((user) =>
        isUserSelectableForAssignment(userAssignmentStatus.get(user.id)),
      ),
    [displayedUserLevelUsers, userAssignmentStatus],
  );

  const displayedUpazilas = useMemo(
    () => getUniqueUpazilas(allUsers, selectedDistrict),
    [allUsers, selectedDistrict],
  );

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedUpazila('');
  };

  const retryUsers = () => {
    void triggerAdminUsers();
  };

  const handleSelectAllUsers = () => {
    const selectableIds = selectableUserLevelUsers.map((user) => user.id);
    const allSelected =
      selectableIds.length > 0 &&
      selectableIds.every((id) => selectedUserIds.includes(id));

    if (allSelected) {
      const revokedIds = selectableIds.filter(
        (id) =>
          selectedUserIds.includes(id) && alreadyAssignedUserIds.includes(id),
      );
      if (revokedIds.length > 0) {
        setUserIdsToRevoke((prev) =>
          Array.from(new Set([...prev, ...revokedIds])),
        );
      }
      setSelectedUserIds((prev) =>
        prev.filter((id) => !selectableIds.includes(id)),
      );
      return;
    }

    const restoredIds = selectableIds.filter((id) =>
      userIdsToRevoke.includes(id),
    );
    if (restoredIds.length > 0) {
      setUserIdsToRevoke((prev) =>
        prev.filter((id) => !restoredIds.includes(id)),
      );
    }

    setSelectedUserIds((prev) =>
      Array.from(new Set([...prev, ...selectableIds])),
    );
  };

  const handleUserCheckboxChange = (userId: number) => {
    const status = userAssignmentStatus.get(userId);
    if (!isUserSelectableForAssignment(status)) {
      return;
    }

    const isCurrentlySelected = selectedUserIds.includes(userId);
    const wasAlreadyAssigned = alreadyAssignedUserIds.includes(userId);

    if (isCurrentlySelected && wasAlreadyAssigned) {
      setUserIdsToRevoke((prev) =>
        prev.includes(userId) ? prev : [...prev, userId],
      );
    } else if (!isCurrentlySelected && wasAlreadyAssigned) {
      setUserIdsToRevoke((prev) => prev.filter((id) => id !== userId));
    }

    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleSelectAllUpazilas = () => {
    if (
      displayedUpazilas.length > 0 &&
      displayedUpazilas.every((name) => selectedUpazilaNames.includes(name))
    ) {
      const revokedUpazilas = displayedUpazilas.filter((name) =>
        alreadyAssignedUpazilas.includes(name),
      );
      if (revokedUpazilas.length > 0) {
        setUpazilasToRevoke((prev) =>
          Array.from(new Set([...prev, ...revokedUpazilas])),
        );
      }
      setSelectedUpazilaNames([]);
      return;
    }

    const restoredUpazilas = displayedUpazilas.filter((name) =>
      upazilasToRevoke.includes(name),
    );
    if (restoredUpazilas.length > 0) {
      setUpazilasToRevoke((prev) =>
        prev.filter((name) => !restoredUpazilas.includes(name)),
      );
    }

    setSelectedUpazilaNames(displayedUpazilas);
  };

  const handleUpazilaCheckboxChange = (upazilaName: string) => {
    const isCurrentlySelected = selectedUpazilaNames.includes(upazilaName);
    const wasAlreadyAssigned = alreadyAssignedUpazilas.includes(upazilaName);

    if (isCurrentlySelected && wasAlreadyAssigned) {
      setUpazilasToRevoke((prev) =>
        prev.includes(upazilaName) ? prev : [...prev, upazilaName],
      );
    } else if (!isCurrentlySelected && wasAlreadyAssigned) {
      setUpazilasToRevoke((prev) =>
        prev.filter((name) => name !== upazilaName),
      );
    }

    setSelectedUpazilaNames((prev) => {
      if (prev.includes(upazilaName)) {
        return prev.filter((name) => name !== upazilaName);
      }
      return [...prev, upazilaName];
    });
  };

  const finishSuccess = (
    assignmentType: AssignmentType,
    assignedUsers: AssignedUserEntry[],
    removedUsers: AssignedUserEntry[],
  ) => {
    switch (target.kind) {
      case 'module':
        onClose();
        navigate(paths.moduleAssigned, {
          state: {
            moduleId: target.id,
            moduleName: target.title,
            assignmentType,
            assignedCount: countAssignedUsers(assignedUsers),
            assignedUsers,
            removedUsers,
            assignedAt: new Date().toISOString(),
          },
        });
        return;
      case 'video':
        onClose();
        onAssigned?.();
        return;
      default: {
        const exhaustiveCheck: never = target;
        return exhaustiveCheck;
      }
    }
  };

  const revokeById = async (assignmentId: string) => {
    switch (target.kind) {
      case 'module':
        await revokeModuleAssignment(assignmentId).unwrap();
        return;
      case 'video':
        await revokeVideoAssignment(assignmentId).unwrap();
        return;
      default: {
        const exhaustiveCheck: never = target;
        return exhaustiveCheck;
      }
    }
  };

  const handleAssign = async () => {
    setErrorMsg('');
    try {
      if (activeTab === 'user') {
        const userIdsToAssign = selectedUserIds.filter(
          (userId) => !alreadyAssignedUserIds.includes(userId),
        );

        if (userIdsToAssign.length === 0 && userIdsToRevoke.length === 0) {
          setErrorMsg('Please select at least one user or change assignments.');
          return;
        }

        const assignmentType = getUserLevelAssignmentType(userLevelMode);
        const assignmentIdsToRevoke = getRevocableAssignmentIdsForUsers(
          targetAssignments,
          userIdsToRevoke,
          userLevelMode,
          allUsers,
        );

        await Promise.all(
          assignmentIdsToRevoke.map((assignmentId) => revokeById(assignmentId)),
        );

        const removedUsers = buildAssignedUserEntries(
          userLevelMode,
          userIdsToRevoke,
          allUsers,
        );

        if (userIdsToAssign.length > 0) {
          let assignedCount = 0;

          switch (target.kind) {
            case 'module': {
              const result = await createModuleAssignment({
                module_id: target.id,
                assignment_type: assignmentType,
                user_ids: userIdsToAssign,
              }).unwrap();
              assignedCount = result.assigned_count;
              break;
            }
            case 'video': {
              const result = await createVideoAssignment({
                source_document_id: target.id,
                assignment_type: assignmentType,
                user_ids: userIdsToAssign,
              }).unwrap();
              assignedCount = result.assigned_count;
              break;
            }
            default: {
              const exhaustiveCheck: never = target;
              return exhaustiveCheck;
            }
          }

          if (assignedCount === 0) {
            setErrorMsg(
              `This ${noun} is already assigned to the selected user(s). Choose different users or check existing assignments.`,
            );
            return;
          }
        }

        const assignedUsers = buildAssignedUserEntries(
          userLevelMode,
          userIdsToAssign,
          allUsers,
        );

        finishSuccess(assignmentType, assignedUsers, removedUsers);
        return;
      }

      if (activeTab === 'geographical') {
        const upazilasToAssign = selectedUpazilaNames.filter(
          (upazilaName) => !alreadyAssignedUpazilas.includes(upazilaName),
        );

        if (upazilasToAssign.length === 0 && upazilasToRevoke.length === 0) {
          setErrorMsg(
            'Please select at least one upazila or change assignments.',
          );
          return;
        }

        const assignmentIdsToRevoke = getRevocableGeographicalAssignmentIds(
          targetAssignments,
          upazilasToRevoke,
        );

        await Promise.all(
          assignmentIdsToRevoke.map((assignmentId) => revokeById(assignmentId)),
        );

        const removedUsers = buildGeographicalAssignedEntries(upazilasToRevoke);

        if (upazilasToAssign.length > 0) {
          let assignedCount = 0;

          switch (target.kind) {
            case 'module': {
              const result = await createModuleAssignment({
                module_id: target.id,
                assignment_type: 'geographical',
                upazilas: upazilasToAssign,
              }).unwrap();
              assignedCount = result.assigned_count;
              break;
            }
            case 'video': {
              const result = await createVideoAssignment({
                source_document_id: target.id,
                assignment_type: 'geographical',
                upazilas: upazilasToAssign,
              }).unwrap();
              assignedCount = result.assigned_count;
              break;
            }
            default: {
              const exhaustiveCheck: never = target;
              return exhaustiveCheck;
            }
          }

          if (assignedCount === 0) {
            setErrorMsg(
              `This ${noun} is already assigned to the selected upazila(s). Choose different upazilas or check existing assignments.`,
            );
            return;
          }
        }

        const assignedUsers =
          buildGeographicalAssignedEntries(upazilasToAssign);

        finishSuccess('geographical', assignedUsers, removedUsers);
      }
    } catch (err: unknown) {
      console.error(err);
      const detail =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data?: { detail?: string } }).data?.detail
          : undefined;
      setErrorMsg(
        detail || `An error occurred while creating ${noun} assignment.`,
      );
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} labelledBy="assignment-dialog-title" onClose={onClose}>
      <Loader
        open={isSubmitting}
        label={isAssigning ? `Assigning ${noun}…` : 'Revoking assignment…'}
      />
      <Card
        variant="elevated"
        className="w-full max-w-lg space-y-4 border-spice-border p-4 shadow-lg sm:p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2
              id="assignment-dialog-title"
              className="text-lg font-semibold text-spice-text-primary sm:text-xl"
            >
              Assign {noun}
            </h2>
            <p className="mt-1 text-xs text-spice-text-muted">{target.title}</p>
          </div>
          <Button
            variant="secondary"
            className="h-9 px-3 text-xs"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        {errorMsg ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {errorMsg}
          </div>
        ) : null}

        <Tabs
          items={ASSIGNMENT_TABS}
          value={activeTab}
          onChange={(value) => {
            setActiveTab(value as AssignmentTab);
            setErrorMsg('');
          }}
        />

        <div className="max-h-[50vh] space-y-4 overflow-y-auto p-2">
          {activeTab === 'user' ? (
            <>
              <label className="flex items-center gap-3">
                <span className="shrink-0 text-xs font-semibold text-spice-text-primary">
                  Role
                </span>
                <Select
                  options={USER_LEVEL_MODE_OPTIONS}
                  value={userLevelMode}
                  onChange={(value) => {
                    setUserLevelMode(value as UserLevelMode);
                    setSelectedDistrict('');
                    setSelectedUpazila('');
                    setErrorMsg('');
                  }}
                  className="min-w-0 flex-1 whitespace-nowrap"
                  disabled={loadingUsers}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-2">
                  <span className="text-xs font-semibold text-spice-text-primary">
                    District
                  </span>
                  <Select
                    options={districtOptions}
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    className="w-full"
                    disabled={loadingUsers}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-xs font-semibold text-spice-text-primary">
                    Upazila
                  </span>
                  <Select
                    options={upazilaFilterOptions}
                    value={selectedUpazila}
                    onChange={setSelectedUpazila}
                    className="w-full"
                    disabled={loadingUsers}
                  />
                </label>
              </div>

              <UserSelectionList
                title="User"
                users={displayedUserLevelUsers}
                selectedUserIds={selectedUserIds}
                userAssignmentStatus={userAssignmentStatus}
                isLoading={loadingUsers}
                isError={usersError}
                isFetching={fetchingUsers}
                onRetry={retryUsers}
                onSelectAll={handleSelectAllUsers}
                onToggleUser={handleUserCheckboxChange}
                emptyMessage={getUserLevelEmptyMessage(userLevelMode)}
                otherAssignmentUsers={usersWithOtherAssignments}
              />

              <p className="text-xs leading-relaxed text-spice-text-muted">
                {getUserLevelHint(userLevelMode, target.kind)}
              </p>
            </>
          ) : null}

          {activeTab === 'geographical' ? (
            <>
              <label className="block space-y-2">
                <span className="text-xs font-semibold text-spice-text-primary">
                  District
                </span>
                <Select
                  options={districtOptions}
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="w-full"
                  disabled={loadingUsers}
                />
              </label>

              <div className="overflow-hidden rounded-lg border border-spice-border">
                <div className="flex items-center justify-between border-b border-spice-border bg-spice-bg-tint px-3 py-2 text-xs font-semibold text-spice-text-medium">
                  <div className="flex items-center gap-1.5">
                    <span>Upazila</span>
                    {usersError ? (
                      <FetchRetryButton
                        label="Retry loading upazilas"
                        onRetry={retryUsers}
                        disabled={fetchingUsers}
                      />
                    ) : null}
                  </div>
                  {displayedUpazilas.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleSelectAllUpazilas}
                      className="text-spice-brand-primary hover:underline"
                    >
                      {displayedUpazilas.every((name) =>
                        selectedUpazilaNames.includes(name),
                      )
                        ? 'Deselect all'
                        : 'Select all'}
                    </button>
                  ) : null}
                </div>

                <div className="max-h-[20vh] divide-y divide-spice-border overflow-y-auto">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-sm text-spice-text-muted">
                      Loading upazilas…
                    </div>
                  ) : usersError ? (
                    <div className="p-4 text-center text-sm text-spice-text-muted">
                      Failed to load upazilas.
                    </div>
                  ) : displayedUpazilas.length === 0 ? (
                    <div className="p-4 text-center text-sm text-spice-text-muted">
                      No upazilas found.
                    </div>
                  ) : (
                    displayedUpazilas.map((upazilaName) => {
                      const isChecked =
                        selectedUpazilaNames.includes(upazilaName);
                      const isAlreadyAssigned =
                        alreadyAssignedUpazilas.includes(upazilaName);

                      return (
                        <label
                          key={upazilaName}
                          className="flex cursor-pointer items-center justify-between px-3 py-2.5 hover:bg-spice-bg-tint/30"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-spice-text-primary">
                              {upazilaName}
                            </span>
                            {isAlreadyAssigned ? (
                              <span className="text-xs text-spice-text-muted">
                                Already assigned
                              </span>
                            ) : null}
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              handleUpazilaCheckboxChange(upazilaName)
                            }
                            className="h-4 w-4 rounded border-spice-border text-spice-brand-primary focus:ring-spice-brand-primary/25"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-spice-text-muted">
                Assign this {noun} to all users in the selected upazila(s).
              </p>
            </>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            className="h-9 text-xs"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="h-9 text-xs"
            onClick={() => void handleAssign()}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Assigning…' : `Assign ${noun}`}
          </Button>
        </div>
      </Card>
    </Modal>
  );
};

export const ModuleAssignmentDialog = ({
  open,
  onClose,
  moduleId,
  moduleTitle,
}: ModuleAssignmentDialogProps) => (
  <AssignmentDialog
    open={open}
    onClose={onClose}
    target={{ kind: 'module', id: moduleId, title: moduleTitle }}
  />
);
