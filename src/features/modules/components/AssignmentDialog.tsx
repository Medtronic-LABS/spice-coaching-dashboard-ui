import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banner,
  Button,
  Card,
  Combobox,
  InfiniteScrollContainer,
  Loader,
  Modal,
  SearchInput,
  Select,
  Tabs,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  ASSIGNMENT_LIST_PAGE_SIZE,
  ASSIGNMENT_USERS_PAGE_SIZE,
  type AdminDistrict,
  type AdminDivision,
  type AdminUpazila,
  type AdminUser,
  type AssignmentSummaryType,
  useLazyFetchAdminDistrictsPageQuery,
  useLazyFetchAdminDivisionsPageQuery,
  useLazyFetchAdminUpazilasPageQuery,
  useLazyFetchHierarchyUsersPageQuery,
  useLazyFetchModuleAssignedUsersQuery,
  useReplaceModuleAssignedUsersMutation,
} from '@/features/modules/api/adminAssignmentApi';
import {
  useLazyFetchDocumentAssignedUsersQuery,
  useReplaceDocumentAssignedUsersMutation,
} from '@/features/ingest/api/adminDocumentAssignmentApi';
import { AssignmentGeoDistrictHierarchy } from '@/features/modules/components/AssignmentGeoDistrictHierarchy';
import {
  buildFlatAssignedUserEntries,
  buildGeographicalAssignedEntries,
  countAssignedUsers,
  type AssignedUserEntry,
} from '@/features/modules/utils/assignmentDisplay';
import { formatAssignmentUserLocation } from '@/features/modules/utils/mapHierarchyUsersToAdminUsers';
import {
  ALL_DIVISIONS_OPTION,
  ALL_DISTRICTS_OPTION,
  ALL_UPAZILAS_OPTION,
  ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  baselineUpazilaNames,
  buildAssignmentListUsers,
  buildNamedEntityComboboxOptions,
  buildReplaceAssignmentUserIds,
  getUserLevelEmptyMessage,
  hasAssignmentUserFilters,
  hierarchyRoleForMode,
  idsToAddWhenSelectingPo,
  idsToRemoveWhenClearingPo,
  resolveNamedEntitySelection,
  toggleNamesInSelection,
  type AssignmentUserLevelMode,
} from '@/features/modules/utils/assignmentDialogHelpers';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { buildAssignmentSuccessLocationState } from '@/features/modules/types/assignmentSuccessNavigation.types';

type AssignmentTab = 'user' | 'geographical';

export type AssignmentDialogTarget =
  | { kind: 'module'; id: string; title: string }
  | {
      kind: 'sourceDocument';
      id: string;
      title: string;
      noun: 'video' | 'document';
    };

const USER_LEVEL_MODE_OPTIONS: Array<{
  label: string;
  value: AssignmentUserLevelMode;
}> = [
  { label: 'PO and SK', value: 'po_sk' },
  { label: 'PO only', value: 'po' },
  { label: 'SK only', value: 'sk' },
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
}

function entityNoun(target: AssignmentDialogTarget): string {
  if (target.kind === 'module') return 'module';
  return target.noun;
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
  desiredUserIds: number[];
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
  desiredUserIds,
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
  const allSelected =
    users.length > 0 && users.every((user) => desiredUserIds.includes(user.id));

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
        {users.length > 0 && !allSelected ? (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-spice-brand-primary hover:underline"
          >
            Select all
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
              const isChecked = desiredUserIds.includes(user.id);
              const locationLabel = formatAssignmentUserLocation(user);

              return (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 hover:bg-spice-bg-tint/30"
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
                          status.matchesCurrentMode
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
}: AssignmentDialogProps) => {
  const navigate = useNavigate();
  const noun = entityNoun(target);
  const [activeTab, setActiveTab] = useState<AssignmentTab>('user');
  const [userLevelMode, setUserLevelMode] =
    useState<AssignmentUserLevelMode>('po_sk');
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(
    null,
  );
  const [selectedDivisionName, setSelectedDivisionName] = useState('');
  const [divisionSearchQuery, setDivisionSearchQuery] = useState('');
  const debouncedDivisionSearchQuery = useDebouncedValue(
    divisionSearchQuery,
    ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  );
  const [loadedDivisions, setLoadedDivisions] = useState<AdminDivision[]>([]);
  const [divisionsTotal, setDivisionsTotal] = useState(0);
  const [divisionsOffset, setDivisionsOffset] = useState(0);

  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
    null,
  );
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [districtSearchQuery, setDistrictSearchQuery] = useState('');
  const debouncedDistrictSearchQuery = useDebouncedValue(
    districtSearchQuery,
    ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  );
  const [loadedDistricts, setLoadedDistricts] = useState<AdminDistrict[]>([]);
  const [districtsTotal, setDistrictsTotal] = useState(0);
  const [districtsOffset, setDistrictsOffset] = useState(0);

  const [selectedUpazilaId, setSelectedUpazilaId] = useState<number | null>(
    null,
  );
  const [selectedUpazilaName, setSelectedUpazilaName] = useState('');
  const [filterUpazilaSearchQuery, setFilterUpazilaSearchQuery] = useState('');
  const debouncedFilterUpazilaSearchQuery = useDebouncedValue(
    filterUpazilaSearchQuery,
    ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  );
  const [filterLoadedUpazilas, setFilterLoadedUpazilas] = useState<
    AdminUpazila[]
  >([]);
  const [filterUpazilasTotal, setFilterUpazilasTotal] = useState(0);
  const [filterUpazilasOffset, setFilterUpazilasOffset] = useState(0);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const debouncedUserSearchQuery = useDebouncedValue(
    userSearchQuery,
    ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  );
  const [desiredUserIds, setDesiredUserIds] = useState<number[]>([]);
  const [baselineUserIds, setBaselineUserIds] = useState<number[]>([]);
  const [desiredUpazilas, setDesiredUpazilas] = useState<string[]>([]);
  const [baselineUpazilas, setBaselineUpazilas] = useState<string[]>([]);
  const [loadedUsers, setLoadedUsers] = useState<AdminUser[]>([]);
  const [poChildUsers, setPoChildUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersOffset, setUsersOffset] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const divisionsRequestSeqRef = useRef(0);
  const districtsRequestSeqRef = useRef(0);
  const filterUpazilasRequestSeqRef = useRef(0);
  const usersRequestSeqRef = useRef(0);

  const usersFetchRole = hierarchyRoleForMode(userLevelMode);
  const usersListQueryKey = [
    usersFetchRole,
    selectedDivisionId ?? '',
    selectedDistrictId ?? '',
    selectedUpazilaId ?? '',
    debouncedUserSearchQuery.trim(),
  ].join('|');

  const [
    triggerDivisionsPage,
    {
      isLoading: loadingDivisions,
      isError: divisionsError,
      isFetching: fetchingDivisions,
    },
  ] = useLazyFetchAdminDivisionsPageQuery();

  const [
    triggerDistrictsPage,
    {
      isLoading: loadingDistricts,
      isError: districtsError,
      isFetching: fetchingDistricts,
    },
  ] = useLazyFetchAdminDistrictsPageQuery();

  const [
    triggerUsersPage,
    { isLoading: loadingUsers, isError: usersError, isFetching: fetchingUsers },
  ] = useLazyFetchHierarchyUsersPageQuery();
  // Separate trigger so PO→child SK fetches do not flip the main list loading flags.
  const [triggerChildUsersPage] = useLazyFetchHierarchyUsersPageQuery();

  const [
    triggerFilterUpazilasPage,
    {
      isLoading: loadingFilterUpazilas,
      isError: filterUpazilasError,
      isFetching: fetchingFilterUpazilas,
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
    for (const user of poChildUsers) map.set(user.id, user);
    return map;
  }, [assignedUsersForTarget, loadedUsers, poChildUsers]);

  const filtersActive = hasAssignmentUserFilters({
    divisionId: selectedDivisionId,
    districtId: selectedDistrictId,
    upazilaId: selectedUpazilaId,
    searchQuery: debouncedUserSearchQuery,
  });

  const listUsers = useMemo(
    () =>
      buildAssignmentListUsers(
        userLevelMode,
        loadedUsers,
        assignedUsersForTarget,
        filtersActive,
      ),
    [assignedUsersForTarget, filtersActive, loadedUsers, userLevelMode],
  );

  const divisionComboboxOptions = useMemo(
    () =>
      buildNamedEntityComboboxOptions(
        ALL_DIVISIONS_OPTION,
        loadedDivisions,
        selectedDivisionId,
        selectedDivisionName,
      ),
    [loadedDivisions, selectedDivisionId, selectedDivisionName],
  );

  const districtComboboxOptions = useMemo(
    () =>
      buildNamedEntityComboboxOptions(
        ALL_DISTRICTS_OPTION,
        loadedDistricts,
        selectedDistrictId,
        selectedDistrictName,
      ),
    [loadedDistricts, selectedDistrictId, selectedDistrictName],
  );

  const filterUpazilaComboboxOptions = useMemo(
    () =>
      buildNamedEntityComboboxOptions(
        ALL_UPAZILAS_OPTION,
        filterLoadedUpazilas,
        selectedUpazilaId,
        selectedUpazilaName,
      ),
    [filterLoadedUpazilas, selectedUpazilaId, selectedUpazilaName],
  );

  const usersHasMore = loadedUsers.length < usersTotal;
  const divisionsHasMore = loadedDivisions.length < divisionsTotal;
  const districtsHasMore = loadedDistricts.length < districtsTotal;
  const filterUpazilasHasMore =
    filterLoadedUpazilas.length < filterUpazilasTotal;

  const loadDivisionsPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestSeq = append
        ? divisionsRequestSeqRef.current
        : ++divisionsRequestSeqRef.current;
      const nameQuery = debouncedDivisionSearchQuery.trim();
      const result = await triggerDivisionsPage({
        limit: ASSIGNMENT_LIST_PAGE_SIZE,
        offset,
        ...(nameQuery ? { q: nameQuery } : {}),
      });
      if (requestSeq !== divisionsRequestSeqRef.current) return;
      if ('error' in result && result.error) return;
      const page = result.data;
      if (!page) return;
      setDivisionsTotal(page.total);
      setDivisionsOffset(page.offset + page.divisions.length);
      setLoadedDivisions((prev) =>
        append ? [...prev, ...page.divisions] : page.divisions,
      );
    },
    [debouncedDivisionSearchQuery, triggerDivisionsPage],
  );

  const loadDistrictsPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestSeq = append
        ? districtsRequestSeqRef.current
        : ++districtsRequestSeqRef.current;
      const nameQuery = debouncedDistrictSearchQuery.trim();
      const result = await triggerDistrictsPage({
        limit: ASSIGNMENT_LIST_PAGE_SIZE,
        offset,
        ...(selectedDivisionId !== null
          ? { divisionId: selectedDivisionId }
          : {}),
        ...(nameQuery ? { q: nameQuery } : {}),
      });
      if (requestSeq !== districtsRequestSeqRef.current) return;
      if ('error' in result && result.error) return;
      const page = result.data;
      if (!page) return;
      setDistrictsTotal(page.total);
      setDistrictsOffset(page.offset + page.districts.length);
      setLoadedDistricts((prev) =>
        append ? [...prev, ...page.districts] : page.districts,
      );
    },
    [debouncedDistrictSearchQuery, selectedDivisionId, triggerDistrictsPage],
  );

  const loadFilterUpazilasPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestSeq = append
        ? filterUpazilasRequestSeqRef.current
        : ++filterUpazilasRequestSeqRef.current;
      const nameQuery = debouncedFilterUpazilaSearchQuery.trim();
      const result = await triggerFilterUpazilasPage({
        limit: ASSIGNMENT_LIST_PAGE_SIZE,
        offset,
        ...(selectedDistrictId !== null
          ? { districtId: selectedDistrictId }
          : {}),
        ...(nameQuery ? { q: nameQuery } : {}),
      });
      if (requestSeq !== filterUpazilasRequestSeqRef.current) return;
      if ('error' in result && result.error) return;
      const page = result.data;
      if (!page) return;
      setFilterUpazilasTotal(page.total);
      setFilterUpazilasOffset(page.offset + page.upazilas.length);
      setFilterLoadedUpazilas((prev) =>
        append ? [...prev, ...page.upazilas] : page.upazilas,
      );
    },
    [
      debouncedFilterUpazilaSearchQuery,
      selectedDistrictId,
      triggerFilterUpazilasPage,
    ],
  );

  const loadUsersPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestSeq = append
        ? usersRequestSeqRef.current
        : ++usersRequestSeqRef.current;
      const nameQuery = debouncedUserSearchQuery.trim();
      const result = await triggerUsersPage({
        limit: ASSIGNMENT_USERS_PAGE_SIZE,
        offset,
        role: usersFetchRole,
        ...(selectedDivisionId !== null
          ? { divisionId: selectedDivisionId }
          : {}),
        ...(selectedDistrictId !== null
          ? { districtId: selectedDistrictId }
          : {}),
        ...(selectedUpazilaId !== null ? { upazilaId: selectedUpazilaId } : {}),
        ...(nameQuery ? { q: nameQuery } : {}),
      });
      if (requestSeq !== usersRequestSeqRef.current) return;
      if ('error' in result && result.error) return;
      const page = result.data;
      if (!page) return;
      setUsersTotal(page.total);
      setUsersOffset(page.offset + page.users.length);
      setLoadedUsers((prev) =>
        append ? [...prev, ...page.users] : page.users,
      );
    },
    [
      debouncedUserSearchQuery,
      selectedDivisionId,
      selectedDistrictId,
      selectedUpazilaId,
      triggerUsersPage,
      usersFetchRole,
    ],
  );

  const resetFilterUpazilaState = () => {
    setSelectedUpazilaId(null);
    setSelectedUpazilaName('');
    setFilterUpazilaSearchQuery('');
    setFilterLoadedUpazilas([]);
    setFilterUpazilasTotal(0);
    setFilterUpazilasOffset(0);
  };

  const resetDistrictAndBelow = () => {
    setSelectedDistrictId(null);
    setSelectedDistrictName('');
    setDistrictSearchQuery('');
    setLoadedDistricts([]);
    setDistrictsTotal(0);
    setDistrictsOffset(0);
    resetFilterUpazilaState();
  };

  useEffect(() => {
    if (!open) return;
    setActiveTab('user');
    setUserLevelMode('po_sk');
    setSelectedDivisionId(null);
    setSelectedDivisionName('');
    setDivisionSearchQuery('');
    setLoadedDivisions([]);
    setDivisionsTotal(0);
    setDivisionsOffset(0);
    setSelectedDistrictId(null);
    setSelectedDistrictName('');
    setDistrictSearchQuery('');
    setLoadedDistricts([]);
    setDistrictsTotal(0);
    setDistrictsOffset(0);
    resetFilterUpazilaState();
    setUserSearchQuery('');
    setErrorMsg('');
    setLoadedUsers([]);
    setPoChildUsers([]);
    setUsersTotal(0);
    setUsersOffset(0);
    setBaselineUserIds([]);
    setDesiredUserIds([]);
    setBaselineUpazilas([]);
    setDesiredUpazilas([]);

    const applyAssignedUsers = (users: AdminUser[]) => {
      const ids = users.map((user) => user.id);
      const upazilas = baselineUpazilaNames(users);
      setBaselineUserIds(ids);
      setDesiredUserIds(ids);
      setBaselineUpazilas(upazilas);
      setDesiredUpazilas(upazilas);
    };

    if (target.kind === 'module') {
      void triggerModuleAssignedUsers(target.id).then((result) => {
        if ('data' in result && result.data) {
          applyAssignedUsers(result.data);
        }
      });
    } else {
      void triggerDocumentAssignedUsers(target.id).then((result) => {
        if ('data' in result && result.data) {
          applyAssignedUsers(result.data);
        }
      });
    }
  }, [open, target, triggerDocumentAssignedUsers, triggerModuleAssignedUsers]);

  useEffect(() => {
    if (!open) return;
    setLoadedDivisions([]);
    setDivisionsTotal(0);
    setDivisionsOffset(0);
    void loadDivisionsPage(0, false);
  }, [loadDivisionsPage, open]);

  useEffect(() => {
    if (!open) return;
    setLoadedDistricts([]);
    setDistrictsTotal(0);
    setDistrictsOffset(0);
    void loadDistrictsPage(0, false);
  }, [loadDistrictsPage, open]);

  useEffect(() => {
    if (!open || activeTab !== 'user') return;
    setLoadedUsers([]);
    setUsersTotal(0);
    setUsersOffset(0);
    void loadUsersPage(0, false);
  }, [activeTab, loadUsersPage, open, usersListQueryKey]);

  useEffect(() => {
    if (!open || activeTab !== 'user') return;
    setFilterLoadedUpazilas([]);
    setFilterUpazilasTotal(0);
    setFilterUpazilasOffset(0);
    void loadFilterUpazilasPage(0, false);
  }, [activeTab, loadFilterUpazilasPage, open, selectedDistrictId]);

  const userAssignmentStatus = useMemo(() => {
    const map = new Map<number, UserAssignmentStatus>();

    for (const user of listUsers) {
      if (baselineSet.has(user.id)) {
        map.set(user.id, {
          label: 'Assigned',
          displayLabel: 'Already assigned',
          matchesCurrentMode: true,
        });
      }
    }
    return map;
  }, [baselineSet, listUsers]);

  const retryUsers = () => {
    setLoadedUsers([]);
    setUsersOffset(0);
    void loadUsersPage(0, false);
  };

  const retryDivisions = () => {
    setLoadedDivisions([]);
    setDivisionsOffset(0);
    void loadDivisionsPage(0, false);
  };

  const retryDistricts = () => {
    setLoadedDistricts([]);
    setDistrictsOffset(0);
    void loadDistrictsPage(0, false);
  };

  const retryFilterUpazilas = () => {
    setFilterLoadedUpazilas([]);
    setFilterUpazilasOffset(0);
    void loadFilterUpazilasPage(0, false);
  };

  const handleDivisionChange = (value: string) => {
    const next = resolveNamedEntitySelection(
      value,
      loadedDivisions,
      selectedDivisionId,
      selectedDivisionName,
    );
    setSelectedDivisionId(next.id);
    setSelectedDivisionName(next.name);
    resetDistrictAndBelow();
  };

  const handleDistrictChange = (value: string) => {
    const next = resolveNamedEntitySelection(
      value,
      loadedDistricts,
      selectedDistrictId,
      selectedDistrictName,
    );
    setSelectedDistrictId(next.id);
    setSelectedDistrictName(next.name);
    resetFilterUpazilaState();
  };

  const handleFilterUpazilaChange = (value: string) => {
    const next = resolveNamedEntitySelection(
      value,
      filterLoadedUpazilas,
      selectedUpazilaId,
      selectedUpazilaName,
    );
    setSelectedUpazilaId(next.id);
    setSelectedUpazilaName(next.name);
  };

  const addUsersToDesired = (ids: number[]) => {
    setDesiredUserIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const removeUsersFromDesired = (ids: number[]) => {
    const remove = new Set(ids);
    setDesiredUserIds((prev) => prev.filter((id) => !remove.has(id)));
  };

  const mergePoChildUsers = (users: AdminUser[]) => {
    if (users.length === 0) return;
    setPoChildUsers((prev) => {
      const map = new Map(prev.map((user) => [user.id, user]));
      for (const user of users) map.set(user.id, user);
      return Array.from(map.values());
    });
  };

  const loadChildSksForPo = async (poId: number): Promise<number[]> => {
    const collected: AdminUser[] = [];
    let offset = 0;
    let total = Number.POSITIVE_INFINITY;

    while (offset < total) {
      const result = await triggerChildUsersPage({
        limit: ASSIGNMENT_USERS_PAGE_SIZE,
        offset,
        role: 'SHASTIYA_KORMI',
        parentId: poId,
      });
      if ('error' in result && result.error) break;
      const page = result.data;
      if (!page) break;
      collected.push(...page.users);
      total = page.total;
      offset += page.users.length;
      if (page.users.length === 0) break;
    }

    mergePoChildUsers(collected);
    return collected.map((user) => user.id);
  };

  const handleToggleUser = (userId: number) => {
    const user = knownUsersById.get(userId);
    if (!user) return;

    if (desiredSet.has(userId)) {
      if (user.role === 'PO') {
        removeUsersFromDesired(
          idsToRemoveWhenClearingPo(userId, knownUsersById, userLevelMode),
        );
      } else {
        removeUsersFromDesired([userId]);
      }
      return;
    }

    if (user.role === 'PO') {
      const immediateIds = idsToAddWhenSelectingPo(
        userId,
        knownUsersById,
        userLevelMode,
      );
      addUsersToDesired(immediateIds);
      if (userLevelMode === 'po_sk') {
        void loadChildSksForPo(userId).then((childIds) => {
          if (childIds.length > 0) addUsersToDesired(childIds);
        });
      }
      return;
    }

    addUsersToDesired([userId]);
  };

  const handleSelectAllUsers = () => {
    const visibleIds = listUsers.map((user) => user.id);
    const allSelected = visibleIds.every((id) => desiredSet.has(id));
    if (allSelected) {
      const idsToRemove = listUsers.flatMap((user) =>
        user.role === 'PO'
          ? idsToRemoveWhenClearingPo(user.id, knownUsersById, userLevelMode)
          : [user.id],
      );
      removeUsersFromDesired(idsToRemove);
      return;
    }

    for (const user of listUsers) {
      if (user.role === 'PO') {
        addUsersToDesired(
          idsToAddWhenSelectingPo(user.id, knownUsersById, userLevelMode),
        );
        if (userLevelMode === 'po_sk') {
          void loadChildSksForPo(user.id).then((childIds) => {
            if (childIds.length > 0) addUsersToDesired(childIds);
          });
        }
      } else {
        addUsersToDesired([user.id]);
      }
    }
  };

  const handleUpazilaCheckboxChange = (upazilaName: string) => {
    setDesiredUpazilas((prev) => toggleNamesInSelection(prev, [upazilaName]));
  };

  const handleToggleUpazilaNames = (names: string[]) => {
    setDesiredUpazilas((prev) => toggleNamesInSelection(prev, names));
  };

  const finishSuccess = (
    assignmentType: AssignmentSummaryType | undefined,
    assignedUsers: AssignedUserEntry[],
    removedUsers: AssignedUserEntry[],
  ) => {
    onClose();
    navigate(paths.moduleAssigned, {
      state: buildAssignmentSuccessLocationState(target, {
        ...(assignmentType ? { assignmentType } : {}),
        assignedCount: countAssignedUsers(assignedUsers),
        assignedUsers,
        removedUsers,
        assignedAt: new Date().toISOString(),
      }),
    });
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

      const nextIds = buildReplaceAssignmentUserIds(desiredUserIds);
      const addedIds = nextIds.filter((id) => !baselineSet.has(id));
      const removedIds = baselineUserIds.filter((id) => !desiredSet.has(id));

      if (addedIds.length === 0 && removedIds.length === 0) {
        setErrorMsg('Please select at least one user or change assignments.');
        return;
      }

      const payload = {
        user_ids: nextIds,
        expand_po_assignees: false,
      };

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

      const knownList = Array.from(knownUsersById.values());
      finishSuccess(
        undefined,
        buildFlatAssignedUserEntries(nextIds, knownList),
        buildFlatAssignedUserEntries(removedIds, knownList),
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

  const catalogsLoading =
    (loadingDivisions && loadedDivisions.length === 0) ||
    (loadingDistricts && loadedDistricts.length === 0) ||
    (loadingFilterUpazilas && filterLoadedUpazilas.length === 0);

  const renderDivisionCombobox = (id: string) => (
    <Combobox
      id={id}
      aria-label="Division"
      value={selectedDivisionId === null ? '' : String(selectedDivisionId)}
      selectedLabel={
        selectedDivisionId === null
          ? ALL_DIVISIONS_OPTION.label
          : selectedDivisionName || ALL_DIVISIONS_OPTION.label
      }
      options={divisionComboboxOptions}
      searchTerm={divisionSearchQuery}
      onSearchTermChange={setDivisionSearchQuery}
      onChange={handleDivisionChange}
      isLoading={loadingDivisions && loadedDivisions.length === 0}
      hint={
        divisionsTotal > 0
          ? `Showing ${loadedDivisions.length} of ${divisionsTotal}`
          : undefined
      }
      placeholder="Type to search divisions…"
      emptyMessage={
        divisionsError ? 'Failed to load divisions.' : 'No divisions found.'
      }
      hasMore={divisionsHasMore}
      onLoadMore={() => {
        void loadDivisionsPage(divisionsOffset, true);
      }}
      isLoadingMore={fetchingDivisions && loadedDivisions.length > 0}
      loadMoreError={divisionsError && loadedDivisions.length > 0}
      onLoadMoreRetry={retryDivisions}
      className="w-full"
    />
  );

  const renderDistrictCombobox = (id: string) => (
    <Combobox
      id={id}
      aria-label="District"
      value={selectedDistrictId === null ? '' : String(selectedDistrictId)}
      selectedLabel={
        selectedDistrictId === null
          ? ALL_DISTRICTS_OPTION.label
          : selectedDistrictName || ALL_DISTRICTS_OPTION.label
      }
      options={districtComboboxOptions}
      searchTerm={districtSearchQuery}
      onSearchTermChange={setDistrictSearchQuery}
      onChange={handleDistrictChange}
      isLoading={loadingDistricts && loadedDistricts.length === 0}
      hint={
        districtsTotal > 0
          ? `Showing ${loadedDistricts.length} of ${districtsTotal}`
          : undefined
      }
      placeholder="Type to search districts…"
      emptyMessage={
        districtsError ? 'Failed to load districts.' : 'No districts found.'
      }
      hasMore={districtsHasMore}
      onLoadMore={() => {
        void loadDistrictsPage(districtsOffset, true);
      }}
      isLoadingMore={fetchingDistricts && loadedDistricts.length > 0}
      loadMoreError={districtsError && loadedDistricts.length > 0}
      onLoadMoreRetry={retryDistricts}
      className="w-full"
    />
  );

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
                    setUserLevelMode(value as AssignmentUserLevelMode);
                    setErrorMsg('');
                  }}
                  className="min-w-0 flex-1 whitespace-nowrap"
                  disabled={catalogsLoading}
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-spice-text-primary">
                      Division
                    </span>
                    {divisionsError ? (
                      <FetchRetryButton
                        label="Retry loading divisions"
                        onRetry={retryDivisions}
                        disabled={fetchingDivisions}
                      />
                    ) : null}
                  </div>
                  {renderDivisionCombobox(
                    'assignment-division-filter-combobox',
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-spice-text-primary">
                      District
                    </span>
                    {districtsError ? (
                      <FetchRetryButton
                        label="Retry loading districts"
                        onRetry={retryDistricts}
                        disabled={fetchingDistricts}
                      />
                    ) : null}
                  </div>
                  {renderDistrictCombobox(
                    'assignment-district-filter-combobox',
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-spice-text-primary">
                      Upazila
                    </span>
                    {filterUpazilasError ? (
                      <FetchRetryButton
                        label="Retry loading upazilas"
                        onRetry={retryFilterUpazilas}
                        disabled={fetchingFilterUpazilas}
                      />
                    ) : null}
                  </div>
                  <Combobox
                    id="assignment-upazila-filter-combobox"
                    aria-label="Upazila"
                    value={
                      selectedUpazilaId === null
                        ? ''
                        : String(selectedUpazilaId)
                    }
                    selectedLabel={
                      selectedUpazilaId === null
                        ? ALL_UPAZILAS_OPTION.label
                        : selectedUpazilaName || ALL_UPAZILAS_OPTION.label
                    }
                    options={filterUpazilaComboboxOptions}
                    searchTerm={filterUpazilaSearchQuery}
                    onSearchTermChange={setFilterUpazilaSearchQuery}
                    onChange={handleFilterUpazilaChange}
                    isLoading={
                      loadingFilterUpazilas && filterLoadedUpazilas.length === 0
                    }
                    hint={
                      filterUpazilasTotal > 0
                        ? `Showing ${filterLoadedUpazilas.length} of ${filterUpazilasTotal}`
                        : undefined
                    }
                    placeholder="Type to search upazilas…"
                    emptyMessage={
                      filterUpazilasError
                        ? 'Failed to load upazilas.'
                        : 'No upazilas found.'
                    }
                    hasMore={filterUpazilasHasMore}
                    onLoadMore={() => {
                      void loadFilterUpazilasPage(filterUpazilasOffset, true);
                    }}
                    isLoadingMore={
                      fetchingFilterUpazilas && filterLoadedUpazilas.length > 0
                    }
                    loadMoreError={
                      filterUpazilasError && filterLoadedUpazilas.length > 0
                    }
                    onLoadMoreRetry={retryFilterUpazilas}
                    className="w-full"
                  />
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Search users
                </span>
                <SearchInput
                  value={userSearchQuery}
                  onChange={setUserSearchQuery}
                  placeholder="Search by name"
                  aria-label="Search users by name"
                  disabled={catalogsLoading}
                  className="sm:min-w-0"
                />
              </label>

              <UserSelectionList
                title="User"
                users={listUsers}
                desiredUserIds={desiredUserIds}
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
            </>
          ) : null}

          {activeTab === 'geographical' ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-spice-text-primary">
                    Division
                  </span>
                  {divisionsError ? (
                    <FetchRetryButton
                      label="Retry loading divisions"
                      onRetry={retryDivisions}
                      disabled={fetchingDivisions}
                    />
                  ) : null}
                </div>
                {renderDivisionCombobox('assignment-geo-division-combobox')}
              </div>

              <AssignmentGeoDistrictHierarchy
                divisionId={selectedDivisionId}
                desiredUpazilaSet={desiredUpazilaSet}
                baselineUpazilaSet={baselineUpazilaSet}
                onToggleUpazila={handleUpazilaCheckboxChange}
                onToggleUpazilaNames={handleToggleUpazilaNames}
              />
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
