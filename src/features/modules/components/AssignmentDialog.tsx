import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banner,
  Button,
  Card,
  InfiniteScrollContainer,
  Loader,
  Modal,
  Select,
  Tabs,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  ASSIGNMENT_LIST_PAGE_SIZE,
  ASSIGNMENT_USERS_PAGE_SIZE,
  type AdminUser,
  type AssignmentSummaryType,
  type HierarchyUsersPageParams,
  useLazyFetchAdminDistrictsQuery,
  useLazyFetchAdminUpazilasPageQuery,
  useLazyFetchAdminUpazilasQuery,
  useLazyFetchHierarchyUsersPageQuery,
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
  const selectLoadedNote =
    'Select loaded applies only to users currently shown.';
  if (mode === 'po_sk') {
    return `Assign this ${noun} to selected POs. Their SKs are included automatically. ${selectLoadedNote}`;
  }
  return `Assign this ${noun} to selected SK users. ${selectLoadedNote}`;
}

function getUserLevelEmptyMessage(mode: UserLevelMode): string {
  return mode === 'po_sk'
    ? 'No program organizers found.'
    : 'No SK users found.';
}

function hierarchyRoleForMode(
  mode: UserLevelMode,
): HierarchyUsersPageParams['role'] {
  return mode === 'po_sk' ? 'PO' : 'SHASTIYA_KORMI';
}

function baselineUpazilaNames(users: AdminUser[]): string[] {
  return Array.from(
    new Set(
      users.flatMap((user) => {
        if (user.upazilas?.length) return user.upazilas;
        return user.upazila ? [user.upazila] : [];
      }),
    ),
  ).sort((a, b) => a.localeCompare(b));
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
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
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
  hasMore,
  isLoadingMore,
  onLoadMore,
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
              ? 'Deselect loaded'
              : 'Select loaded'}
          </button>
        ) : null}
      </div>
      <InfiniteScrollContainer
        className="max-h-[20vh]"
        hasMore={!isLoading && !isError && hasMore}
        onLoadMore={onLoadMore}
        loadedCount={users.length}
        isLoadingMore={isLoadingMore}
        disabled={isLoading || isError}
      >
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
          <div className="divide-y divide-spice-border">
            {users.map((user) => {
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
            })}
          </div>
        )}
      </InfiniteScrollContainer>
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
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
    null,
  );
  const [selectedUpazilaId, setSelectedUpazilaId] = useState<number | null>(
    null,
  );
  const [desiredUserIds, setDesiredUserIds] = useState<number[]>([]);
  const [baselineUserIds, setBaselineUserIds] = useState<number[]>([]);
  const [desiredUpazilas, setDesiredUpazilas] = useState<string[]>([]);
  const [baselineUpazilas, setBaselineUpazilas] = useState<string[]>([]);
  const [loadedUsers, setLoadedUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersOffset, setUsersOffset] = useState(0);
  const [loadedUpazilas, setLoadedUpazilas] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [upazilasTotal, setUpazilasTotal] = useState(0);
  const [upazilasOffset, setUpazilasOffset] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const [
    triggerDistricts,
    {
      data: districts = [],
      isLoading: loadingDistricts,
      isError: districtsError,
      isFetching: fetchingDistricts,
    },
  ] = useLazyFetchAdminDistrictsQuery();

  const [
    triggerUsersPage,
    { isLoading: loadingUsers, isError: usersError, isFetching: fetchingUsers },
  ] = useLazyFetchHierarchyUsersPageQuery();

  const [triggerUpazilasForFilter, { data: filterUpazilas = [] }] =
    useLazyFetchAdminUpazilasQuery();

  const [
    triggerUpazilasPage,
    {
      isLoading: loadingUpazilas,
      isError: upazilasError,
      isFetching: fetchingUpazilas,
    },
  ] = useLazyFetchAdminUpazilasPageQuery();

  const [triggerModuleAssignedUsers, { data: moduleAssignedUsers }] =
    useLazyFetchModuleAssignedUsersQuery();
  const [replaceModuleUsers, { isLoading: isSavingModule }] =
    useReplaceModuleAssignedUsersMutation();

  const [triggerDocumentAssignedUsers, { data: documentAssignedUsers }] =
    useLazyFetchDocumentAssignedUsersQuery();
  const [replaceDocumentUsers, { isLoading: isSavingDocument }] =
    useReplaceDocumentAssignedUsersMutation();

  const isSubmitting = isSavingModule || isSavingDocument;
  const desiredSet = useMemo(() => new Set(desiredUserIds), [desiredUserIds]);
  const baselineSet = useMemo(
    () => new Set(baselineUserIds),
    [baselineUserIds],
  );
  const desiredUpazilaSet = useMemo(
    () => new Set(desiredUpazilas),
    [desiredUpazilas],
  );
  const baselineUpazilaSet = useMemo(
    () => new Set(baselineUpazilas),
    [baselineUpazilas],
  );

  const assignedUsersForTarget = useMemo(() => {
    if (target.kind === 'module') return moduleAssignedUsers ?? [];
    return documentAssignedUsers ?? [];
  }, [documentAssignedUsers, moduleAssignedUsers, target.kind]);

  const knownUsersById = useMemo(() => {
    const map = new Map<number, AdminUser>();
    for (const user of assignedUsersForTarget) map.set(user.id, user);
    for (const user of loadedUsers) map.set(user.id, user);
    return map;
  }, [assignedUsersForTarget, loadedUsers]);

  const districtOptions = useMemo(
    () => [
      { label: 'All districts', value: '' },
      ...districts.map((district) => ({
        label: district.name,
        value: String(district.id),
      })),
    ],
    [districts],
  );

  const upazilaFilterOptions = useMemo(
    () => [
      { label: 'All upazilas', value: '' },
      ...filterUpazilas.map((upazila) => ({
        label: upazila.name,
        value: String(upazila.id),
      })),
    ],
    [filterUpazilas],
  );

  const usersHasMore = loadedUsers.length < usersTotal;
  const upazilasHasMore = loadedUpazilas.length < upazilasTotal;

  const loadUsersPage = useCallback(
    async (offset: number, append: boolean) => {
      const result = await triggerUsersPage({
        limit: ASSIGNMENT_USERS_PAGE_SIZE,
        offset,
        role: hierarchyRoleForMode(userLevelMode),
        ...(selectedDistrictId !== null
          ? { districtId: selectedDistrictId }
          : {}),
        ...(selectedUpazilaId !== null ? { upazilaId: selectedUpazilaId } : {}),
      });
      if ('error' in result && result.error) return;
      const page = result.data;
      if (!page) return;
      setUsersTotal(page.total);
      setUsersOffset(page.offset + page.users.length);
      setLoadedUsers((prev) =>
        append ? [...prev, ...page.users] : page.users,
      );
    },
    [selectedDistrictId, selectedUpazilaId, triggerUsersPage, userLevelMode],
  );

  const loadUpazilasPage = useCallback(
    async (offset: number, append: boolean) => {
      const result = await triggerUpazilasPage({
        limit: ASSIGNMENT_LIST_PAGE_SIZE,
        offset,
        ...(selectedDistrictId !== null
          ? { districtId: selectedDistrictId }
          : {}),
      });
      if ('error' in result && result.error) return;
      const page = result.data;
      if (!page) return;
      setUpazilasTotal(page.total);
      setUpazilasOffset(page.offset + page.upazilas.length);
      setLoadedUpazilas((prev) =>
        append ? [...prev, ...page.upazilas] : page.upazilas,
      );
    },
    [selectedDistrictId, triggerUpazilasPage],
  );

  useEffect(() => {
    if (!open) return;
    setActiveTab('user');
    setUserLevelMode('po_sk');
    setSelectedDistrictId(null);
    setSelectedUpazilaId(null);
    setErrorMsg('');
    setLoadedUsers([]);
    setUsersTotal(0);
    setUsersOffset(0);
    setLoadedUpazilas([]);
    setUpazilasTotal(0);
    setUpazilasOffset(0);
    void triggerDistricts();
    if (target.kind === 'module') {
      void triggerModuleAssignedUsers(target.id);
    } else {
      void triggerDocumentAssignedUsers(target.id);
    }
  }, [
    open,
    target,
    triggerDistricts,
    triggerDocumentAssignedUsers,
    triggerModuleAssignedUsers,
  ]);

  useEffect(() => {
    if (!open) return;
    const ids = assignedUsersForTarget.map((user) => user.id);
    const upazilas = baselineUpazilaNames(assignedUsersForTarget);
    setBaselineUserIds(ids);
    setDesiredUserIds(ids);
    setBaselineUpazilas(upazilas);
    setDesiredUpazilas(upazilas);
  }, [assignedUsersForTarget, open]);

  useEffect(() => {
    if (!open || activeTab !== 'user') return;
    setLoadedUsers([]);
    setUsersTotal(0);
    setUsersOffset(0);
    void loadUsersPage(0, false);
  }, [activeTab, loadUsersPage, open]);

  useEffect(() => {
    if (!open) return;
    void triggerUpazilasForFilter(
      selectedDistrictId !== null
        ? { districtId: selectedDistrictId }
        : undefined,
    );
  }, [open, selectedDistrictId, triggerUpazilasForFilter]);

  useEffect(() => {
    if (!open || activeTab !== 'geographical') return;
    setLoadedUpazilas([]);
    setUpazilasTotal(0);
    setUpazilasOffset(0);
    void loadUpazilasPage(0, false);
  }, [activeTab, loadUpazilasPage, open, selectedDistrictId]);

  const userAssignmentStatus = useMemo(() => {
    const map = new Map<number, UserAssignmentStatus>();
    const selectedPoIds = Array.from(desiredSet).filter((id) => {
      const user = knownUsersById.get(id);
      return user?.role === 'PO';
    });

    for (const user of loadedUsers) {
      if (
        user.role === 'SK' &&
        user.parent_id !== null &&
        selectedPoIds.includes(user.parent_id)
      ) {
        const parent = knownUsersById.get(user.parent_id);
        map.set(user.id, {
          label: 'Inherited',
          displayLabel: `Included via PO${parent ? ` — ${parent.name}` : ''}`,
          matchesCurrentMode: userLevelMode === 'po_sk',
          isInherited: true,
          isDisabledInCurrentMode: true,
        });
        continue;
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
  }, [baselineSet, desiredSet, knownUsersById, loadedUsers, userLevelMode]);

  const selectedUserIdsForMode = useMemo(() => {
    if (userLevelMode === 'po_sk') {
      return desiredUserIds.filter(
        (id) => knownUsersById.get(id)?.role === 'PO',
      );
    }
    return desiredUserIds.filter((id) => {
      const user = knownUsersById.get(id);
      if (!user || user.role !== 'SK') return false;
      if (user.parent_id !== null && desiredSet.has(user.parent_id)) {
        return false;
      }
      return true;
    });
  }, [desiredSet, desiredUserIds, knownUsersById, userLevelMode]);

  const retryUsers = () => {
    setLoadedUsers([]);
    setUsersOffset(0);
    void loadUsersPage(0, false);
  };

  const retryDistrictsAndUpazilas = () => {
    void triggerDistricts();
    setLoadedUpazilas([]);
    setUpazilasOffset(0);
    void loadUpazilasPage(0, false);
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrictId(value === '' ? null : Number(value));
    setSelectedUpazilaId(null);
  };

  const addUsersToDesired = (ids: number[]) => {
    setDesiredUserIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const removeUsersFromDesired = (ids: number[]) => {
    const remove = new Set(ids);
    setDesiredUserIds((prev) => prev.filter((id) => !remove.has(id)));
  };

  const childIdsForPo = (poId: number): number[] => {
    const fromKnown = Array.from(knownUsersById.values())
      .filter((user) => user.parent_id === poId)
      .map((user) => user.id);
    return fromKnown;
  };

  const handleToggleUser = (userId: number) => {
    const status = userAssignmentStatus.get(userId);
    if (status?.isDisabledInCurrentMode) return;

    const user = knownUsersById.get(userId);
    if (!user) return;

    if (desiredSet.has(userId)) {
      if (user.role === 'PO') {
        removeUsersFromDesired([userId, ...childIdsForPo(userId)]);
      } else {
        removeUsersFromDesired([userId]);
      }
      return;
    }

    // PO expand happens on the server at save time.
    addUsersToDesired([userId]);
  };

  const handleSelectAllUsers = () => {
    const selectable = loadedUsers.filter(
      (user) => !userAssignmentStatus.get(user.id)?.isDisabledInCurrentMode,
    );
    const allSelected = selectable.every((user) => desiredSet.has(user.id));
    if (allSelected) {
      const idsToRemove = selectable.flatMap((user) =>
        user.role === 'PO' ? [user.id, ...childIdsForPo(user.id)] : [user.id],
      );
      removeUsersFromDesired(idsToRemove);
      return;
    }
    addUsersToDesired(selectable.map((user) => user.id));
  };

  const handleUpazilaCheckboxChange = (upazilaName: string) => {
    setDesiredUpazilas((prev) =>
      prev.includes(upazilaName)
        ? prev.filter((name) => name !== upazilaName)
        : [...prev, upazilaName],
    );
  };

  const handleSelectAllUpazilas = () => {
    const names = loadedUpazilas.map((upazila) => upazila.name);
    const allSelected = names.every((name) => desiredUpazilaSet.has(name));
    if (allSelected) {
      setDesiredUpazilas((prev) =>
        prev.filter((name) => !names.includes(name)),
      );
      return;
    }
    setDesiredUpazilas((prev) => Array.from(new Set([...prev, ...names])));
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

    try {
      if (activeTab === 'geographical') {
        const addedUpazilas = desiredUpazilas.filter(
          (name) => !baselineUpazilaSet.has(name),
        );
        const removedUpazilas = baselineUpazilas.filter(
          (name) => !desiredUpazilaSet.has(name),
        );
        if (addedUpazilas.length === 0 && removedUpazilas.length === 0) {
          setErrorMsg(
            'Please select at least one upazila or change assignments.',
          );
          return;
        }

        const payload = { upazilas: desiredUpazilas };
        if (target.kind === 'module') {
          await replaceModuleUsers({
            moduleId: target.id,
            ...payload,
          }).unwrap();
        } else {
          await replaceDocumentUsers({
            sourceDocumentId: target.id,
            ...payload,
          }).unwrap();
        }

        finishSuccess(
          'geographical',
          buildGeographicalAssignedEntries(addedUpazilas),
          buildGeographicalAssignedEntries(removedUpazilas),
        );
        return;
      }

      const nextIds = [...desiredUserIds];
      const addedIds = nextIds.filter((id) => !baselineSet.has(id));
      const removedIds = baselineUserIds.filter((id) => !desiredSet.has(id));

      if (addedIds.length === 0 && removedIds.length === 0) {
        setErrorMsg('Please select at least one user or change assignments.');
        return;
      }

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

      const knownList = Array.from(knownUsersById.values());
      if (userLevelMode === 'po_sk') {
        const addedPos = addedIds.filter(
          (id) => knownUsersById.get(id)?.role === 'PO',
        );
        const removedPos = removedIds.filter(
          (id) => knownUsersById.get(id)?.role === 'PO',
        );
        finishSuccess(
          'po_sk',
          buildAssignedUserEntries('po_sk', addedPos, knownList),
          buildAssignedUserEntries('po_sk', removedPos, knownList),
        );
        return;
      }

      finishSuccess(
        'sk',
        buildAssignedUserEntries('sk', addedIds, knownList),
        buildAssignedUserEntries('sk', removedIds, knownList),
      );
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

  const catalogsLoading = loadingDistricts;
  const geoLoading = loadingUpazilas && loadedUpazilas.length === 0;
  const geoError = districtsError || upazilasError;

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
                    setErrorMsg('');
                  }}
                  className="min-w-0 flex-1 whitespace-nowrap"
                  disabled={catalogsLoading}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-2">
                  <span className="text-xs font-semibold text-spice-text-primary">
                    District
                  </span>
                  <Select
                    options={districtOptions}
                    value={
                      selectedDistrictId === null
                        ? ''
                        : String(selectedDistrictId)
                    }
                    onChange={handleDistrictChange}
                    className="w-full"
                    disabled={catalogsLoading || districtsError}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-xs font-semibold text-spice-text-primary">
                    Upazila
                  </span>
                  <Select
                    options={upazilaFilterOptions}
                    value={
                      selectedUpazilaId === null
                        ? ''
                        : String(selectedUpazilaId)
                    }
                    onChange={(value) => {
                      setSelectedUpazilaId(value === '' ? null : Number(value));
                    }}
                    className="w-full"
                    disabled={catalogsLoading}
                  />
                </label>
              </div>

              <UserSelectionList
                title="User"
                users={loadedUsers}
                selectedUserIds={selectedUserIdsForMode}
                userAssignmentStatus={userAssignmentStatus}
                isLoading={loadingUsers && loadedUsers.length === 0}
                isError={usersError}
                isFetching={fetchingUsers}
                hasMore={usersHasMore}
                isLoadingMore={fetchingUsers && loadedUsers.length > 0}
                onLoadMore={() => {
                  void loadUsersPage(usersOffset, true);
                }}
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
                  value={
                    selectedDistrictId === null
                      ? ''
                      : String(selectedDistrictId)
                  }
                  onChange={handleDistrictChange}
                  className="w-full"
                  disabled={catalogsLoading || fetchingDistricts}
                />
              </label>

              <div className="overflow-hidden rounded-lg border border-spice-border">
                <div className="flex items-center justify-between border-b border-spice-border bg-spice-bg-tint px-3 py-2 text-xs font-semibold text-spice-text-medium">
                  <div className="flex items-center gap-1.5">
                    <span>Upazila</span>
                    {geoError ? (
                      <FetchRetryButton
                        label="Retry loading upazilas"
                        onRetry={retryDistrictsAndUpazilas}
                        disabled={fetchingUpazilas || fetchingDistricts}
                      />
                    ) : null}
                  </div>
                  {loadedUpazilas.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleSelectAllUpazilas}
                      className="text-spice-brand-primary hover:underline"
                    >
                      {loadedUpazilas.every((upazila) =>
                        desiredUpazilaSet.has(upazila.name),
                      )
                        ? 'Deselect loaded'
                        : 'Select loaded'}
                    </button>
                  ) : null}
                </div>

                <InfiniteScrollContainer
                  className="max-h-[20vh]"
                  hasMore={!geoLoading && !geoError && upazilasHasMore}
                  onLoadMore={() => {
                    void loadUpazilasPage(upazilasOffset, true);
                  }}
                  loadedCount={loadedUpazilas.length}
                  isLoadingMore={fetchingUpazilas && loadedUpazilas.length > 0}
                  disabled={geoLoading || Boolean(geoError)}
                >
                  {geoLoading ? (
                    <div className="p-4 text-center text-sm text-spice-text-muted">
                      Loading upazilas…
                    </div>
                  ) : geoError ? (
                    <div className="p-4 text-center text-sm text-spice-text-muted">
                      Failed to load upazilas.
                    </div>
                  ) : loadedUpazilas.length === 0 ? (
                    <div className="p-4 text-center text-sm text-spice-text-muted">
                      No upazilas found.
                    </div>
                  ) : (
                    <div className="divide-y divide-spice-border">
                      {loadedUpazilas.map((upazila) => {
                        const isChecked = desiredUpazilaSet.has(upazila.name);
                        const isAlreadyAssigned = baselineUpazilaSet.has(
                          upazila.name,
                        );

                        return (
                          <label
                            key={upazila.id}
                            className="flex cursor-pointer items-center justify-between px-3 py-2.5 hover:bg-spice-bg-tint/30"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-spice-text-primary">
                                {upazila.name}
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
                                handleUpazilaCheckboxChange(upazila.name)
                              }
                              className="h-4 w-4 rounded border-spice-border text-spice-brand-primary focus:ring-spice-brand-primary/25"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </InfiniteScrollContainer>
              </div>

              <p className="text-xs leading-relaxed text-spice-text-muted">
                Assign this {noun} to all users in the selected upazila(s). Save
                sends upazila names; the server expands them to assignees.
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
