import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banner,
  Button,
  Card,
  Loader,
  Modal,
  Select,
  Tabs,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  type AdminUser,
  type AssignmentSummaryType,
  getProgramOrganizers,
  getSkUsers,
  getUniqueDistricts,
  getUniqueUpazilas,
  useLazyFetchAdminUpazilasQuery,
  useLazyFetchAdminUsersQuery,
  useLazyFetchModuleAssignedUsersQuery,
  useReplaceModuleAssignedUsersMutation,
} from '@/features/modules/api/adminAssignmentApi';
import {
  useLazyFetchDocumentAssignedUsersQuery,
  useReplaceDocumentAssignedUsersMutation,
} from '@/features/ingest/api/adminDocumentAssignmentApi';
import {
  buildAssignedUserEntries,
  buildGeographicalAssignedEntries,
  countAssignedUsers,
  type AssignedUserEntry,
} from '@/features/modules/utils/assignmentDisplay';
import { userMatchesUpazila } from '@/features/modules/utils/mapHierarchyUsersToAdminUsers';

type AssignmentTab = 'user' | 'geographical';
type UserLevelMode = 'po_sk' | 'sk';

export type AssignmentDialogTarget =
  | { kind: 'module'; id: string; title: string }
  | {
      kind: 'sourceDocument';
      id: string;
      title: string;
      noun: 'video' | 'document';
    };

const USER_LEVEL_MODE_OPTIONS: Array<{ label: string; value: UserLevelMode }> =
  [
    { label: 'PO and SK', value: 'po_sk' },
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

function entityNoun(target: AssignmentDialogTarget): string {
  if (target.kind === 'module') return 'module';
  return target.noun;
}

function getUserLevelHint(mode: UserLevelMode, noun: string): string {
  if (mode === 'po_sk') {
    return `Assign this ${noun} to selected POs. Their SKs are included automatically.`;
  }
  return `Assign this ${noun} to selected SK users.`;
}

function getUserLevelEmptyMessage(mode: UserLevelMode): string {
  return mode === 'po_sk'
    ? 'No program organizers found.'
    : 'No SK users found.';
}

function filterUsersByLocation(
  users: AdminUser[],
  district: string,
  upazila: string,
): AdminUser[] {
  return users.filter((user) => {
    if (district && user.district !== district) return false;
    if (upazila && !userMatchesUpazila(user, upazila)) return false;
    return true;
  });
}

function usersInUpazila(users: AdminUser[], upazilaName: string): AdminUser[] {
  return users.filter(
    (user) =>
      (user.role === 'PO' || user.role === 'SK') &&
      userMatchesUpazila(user, upazilaName),
  );
}

function isUpazilaFullyCovered(
  desiredIds: Set<number>,
  users: AdminUser[],
  upazilaName: string,
): boolean {
  const members = usersInUpazila(users, upazilaName);
  if (members.length === 0) return false;
  return members.every((user) => desiredIds.has(user.id));
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
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
        />
      </svg>
    </button>
  );
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
  const selectableUsers = users.filter(
    (user) => !userAssignmentStatus.get(user.id)?.isDisabledInCurrentMode,
  );

  return (
    <div className="overflow-hidden rounded-lg border border-spice-border">
      <div className="flex items-center justify-between border-b border-spice-border bg-spice-bg-tint px-3 py-2 text-xs font-semibold text-spice-text-medium">
        <div className="flex items-center gap-1.5">
          <span>{title}</span>
          {isError ? (
            <FetchRetryButton
              label="Retry loading users"
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
            {selectableUsers.every((user) => selectedUserIds.includes(user.id))
              ? 'Deselect all'
              : 'Select all'}
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
            const isChecked = selectedUserIds.includes(user.id);
            const isDisabled = Boolean(status?.isDisabledInCurrentMode);
            const locationLabel = user.upazila
              ? `${user.district} · ${user.upazila}`
              : user.district;

            return (
              <label
                key={user.id}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                  isDisabled
                    ? 'cursor-not-allowed bg-spice-bg-tint/20 opacity-70'
                    : 'cursor-pointer hover:bg-spice-bg-tint/30'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-spice-text-primary">
                    {user.name}
                  </div>
                  <div className="truncate text-xs text-spice-text-muted">
                    {locationLabel}
                  </div>
                  {status ? (
                    <div
                      className={
                        status.isInherited || status.matchesCurrentMode
                          ? 'text-xs font-semibold text-spice-brand-primary'
                          : 'text-xs text-spice-text-muted'
                      }
                    >
                      {status.displayLabel}
                    </div>
                  ) : null}
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => onToggleUser(user.id)}
                  className="h-4 w-4 rounded border-spice-border text-spice-brand-primary focus:ring-spice-brand-primary/25"
                />
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

export const AssignmentDialog = ({
  open,
  onClose,
  target,
  onAssigned,
}: AssignmentDialogProps) => {
  const navigate = useNavigate();
  const noun = entityNoun(target);
  const [activeTab, setActiveTab] = useState<AssignmentTab>('user');
  const [userLevelMode, setUserLevelMode] = useState<UserLevelMode>('po_sk');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [desiredUserIds, setDesiredUserIds] = useState<number[]>([]);
  const [baselineUserIds, setBaselineUserIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const [
    triggerAdminUsers,
    {
      data: adminUsers,
      isLoading: loadingUsers,
      isError: usersError,
      isFetching: fetchingUsers,
    },
  ] = useLazyFetchAdminUsersQuery();

  const [
    triggerAdminUpazilas,
    {
      data: adminUpazilas,
      isLoading: loadingUpazilas,
      isError: upazilasError,
      isFetching: fetchingUpazilas,
    },
  ] = useLazyFetchAdminUpazilasQuery();

  const [triggerModuleAssignedUsers, { data: moduleAssignedUsers }] =
    useLazyFetchModuleAssignedUsersQuery();
  const [replaceModuleUsers, { isLoading: isSavingModule }] =
    useReplaceModuleAssignedUsersMutation();

  const [triggerDocumentAssignedUsers, { data: documentAssignedUsers }] =
    useLazyFetchDocumentAssignedUsersQuery();
  const [replaceDocumentUsers, { isLoading: isSavingDocument }] =
    useReplaceDocumentAssignedUsersMutation();

  const isSubmitting = isSavingModule || isSavingDocument;
  const allUsers = useMemo(() => adminUsers ?? [], [adminUsers]);
  const catalogUpazilas = useMemo(() => adminUpazilas ?? [], [adminUpazilas]);
  const loadingGeoLists = loadingUsers || loadingUpazilas;
  const geoListsError = usersError || upazilasError;
  const fetchingGeoLists = fetchingUsers || fetchingUpazilas;
  const desiredSet = useMemo(() => new Set(desiredUserIds), [desiredUserIds]);
  const baselineSet = useMemo(
    () => new Set(baselineUserIds),
    [baselineUserIds],
  );

  const assignedUsersForTarget = useMemo(() => {
    if (target.kind === 'module') return moduleAssignedUsers ?? [];
    return documentAssignedUsers ?? [];
  }, [documentAssignedUsers, moduleAssignedUsers, target.kind]);

  useEffect(() => {
    if (!open) return;
    setActiveTab('user');
    setUserLevelMode('po_sk');
    setSelectedDistrict('');
    setSelectedUpazila('');
    setErrorMsg('');
    void triggerAdminUsers();
    void triggerAdminUpazilas();
    if (target.kind === 'module') {
      void triggerModuleAssignedUsers(target.id);
    } else {
      void triggerDocumentAssignedUsers(target.id);
    }
  }, [
    open,
    target,
    triggerAdminUpazilas,
    triggerAdminUsers,
    triggerDocumentAssignedUsers,
    triggerModuleAssignedUsers,
  ]);

  useEffect(() => {
    if (!open) return;
    const ids = assignedUsersForTarget.map((user) => user.id);
    setBaselineUserIds(ids);
    setDesiredUserIds(ids);
  }, [assignedUsersForTarget, open]);

  const roleFilteredUsers = useMemo(() => {
    return userLevelMode === 'po_sk'
      ? getProgramOrganizers(allUsers)
      : getSkUsers(allUsers);
  }, [allUsers, userLevelMode]);

  const districtOptions = useMemo(() => {
    const source = activeTab === 'geographical' ? allUsers : roleFilteredUsers;
    return [
      { label: 'All districts', value: '' },
      ...getUniqueDistricts(source).map((district) => ({
        label: district,
        value: district,
      })),
    ];
  }, [activeTab, allUsers, roleFilteredUsers]);

  const upazilaFilterOptions = useMemo(() => {
    return [
      { label: 'All upazilas', value: '' },
      ...getUniqueUpazilas(roleFilteredUsers, selectedDistrict).map(
        (upazila) => ({
          label: upazila,
          value: upazila,
        }),
      ),
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

  const displayedUpazilas = useMemo(() => {
    const selectedDistrictId =
      selectedDistrict === ''
        ? null
        : (allUsers.find((user) => user.district === selectedDistrict)
            ?.district_id ?? null);
    const fromCatalog = catalogUpazilas
      .filter(
        (upazila) =>
          selectedDistrictId === null ||
          upazila.district_id === selectedDistrictId,
      )
      .map((upazila) => upazila.name);
    if (fromCatalog.length > 0) {
      return Array.from(new Set(fromCatalog)).sort((a, b) =>
        a.localeCompare(b),
      );
    }
    return getUniqueUpazilas(allUsers, selectedDistrict);
  }, [allUsers, catalogUpazilas, selectedDistrict]);

  const selectedUpazilaNames = useMemo(
    () =>
      displayedUpazilas.filter((name) =>
        isUpazilaFullyCovered(desiredSet, allUsers, name),
      ),
    [allUsers, desiredSet, displayedUpazilas],
  );

  const alreadyAssignedUpazilas = useMemo(
    () =>
      displayedUpazilas.filter((name) =>
        isUpazilaFullyCovered(baselineSet, allUsers, name),
      ),
    [allUsers, baselineSet, displayedUpazilas],
  );

  const userAssignmentStatus = useMemo(() => {
    const map = new Map<number, UserAssignmentStatus>();
    const selectedPoIds = allUsers
      .filter((user) => user.role === 'PO' && desiredSet.has(user.id))
      .map((user) => user.id);

    for (const user of allUsers) {
      if (user.role === 'SK' && user.parent_id !== null) {
        if (selectedPoIds.includes(user.parent_id)) {
          const parent = allUsers.find(
            (candidate) => candidate.id === user.parent_id,
          );
          map.set(user.id, {
            label: 'Inherited',
            displayLabel: `Included via PO${parent ? ` — ${parent.name}` : ''}`,
            matchesCurrentMode: userLevelMode === 'po_sk',
            isInherited: true,
            isDisabledInCurrentMode: true,
          });
          continue;
        }
      }

      if (baselineSet.has(user.id)) {
        map.set(user.id, {
          label: 'Assigned',
          displayLabel: 'Already assigned',
          matchesCurrentMode: true,
          isDisabledInCurrentMode: false,
        });
      }
    }
    return map;
  }, [allUsers, baselineSet, desiredSet, userLevelMode]);

  const selectedUserIdsForMode = useMemo(() => {
    if (userLevelMode === 'po_sk') {
      return desiredUserIds.filter((id) =>
        allUsers.some((user) => user.id === id && user.role === 'PO'),
      );
    }
    return desiredUserIds.filter((id) => {
      const user = allUsers.find((candidate) => candidate.id === id);
      if (!user || user.role !== 'SK') return false;
      if (user.parent_id !== null && desiredSet.has(user.parent_id)) {
        return false;
      }
      return true;
    });
  }, [allUsers, desiredSet, desiredUserIds, userLevelMode]);

  const retryUsers = () => {
    void triggerAdminUsers();
    void triggerAdminUpazilas();
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedUpazila('');
  };

  const addUsersToDesired = (ids: number[]) => {
    setDesiredUserIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const removeUsersFromDesired = (ids: number[]) => {
    const remove = new Set(ids);
    setDesiredUserIds((prev) => prev.filter((id) => !remove.has(id)));
  };

  const handleToggleUser = (userId: number) => {
    const status = userAssignmentStatus.get(userId);
    if (status?.isDisabledInCurrentMode) return;

    const user = allUsers.find((candidate) => candidate.id === userId);
    if (!user) return;

    if (desiredSet.has(userId)) {
      if (user.role === 'PO') {
        const childSkIds = allUsers
          .filter((candidate) => candidate.parent_id === userId)
          .map((candidate) => candidate.id);
        removeUsersFromDesired([userId, ...childSkIds]);
      } else {
        removeUsersFromDesired([userId]);
      }
      return;
    }

    if (user.role === 'PO') {
      const childSkIds = allUsers
        .filter((candidate) => candidate.parent_id === userId)
        .map((candidate) => candidate.id);
      addUsersToDesired([userId, ...childSkIds]);
    } else {
      addUsersToDesired([userId]);
    }
  };

  const handleSelectAllUsers = () => {
    const selectable = displayedUserLevelUsers.filter(
      (user) => !userAssignmentStatus.get(user.id)?.isDisabledInCurrentMode,
    );
    const allSelected = selectable.every((user) => desiredSet.has(user.id));
    if (allSelected) {
      const idsToRemove = selectable.flatMap((user) => {
        if (user.role === 'PO') {
          const childSkIds = allUsers
            .filter((candidate) => candidate.parent_id === user.id)
            .map((candidate) => candidate.id);
          return [user.id, ...childSkIds];
        }
        return [user.id];
      });
      removeUsersFromDesired(idsToRemove);
      return;
    }
    const idsToAdd = selectable.flatMap((user) => {
      if (user.role === 'PO') {
        const childSkIds = allUsers
          .filter((candidate) => candidate.parent_id === user.id)
          .map((candidate) => candidate.id);
        return [user.id, ...childSkIds];
      }
      return [user.id];
    });
    addUsersToDesired(idsToAdd);
  };

  const handleUpazilaCheckboxChange = (upazilaName: string) => {
    const members = usersInUpazila(allUsers, upazilaName).map(
      (user) => user.id,
    );
    if (isUpazilaFullyCovered(desiredSet, allUsers, upazilaName)) {
      removeUsersFromDesired(members);
      return;
    }
    addUsersToDesired(members);
  };

  const handleSelectAllUpazilas = () => {
    const allSelected = displayedUpazilas.every((name) =>
      isUpazilaFullyCovered(desiredSet, allUsers, name),
    );
    const memberIds = displayedUpazilas.flatMap((name) =>
      usersInUpazila(allUsers, name).map((user) => user.id),
    );
    if (allSelected) {
      removeUsersFromDesired(memberIds);
      return;
    }
    addUsersToDesired(memberIds);
  };

  const finishSuccess = (
    assignmentType: AssignmentSummaryType,
    assignedUsers: AssignedUserEntry[],
    removedUsers: AssignedUserEntry[],
  ) => {
    if (target.kind === 'module') {
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
    }
    onClose();
    onAssigned?.();
  };

  const handleAssign = async () => {
    setErrorMsg('');
    const nextIds = [...desiredUserIds];
    const addedIds = nextIds.filter((id) => !baselineSet.has(id));
    const removedIds = baselineUserIds.filter((id) => !desiredSet.has(id));

    if (addedIds.length === 0 && removedIds.length === 0) {
      setErrorMsg('Please select at least one user or change assignments.');
      return;
    }

    try {
      if (target.kind === 'module') {
        await replaceModuleUsers({
          moduleId: target.id,
          user_ids: nextIds,
        }).unwrap();
      } else {
        await replaceDocumentUsers({
          sourceDocumentId: target.id,
          user_ids: nextIds,
        }).unwrap();
      }

      let summaryType: AssignmentSummaryType = 'sk';
      let assignedEntries: AssignedUserEntry[] = [];
      let removedEntries: AssignedUserEntry[] = [];

      if (activeTab === 'geographical') {
        summaryType = 'geographical';
        const addedUpazilas = displayedUpazilas.filter(
          (name) =>
            isUpazilaFullyCovered(desiredSet, allUsers, name) &&
            !isUpazilaFullyCovered(baselineSet, allUsers, name),
        );
        const removedUpazilas = displayedUpazilas.filter(
          (name) =>
            !isUpazilaFullyCovered(desiredSet, allUsers, name) &&
            isUpazilaFullyCovered(baselineSet, allUsers, name),
        );
        assignedEntries = buildGeographicalAssignedEntries(addedUpazilas);
        removedEntries = buildGeographicalAssignedEntries(removedUpazilas);
      } else if (userLevelMode === 'po_sk') {
        summaryType = 'po_sk';
        const addedPos = addedIds.filter((id) =>
          allUsers.some((user) => user.id === id && user.role === 'PO'),
        );
        const removedPos = removedIds.filter((id) =>
          allUsers.some((user) => user.id === id && user.role === 'PO'),
        );
        assignedEntries = buildAssignedUserEntries('po_sk', addedPos, allUsers);
        removedEntries = buildAssignedUserEntries(
          'po_sk',
          removedPos,
          allUsers,
        );
      } else {
        summaryType = 'sk';
        assignedEntries = buildAssignedUserEntries('sk', addedIds, allUsers);
        removedEntries = buildAssignedUserEntries('sk', removedIds, allUsers);
      }

      finishSuccess(summaryType, assignedEntries, removedEntries);
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
      <Loader open={isSubmitting} label={`Assigning ${noun}…`} />
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

        {errorMsg ? <Banner tone="critical">{errorMsg}</Banner> : null}

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
                selectedUserIds={selectedUserIdsForMode}
                userAssignmentStatus={userAssignmentStatus}
                isLoading={loadingUsers}
                isError={usersError}
                isFetching={fetchingUsers}
                onRetry={retryUsers}
                onSelectAll={handleSelectAllUsers}
                onToggleUser={handleToggleUser}
                emptyMessage={getUserLevelEmptyMessage(userLevelMode)}
              />

              <p className="text-xs leading-relaxed text-spice-text-muted">
                {getUserLevelHint(userLevelMode, noun)}
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
                  disabled={loadingGeoLists}
                />
              </label>

              <div className="overflow-hidden rounded-lg border border-spice-border">
                <div className="flex items-center justify-between border-b border-spice-border bg-spice-bg-tint px-3 py-2 text-xs font-semibold text-spice-text-medium">
                  <div className="flex items-center gap-1.5">
                    <span>Upazila</span>
                    {geoListsError ? (
                      <FetchRetryButton
                        label="Retry loading upazilas"
                        onRetry={retryUsers}
                        disabled={fetchingGeoLists}
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
                  {loadingGeoLists ? (
                    <div className="p-4 text-center text-sm text-spice-text-muted">
                      Loading upazilas…
                    </div>
                  ) : geoListsError ? (
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
