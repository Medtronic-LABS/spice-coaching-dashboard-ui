import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RefreshIcon } from '@/assets/icon';
import {
  Button,
  Card,
  Combobox,
  CircularSpinner,
  FormLabel,
  InfiniteScrollContainer,
  Loader,
  Modal,
  ModalActionBar,
  ModalTitle,
  SearchInput,
  Select,
  Tabs,
  TruncatedText,
  useSnackbar,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import { SPICE_CHECKBOX_CLASSNAME } from '@/constants/formControls';
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
  useCreateAssignmentMutation,
  useReplaceModuleAssignedUsersMutation,
} from '@/features/modules/api/adminAssignmentApi';
import {
  useLazyFetchDocumentAssignedUsersQuery,
  useCreateDocumentAssignmentMutation,
  useReplaceDocumentAssignedUsersMutation,
} from '@/features/ingest/api/adminDocumentAssignmentApi';
import { AssignmentGeoDistrictHierarchy } from '@/features/modules/components/AssignmentGeoDistrictHierarchy';
import {
  buildFlatAssignedUserEntries,
  countAssignedUsers,
  type AssignedUserEntry,
} from '@/features/modules/utils/assignmentDisplay';
import { formatAssignmentUserLocation } from '@/features/modules/utils/mapHierarchyUsersToAdminUsers';
import {
  ALL_DIVISIONS_OPTION,
  ALL_DISTRICTS_OPTION,
  ALL_UPAZILAS_OPTION,
  ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  buildAssignmentListUsers,
  buildNamedEntityComboboxOptions,
  buildReplaceAssignmentUserIds,
  getUserLevelEmptyMessage,
  hasAssignmentUserFilters,
  hierarchyRoleForMode,
  idsToAddWhenSelectingPo,
  idsToRemoveWhenClearingPo,
  mergeNamedEntityPages,
  resolveNamedEntitySelection,
  shouldShowGeoCatalogRefresh,
  canRefreshUpazilaCatalog,
  type AssignmentUserLevelMode,
} from '@/features/modules/utils/assignmentDialogHelpers';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  buildAssignmentSuccessLocationState,
  type AssignmentSuccessLocationState,
} from '@/features/modules/types/assignmentSuccessNavigation.types';
import { AssignmentSuccessModal } from '@/features/modules/components/AssignmentSuccessModal';
import { cn } from '@/utils';

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

interface GeoCatalogRefreshButtonProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

/** Matches admin-dashboard widget refresh control styling. */
function GeoCatalogRefreshButton({
  onRefresh,
  isRefreshing = false,
}: GeoCatalogRefreshButtonProps) {
  const { t } = useTranslation();
  const label = t('common.refresh');

  return (
    <Button
      variant="secondary"
      size="iconMd"
      className="shrink-0"
      onClick={onRefresh}
      aria-label={label}
      title={label}
      disabled={isRefreshing}
    >
      <RefreshIcon className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
    </Button>
  );
}

interface GeoFilterFieldProps {
  label: string;
  showRefresh: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  children: ReactNode;
}

function GeoFilterField({
  label,
  showRefresh,
  onRefresh,
  isRefreshing,
  children,
}: GeoFilterFieldProps) {
  return (
    <div className="min-w-0 space-y-1.5">
      <FormLabel className="block leading-5">{label}</FormLabel>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        {showRefresh ? (
          <GeoCatalogRefreshButton
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />
        ) : null}
      </div>
    </div>
  );
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
  errorMessage?: string;
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
  errorMessage = 'Failed to load users. Please try again.',
}: UserSelectionListProps) {
  const { t } = useTranslation();
  const allSelected =
    users.length > 0 && users.every((user) => desiredUserIds.includes(user.id));

  return (
    <div className="overflow-hidden rounded-lg border border-spice-border">
      <div className="flex items-center justify-between border-b border-spice-border bg-spice-bg-tint px-3 py-2 text-xs font-semibold text-spice-text-medium">
        <span>{title}</span>
        {users.length > 0 && !allSelected && !isError ? (
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
          <div
            className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-sm text-spice-text-muted"
            role="status"
            aria-live="polite"
            aria-label="Loading users"
          >
            <CircularSpinner className="h-8 w-8 text-spice-brand-primary" />
            <span>Loading users…</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
            <p className="text-sm text-spice-text-muted">{errorMessage}</p>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={onRetry}
              disabled={isFetching}
            >
              <RefreshIcon
                className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')}
                aria-hidden="true"
              />
              {t('adminDashboard.widgetError.retry')}
            </Button>
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
                    className={SPICE_CHECKBOX_CLASSNAME}
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
  const snackbar = useSnackbar();
  const noun = entityNoun(target);
  const [successState, setSuccessState] =
    useState<AssignmentSuccessLocationState | null>(null);

  useEffect(() => {
    if (!open) {
      setSuccessState(null);
    }
  }, [open]);

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
  const [divisionsCatalogPending, setDivisionsCatalogPending] = useState(false);
  const [districtsCatalogPending, setDistrictsCatalogPending] = useState(false);
  const [filterUpazilasCatalogPending, setFilterUpazilasCatalogPending] =
    useState(false);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const debouncedUserSearchQuery = useDebouncedValue(
    userSearchQuery,
    ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  );
  const [desiredUserIds, setDesiredUserIds] = useState<number[]>([]);
  const [baselineUserIds, setBaselineUserIds] = useState<number[]>([]);
  const [loadedUsers, setLoadedUsers] = useState<AdminUser[]>([]);
  const [poChildUsers, setPoChildUsers] = useState<AdminUser[]>([]);
  const [geoKnownUsers, setGeoKnownUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersOffset, setUsersOffset] = useState(0);

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
  const [createModuleAssignment, { isLoading: isCreatingModule }] =
    useCreateAssignmentMutation();
  const [replaceModuleUsers, { isLoading: isReplacingModule }] =
    useReplaceModuleAssignedUsersMutation();

  const [triggerDocumentAssignedUsers, { data: documentAssignedUsers }] =
    useLazyFetchDocumentAssignedUsersQuery();
  const [createDocumentAssignment, { isLoading: isCreatingDocument }] =
    useCreateDocumentAssignmentMutation();
  const [replaceDocumentUsers, { isLoading: isReplacingDocument }] =
    useReplaceDocumentAssignedUsersMutation();

  const isSubmitting =
    isCreatingModule ||
    isReplacingModule ||
    isCreatingDocument ||
    isReplacingDocument;
  const desiredSet = useMemo(() => new Set(desiredUserIds), [desiredUserIds]);
  const baselineSet = useMemo(
    () => new Set(baselineUserIds),
    [baselineUserIds],
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
    for (const user of geoKnownUsers) map.set(user.id, user);
    return map;
  }, [assignedUsersForTarget, geoKnownUsers, loadedUsers, poChildUsers]);

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
      if (!append) {
        setDivisionsCatalogPending(true);
      }
      try {
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
          mergeNamedEntityPages(prev, page.divisions, append),
        );
      } finally {
        if (!append && requestSeq === divisionsRequestSeqRef.current) {
          setDivisionsCatalogPending(false);
        }
      }
    },
    [debouncedDivisionSearchQuery, triggerDivisionsPage],
  );

  const loadDistrictsPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestSeq = append
        ? districtsRequestSeqRef.current
        : ++districtsRequestSeqRef.current;
      if (!append) {
        setDistrictsCatalogPending(true);
      }
      try {
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
          mergeNamedEntityPages(prev, page.districts, append),
        );
      } finally {
        if (!append && requestSeq === districtsRequestSeqRef.current) {
          setDistrictsCatalogPending(false);
        }
      }
    },
    [debouncedDistrictSearchQuery, selectedDivisionId, triggerDistrictsPage],
  );

  const loadFilterUpazilasPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestSeq = append
        ? filterUpazilasRequestSeqRef.current
        : ++filterUpazilasRequestSeqRef.current;
      if (!append) {
        setFilterUpazilasCatalogPending(true);
      }
      try {
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
          mergeNamedEntityPages(prev, page.upazilas, append),
        );
      } finally {
        if (!append && requestSeq === filterUpazilasRequestSeqRef.current) {
          setFilterUpazilasCatalogPending(false);
        }
      }
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

  const resetFilterUpazilaState = useCallback(() => {
    setFilterUpazilasCatalogPending(true);
    setSelectedUpazilaId(null);
    setSelectedUpazilaName('');
    setFilterUpazilaSearchQuery('');
    setFilterLoadedUpazilas([]);
    setFilterUpazilasTotal(0);
    setFilterUpazilasOffset(0);
  }, []);

  const resetDistrictAndBelow = useCallback(() => {
    setDistrictsCatalogPending(true);
    setFilterUpazilasCatalogPending(true);
    setSelectedDistrictId(null);
    setSelectedDistrictName('');
    setDistrictSearchQuery('');
    setLoadedDistricts([]);
    setDistrictsTotal(0);
    setDistrictsOffset(0);
    resetFilterUpazilaState();
  }, [resetFilterUpazilaState]);

  const resetGeographyFilters = useCallback(() => {
    setDivisionsCatalogPending(true);
    setDistrictsCatalogPending(true);
    setFilterUpazilasCatalogPending(true);
    setSelectedDivisionId(null);
    setSelectedDivisionName('');
    setDivisionSearchQuery('');
    setLoadedDivisions([]);
    setDivisionsTotal(0);
    setDivisionsOffset(0);
    resetDistrictAndBelow();
  }, [resetDistrictAndBelow]);

  const handleAssignmentTabChange = (value: string) => {
    const nextTab = value as AssignmentTab;
    if (nextTab === activeTab) return;
    resetGeographyFilters();
    setActiveTab(nextTab);
    void loadDivisionsPage(0, false);
    if (nextTab === 'user') {
      void loadDistrictsPage(0, false);
    }
  };

  const targetId = target.id;
  const targetKind = target.kind;

  const loadUsersPageRef = useRef(loadUsersPage);
  loadUsersPageRef.current = loadUsersPage;
  const resetGeographyFiltersRef = useRef(resetGeographyFilters);
  resetGeographyFiltersRef.current = resetGeographyFilters;
  const triggerModuleAssignedUsersRef = useRef(triggerModuleAssignedUsers);
  triggerModuleAssignedUsersRef.current = triggerModuleAssignedUsers;
  const triggerDocumentAssignedUsersRef = useRef(triggerDocumentAssignedUsers);
  triggerDocumentAssignedUsersRef.current = triggerDocumentAssignedUsers;

  const initializeAssignmentSession = useCallback(() => {
    setActiveTab('user');
    setUserLevelMode('po_sk');
    resetGeographyFiltersRef.current();
    setUserSearchQuery('');
    setLoadedUsers([]);
    setPoChildUsers([]);
    setUsersTotal(0);
    setUsersOffset(0);
    setBaselineUserIds([]);
    setDesiredUserIds([]);
    setGeoKnownUsers([]);

    const applyAssignedUsers = (users: AdminUser[]) => {
      const ids = users.map((user) => user.id);
      setBaselineUserIds(ids);
      setDesiredUserIds(ids);
      setGeoKnownUsers(users);
    };

    if (targetKind === 'module') {
      void triggerModuleAssignedUsersRef.current(targetId).then((result) => {
        if ('data' in result && result.data) {
          applyAssignedUsers(result.data);
        }
      });
    } else {
      void triggerDocumentAssignedUsersRef.current(targetId).then((result) => {
        if ('data' in result && result.data) {
          applyAssignedUsers(result.data);
        }
      });
    }

    // Always reload the hierarchy list. "Assign to more" keeps `open` true, so the
    // usersListQueryKey effect may not re-run on its own.
    void loadUsersPageRef.current(0, false);
  }, [targetId, targetKind]);

  useEffect(() => {
    if (!open) return;
    initializeAssignmentSession();
  }, [initializeAssignmentSession, open]);

  useEffect(() => {
    if (!open) return;
    void loadDivisionsPage(0, false);
  }, [loadDivisionsPage, open]);

  useEffect(() => {
    if (!open) return;
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
    setDivisionsCatalogPending(true);
    setLoadedDivisions([]);
    setDivisionsOffset(0);
    void loadDivisionsPage(0, false);
  };

  const retryDistricts = () => {
    setDistrictsCatalogPending(true);
    setLoadedDistricts([]);
    setDistrictsOffset(0);
    void loadDistrictsPage(0, false);
  };

  const retryFilterUpazilas = () => {
    setFilterUpazilasCatalogPending(true);
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

  const mergeGeoKnownUsers = (users: AdminUser[]) => {
    if (users.length === 0) return;
    setGeoKnownUsers((prev) => {
      const map = new Map(prev.map((user) => [user.id, user]));
      for (const user of users) map.set(user.id, user);
      return Array.from(map.values());
    });
  };

  const handleGeoAddUserIds = (userIds: number[], users: AdminUser[]) => {
    mergeGeoKnownUsers(users);
    addUsersToDesired(userIds);
  };

  const handleGeoRemoveUserIds = (userIds: number[]) => {
    removeUsersFromDesired(userIds);
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

  const finishSuccess = (
    assignmentType: AssignmentSummaryType | undefined,
    assignedUsers: AssignedUserEntry[],
    removedUsers: AssignedUserEntry[],
  ) => {
    const nextState = buildAssignmentSuccessLocationState(target, {
      ...(assignmentType ? { assignmentType } : {}),
      assignedCount: countAssignedUsers(assignedUsers),
      assignedUsers,
      removedUsers,
      assignedAt: new Date().toISOString(),
    });

    if (target.kind === 'sourceDocument') {
      setSuccessState(nextState);
      return;
    }

    onClose();
    navigate(paths.moduleAssigned, { state: nextState });
  };

  const handleAssign = async () => {
    try {
      const nextIds = buildReplaceAssignmentUserIds(desiredUserIds);
      const addedIds = nextIds.filter((id) => !baselineSet.has(id));
      const removedIds = baselineUserIds.filter((id) => !desiredSet.has(id));

      if (addedIds.length === 0 && removedIds.length === 0) {
        snackbar.showError(
          activeTab === 'geographical'
            ? 'Please select at least one geography or change assignments.'
            : 'Please select at least one user or change assignments.',
        );
        return;
      }

      if (removedIds.length > 0) {
        // Removals require full replace; POST create is additive only.
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
      } else if (target.kind === 'module') {
        await createModuleAssignment({
          module_id: target.id,
          user_ids: addedIds,
          expand_po_assignees: false,
        }).unwrap();
      } else {
        await createDocumentAssignment({
          source_document_id: target.id,
          user_ids: addedIds,
          expand_po_assignees: false,
        }).unwrap();
      }

      const knownList = Array.from(knownUsersById.values());
      finishSuccess(
        undefined,
        buildFlatAssignedUserEntries(addedIds, knownList),
        buildFlatAssignedUserEntries(removedIds, knownList),
      );
    } catch (err: unknown) {
      console.error(err);
      const detail =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data?: { detail?: string } }).data?.detail
          : undefined;
      snackbar.showError(
        detail || `An error occurred while creating ${noun} assignment.`,
      );
    }
  };

  if (!open && !successState) return null;

  if (successState && target.kind === 'sourceDocument') {
    return (
      <AssignmentSuccessModal
        open
        state={successState}
        onClose={() => {
          setSuccessState(null);
          onClose();
        }}
        onAssignMore={() => {
          setSuccessState(null);
          initializeAssignmentSession();
        }}
      />
    );
  }

  if (!open) return null;

  const divisionsCatalogLoading =
    (loadingDivisions || fetchingDivisions) && loadedDivisions.length === 0;
  const districtsCatalogLoading =
    (loadingDistricts || fetchingDistricts) && loadedDistricts.length === 0;
  const filterUpazilasCatalogLoading =
    (loadingFilterUpazilas || fetchingFilterUpazilas) &&
    filterLoadedUpazilas.length === 0;
  const catalogsLoading =
    divisionsCatalogLoading ||
    districtsCatalogLoading ||
    filterUpazilasCatalogLoading;
  const anyGeoCatalogLoading =
    loadingDivisions ||
    fetchingDivisions ||
    loadingDistricts ||
    fetchingDistricts ||
    loadingFilterUpazilas ||
    fetchingFilterUpazilas;
  const showDivisionsRefresh = shouldShowGeoCatalogRefresh({
    loadedCount: loadedDivisions.length,
    catalogLoading: divisionsCatalogLoading,
    isError: divisionsError,
    anyGeoLoading: anyGeoCatalogLoading,
    catalogPending: divisionsCatalogPending,
  });
  const showDistrictsRefresh = shouldShowGeoCatalogRefresh({
    loadedCount: loadedDistricts.length,
    catalogLoading: districtsCatalogLoading,
    isError: districtsError,
    anyGeoLoading: anyGeoCatalogLoading,
    catalogPending: districtsCatalogPending,
  });
  const showFilterUpazilasRefresh =
    canRefreshUpazilaCatalog({
      selectedDivisionId,
      selectedDistrictId,
    }) &&
    shouldShowGeoCatalogRefresh({
      loadedCount: filterLoadedUpazilas.length,
      catalogLoading: filterUpazilasCatalogLoading,
      isError: filterUpazilasError,
      anyGeoLoading: anyGeoCatalogLoading,
      catalogPending: filterUpazilasCatalogPending,
    });

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
      isLoading={divisionsCatalogLoading}
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
      isLoading={districtsCatalogLoading}
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
    <Modal
      open={open}
      labelledBy="assignment-dialog-title"
      onClose={onClose}
      contentClassName="max-w-2xl"
    >
      <Loader open={isSubmitting} label={`Assigning ${noun}…`} />
      <Card
        variant="elevated"
        className="w-full space-y-4 border-spice-border p-4 pr-12 shadow-lg sm:p-6 sm:pr-14"
      >
        <div className="min-w-0 pr-10">
          <ModalTitle id="assignment-dialog-title" className="sm:text-xl">
            Assign {noun}
          </ModalTitle>
          <p className="mt-1 min-w-0">
            <TruncatedText
              text={target.title}
              className="text-xs text-spice-text-muted"
            />
          </p>
        </div>

        <Tabs
          items={ASSIGNMENT_TABS}
          value={activeTab}
          onChange={handleAssignmentTabChange}
        />

        <div className="max-h-[50vh] space-y-4 overflow-y-auto p-2">
          {activeTab === 'user' ? (
            <>
              <label className="flex items-center gap-3">
                <FormLabel className="shrink-0">Role</FormLabel>
                <Select
                  options={USER_LEVEL_MODE_OPTIONS}
                  value={userLevelMode}
                  onChange={(value) => {
                    setUserLevelMode(value as AssignmentUserLevelMode);
                  }}
                  className="min-w-0 flex-1"
                  triggerClassName="rounded-lg"
                  aria-label="Role"
                  disabled={catalogsLoading}
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-start">
                <GeoFilterField
                  label="Division"
                  showRefresh={showDivisionsRefresh}
                  onRefresh={retryDivisions}
                  isRefreshing={fetchingDivisions}
                >
                  {renderDivisionCombobox(
                    'assignment-division-filter-combobox',
                  )}
                </GeoFilterField>
                <GeoFilterField
                  label="District"
                  showRefresh={showDistrictsRefresh}
                  onRefresh={retryDistricts}
                  isRefreshing={fetchingDistricts}
                >
                  {renderDistrictCombobox(
                    'assignment-district-filter-combobox',
                  )}
                </GeoFilterField>
                <GeoFilterField
                  label="Upazila"
                  showRefresh={showFilterUpazilasRefresh}
                  onRefresh={retryFilterUpazilas}
                  isRefreshing={fetchingFilterUpazilas}
                >
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
                    isLoading={filterUpazilasCatalogLoading}
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
                </GeoFilterField>
              </div>

              <label className="block space-y-2">
                <FormLabel>Search users</FormLabel>
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
                isLoading={
                  (loadingUsers || fetchingUsers) && loadedUsers.length === 0
                }
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
              <GeoFilterField
                label="Division"
                showRefresh={showDivisionsRefresh}
                onRefresh={retryDivisions}
                isRefreshing={fetchingDivisions}
              >
                {renderDivisionCombobox('assignment-geo-division-combobox')}
              </GeoFilterField>

              <AssignmentGeoDistrictHierarchy
                divisionId={selectedDivisionId}
                desiredUserIds={desiredSet}
                baselineUserIds={baselineSet}
                onAddUserIds={handleGeoAddUserIds}
                onRemoveUserIds={handleGeoRemoveUserIds}
              />
            </>
          ) : null}
        </div>

        <ModalActionBar
          className="px-0 pb-0 pt-2"
          confirmLabel={`Assign ${noun}`}
          confirmingLabel="Assigning…"
          isConfirming={isSubmitting}
          onCancel={onClose}
          onConfirm={() => void handleAssign()}
        />
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
