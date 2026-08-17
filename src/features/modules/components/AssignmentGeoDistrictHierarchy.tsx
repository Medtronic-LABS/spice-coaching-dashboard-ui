import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronIcon } from '@/assets/icon';
import { InfiniteScrollContainer } from '@/components/ui';
import {
  ASSIGNMENT_LIST_PAGE_SIZE,
  ASSIGNMENT_USERS_PAGE_SIZE,
  type AdminDistrict,
  type AdminUpazila,
  type AdminUser,
  useLazyFetchAdminDistrictsPageQuery,
  useLazyFetchAdminUpazilasPageQuery,
  useLazyFetchHierarchyUsersPageQuery,
} from '@/features/modules/api/adminAssignmentApi';
import { SPICE_CHECKBOX_CLASSNAME } from '@/constants/formControls';
import { cn } from '@/utils';

interface DistrictUpazilaPage {
  items: AdminUpazila[];
  total: number;
  offset: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

interface AssignmentGeoDistrictHierarchyProps {
  divisionId: number | null;
  desiredUserIds: ReadonlySet<number>;
  baselineUserIds: ReadonlySet<number>;
  onAddUserIds: (userIds: number[], users: AdminUser[]) => void;
  onRemoveUserIds: (userIds: number[]) => void;
}

const emptyUpazilaPage = (): DistrictUpazilaPage => ({
  items: [],
  total: 0,
  offset: 0,
  isLoading: false,
  isFetching: false,
  isError: false,
});

function assignableUsers(users: AdminUser[]): AdminUser[] {
  return users.filter((user) => user.role === 'PO' || user.role === 'SK');
}

function selectionStateForUsers(
  users: AdminUser[] | undefined,
  desiredUserIds: ReadonlySet<number>,
): { checked: boolean; indeterminate: boolean; ready: boolean } {
  if (!users || users.length === 0) {
    return { checked: false, indeterminate: false, ready: Boolean(users) };
  }
  const ids = users.map((user) => user.id);
  const selectedCount = ids.filter((id) => desiredUserIds.has(id)).length;
  if (selectedCount === 0) {
    return { checked: false, indeterminate: false, ready: true };
  }
  if (selectedCount === ids.length) {
    return { checked: true, indeterminate: false, ready: true };
  }
  return { checked: false, indeterminate: true, ready: true };
}

function isAlreadyAssignedUpazila(
  users: AdminUser[] | undefined,
  baselineUserIds: ReadonlySet<number>,
): boolean {
  if (!users || users.length === 0) return false;
  return users.every((user) => baselineUserIds.has(user.id));
}

export const AssignmentGeoDistrictHierarchy = ({
  divisionId,
  desiredUserIds,
  baselineUserIds,
  onAddUserIds,
  onRemoveUserIds,
}: AssignmentGeoDistrictHierarchyProps) => {
  const [loadedDistricts, setLoadedDistricts] = useState<AdminDistrict[]>([]);
  const [districtsTotal, setDistrictsTotal] = useState(0);
  const [districtsOffset, setDistrictsOffset] = useState(0);
  const [expandedDistrictIds, setExpandedDistrictIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [upazilaPages, setUpazilaPages] = useState<
    Record<number, DistrictUpazilaPage>
  >({});
  const [usersByUpazilaId, setUsersByUpazilaId] = useState<
    Record<number, AdminUser[]>
  >({});
  const [usersByDistrictId, setUsersByDistrictId] = useState<
    Record<number, AdminUser[]>
  >({});
  const [loadingUpazilaUserIds, setLoadingUpazilaUserIds] = useState<
    Set<number>
  >(() => new Set());
  const [loadingDistrictUserIds, setLoadingDistrictUserIds] = useState<
    Set<number>
  >(() => new Set());
  const [districtToggleLoadingIds, setDistrictToggleLoadingIds] = useState<
    Set<number>
  >(() => new Set());

  const districtsRequestSeqRef = useRef(0);
  const upazilaRequestSeqRef = useRef<Map<number, number>>(new Map());
  const upazilaUsersRequestSeqRef = useRef<Map<number, number>>(new Map());
  const usersByUpazilaIdRef = useRef(usersByUpazilaId);
  usersByUpazilaIdRef.current = usersByUpazilaId;
  const usersByDistrictIdRef = useRef(usersByDistrictId);
  usersByDistrictIdRef.current = usersByDistrictId;
  const districtUsersPromiseRef = useRef<Map<number, Promise<AdminUser[]>>>(
    new Map(),
  );

  const [
    triggerDistrictsPage,
    {
      isLoading: loadingDistricts,
      isError: districtsError,
      isFetching: fetchingDistricts,
    },
  ] = useLazyFetchAdminDistrictsPageQuery();
  const [triggerUpazilasPage] = useLazyFetchAdminUpazilasPageQuery();
  const [triggerUsersPage] = useLazyFetchHierarchyUsersPageQuery();

  const loadDistrictsPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestSeq = append
        ? districtsRequestSeqRef.current
        : ++districtsRequestSeqRef.current;
      const result = await triggerDistrictsPage({
        limit: ASSIGNMENT_LIST_PAGE_SIZE,
        offset,
        ...(divisionId !== null ? { divisionId } : {}),
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
    [divisionId, triggerDistrictsPage],
  );

  const loadUpazilasPage = useCallback(
    async (
      districtId: number,
      offset: number,
      append: boolean,
    ): Promise<{ upazilas: AdminUpazila[]; total: number } | null> => {
      const currentSeq = upazilaRequestSeqRef.current.get(districtId) ?? 0;
      const requestSeq = append ? currentSeq : currentSeq + 1;
      if (!append) {
        upazilaRequestSeqRef.current.set(districtId, requestSeq);
      }

      setUpazilaPages((prev) => {
        const existing = prev[districtId] ?? emptyUpazilaPage();
        return {
          ...prev,
          [districtId]: {
            ...existing,
            isLoading: !append && existing.items.length === 0,
            isFetching: true,
            isError: false,
          },
        };
      });

      const result = await triggerUpazilasPage({
        limit: ASSIGNMENT_LIST_PAGE_SIZE,
        offset,
        districtId,
      });
      if ((upazilaRequestSeqRef.current.get(districtId) ?? 0) !== requestSeq) {
        return null;
      }
      if ('error' in result && result.error) {
        setUpazilaPages((prev) => {
          const existing = prev[districtId] ?? emptyUpazilaPage();
          return {
            ...prev,
            [districtId]: {
              ...existing,
              isLoading: false,
              isFetching: false,
              isError: true,
            },
          };
        });
        return null;
      }
      const page = result.data;
      if (!page) return null;

      setUpazilaPages((prev) => {
        const existing = prev[districtId] ?? emptyUpazilaPage();
        const items = append
          ? [...existing.items, ...page.upazilas]
          : page.upazilas;
        return {
          ...prev,
          [districtId]: {
            items,
            total: page.total,
            offset: page.offset + page.upazilas.length,
            isLoading: false,
            isFetching: false,
            isError: false,
          },
        };
      });

      return { upazilas: page.upazilas, total: page.total };
    },
    [triggerUpazilasPage],
  );

  const fetchAllUpazilasForDistrict = useCallback(
    async (districtId: number): Promise<AdminUpazila[]> => {
      const collected: AdminUpazila[] = [];
      let offset = 0;
      let total = Number.POSITIVE_INFINITY;

      setUpazilaPages((prev) => {
        const existing = prev[districtId] ?? emptyUpazilaPage();
        return {
          ...prev,
          [districtId]: {
            ...existing,
            isLoading: existing.items.length === 0,
            isFetching: true,
            isError: false,
          },
        };
      });

      try {
        while (offset < total) {
          const result = await triggerUpazilasPage({
            limit: ASSIGNMENT_LIST_PAGE_SIZE,
            offset,
            districtId,
          });
          if ('error' in result && result.error) {
            setUpazilaPages((prev) => {
              const existing = prev[districtId] ?? emptyUpazilaPage();
              return {
                ...prev,
                [districtId]: {
                  ...existing,
                  isLoading: false,
                  isFetching: false,
                  isError: true,
                },
              };
            });
            return collected;
          }
          const page = result.data;
          if (!page || page.upazilas.length === 0) break;
          collected.push(...page.upazilas);
          total = page.total;
          offset += page.upazilas.length;
        }

        setUpazilaPages((prev) => ({
          ...prev,
          [districtId]: {
            items: collected,
            total: collected.length,
            offset: collected.length,
            isLoading: false,
            isFetching: false,
            isError: false,
          },
        }));
        return collected;
      } catch {
        setUpazilaPages((prev) => {
          const existing = prev[districtId] ?? emptyUpazilaPage();
          return {
            ...prev,
            [districtId]: {
              ...existing,
              isLoading: false,
              isFetching: false,
              isError: true,
            },
          };
        });
        return collected;
      }
    },
    [triggerUpazilasPage],
  );

  const fetchUsersForUpazila = useCallback(
    async (upazilaId: number): Promise<AdminUser[]> => {
      const cached = usersByUpazilaIdRef.current[upazilaId];
      if (cached) return cached;

      const requestSeq =
        (upazilaUsersRequestSeqRef.current.get(upazilaId) ?? 0) + 1;
      upazilaUsersRequestSeqRef.current.set(upazilaId, requestSeq);
      setLoadingUpazilaUserIds((prev) => new Set(prev).add(upazilaId));

      try {
        const collected: AdminUser[] = [];
        let offset = 0;
        let total = Number.POSITIVE_INFINITY;

        while (offset < total) {
          const result = await triggerUsersPage({
            limit: ASSIGNMENT_USERS_PAGE_SIZE,
            offset,
            upazilaId,
          });
          if (
            (upazilaUsersRequestSeqRef.current.get(upazilaId) ?? 0) !==
            requestSeq
          ) {
            return usersByUpazilaIdRef.current[upazilaId] ?? [];
          }
          if ('error' in result && result.error) {
            return usersByUpazilaIdRef.current[upazilaId] ?? [];
          }
          const page = result.data;
          if (!page || page.users.length === 0) break;
          collected.push(...assignableUsers(page.users));
          total = page.total;
          offset += page.users.length;
        }

        setUsersByUpazilaId((prev) => ({ ...prev, [upazilaId]: collected }));
        return collected;
      } finally {
        setLoadingUpazilaUserIds((prev) => {
          const next = new Set(prev);
          next.delete(upazilaId);
          return next;
        });
      }
    },
    [triggerUsersPage],
  );

  const ensureUsersForUpazilas = useCallback(
    async (upazilas: AdminUpazila[]): Promise<AdminUser[]> => {
      const batches = await Promise.all(
        upazilas.map((upazila) => fetchUsersForUpazila(upazila.id)),
      );
      const byId = new Map<number, AdminUser>();
      for (const users of batches) {
        for (const user of users) byId.set(user.id, user);
      }
      return Array.from(byId.values());
    },
    [fetchUsersForUpazila],
  );

  const ensureDistrictUsers = useCallback(
    async (districtId: number): Promise<AdminUser[]> => {
      const cached = usersByDistrictIdRef.current[districtId];
      if (cached) return cached;

      const inFlight = districtUsersPromiseRef.current.get(districtId);
      if (inFlight) return inFlight;

      const promise = (async () => {
        setLoadingDistrictUserIds((prev) => new Set(prev).add(districtId));
        try {
          const upazilas = await fetchAllUpazilasForDistrict(districtId);
          const users = await ensureUsersForUpazilas(upazilas);
          setUsersByDistrictId((prev) => ({ ...prev, [districtId]: users }));
          return users;
        } finally {
          districtUsersPromiseRef.current.delete(districtId);
          setLoadingDistrictUserIds((prev) => {
            const next = new Set(prev);
            next.delete(districtId);
            return next;
          });
        }
      })();

      districtUsersPromiseRef.current.set(districtId, promise);
      return promise;
    },
    [ensureUsersForUpazilas, fetchAllUpazilasForDistrict],
  );

  const toggleUsersSelection = useCallback(
    (users: AdminUser[]) => {
      if (users.length === 0) return;
      const ids = users.map((user) => user.id);
      const allSelected = ids.every((id) => desiredUserIds.has(id));
      if (allSelected) {
        onRemoveUserIds(ids);
        return;
      }
      onAddUserIds(ids, users);
    },
    [desiredUserIds, onAddUserIds, onRemoveUserIds],
  );

  useEffect(() => {
    setLoadedDistricts([]);
    setDistrictsTotal(0);
    setDistrictsOffset(0);
    setExpandedDistrictIds(new Set());
    setUpazilaPages({});
    setUsersByUpazilaId({});
    setUsersByDistrictId({});
    upazilaRequestSeqRef.current = new Map();
    upazilaUsersRequestSeqRef.current = new Map();
    districtUsersPromiseRef.current = new Map();
    void loadDistrictsPage(0, false);
  }, [loadDistrictsPage]);

  // Prefetch users for visible upazilas so checkbox state stays accurate.
  useEffect(() => {
    const upazilaIds = Object.values(upazilaPages).flatMap((page) =>
      page.items.map((item) => item.id),
    );
    for (const upazilaId of upazilaIds) {
      if (usersByUpazilaId[upazilaId] || loadingUpazilaUserIds.has(upazilaId)) {
        continue;
      }
      void fetchUsersForUpazila(upazilaId);
    }
  }, [
    fetchUsersForUpazila,
    loadingUpazilaUserIds,
    upazilaPages,
    usersByUpazilaId,
  ]);

  // Prefetch full district user sets so district checkboxes reflect selection
  // even when the district row is collapsed.
  useEffect(() => {
    for (const district of loadedDistricts) {
      if (usersByDistrictId[district.id] !== undefined) continue;
      if (loadingDistrictUserIds.has(district.id)) continue;
      void ensureDistrictUsers(district.id);
    }
  }, [
    ensureDistrictUsers,
    loadedDistricts,
    loadingDistrictUserIds,
    usersByDistrictId,
  ]);

  // Keep district user cache in sync when upazila pages finish loading in the UI.
  useEffect(() => {
    for (const district of loadedDistricts) {
      const page = upazilaPages[district.id];
      if (
        !page ||
        page.isLoading ||
        page.isFetching ||
        page.isError ||
        page.items.length < page.total
      ) {
        continue;
      }
      if (
        page.items.some((upazila) => usersByUpazilaId[upazila.id] === undefined)
      ) {
        continue;
      }
      const users = assignableUsers(
        page.items.flatMap((upazila) => usersByUpazilaId[upazila.id] ?? []),
      );
      const existing = usersByDistrictId[district.id];
      if (existing) {
        const existingIds = new Set(existing.map((user) => user.id));
        if (
          existing.length === users.length &&
          users.every((user) => existingIds.has(user.id))
        ) {
          continue;
        }
      }
      setUsersByDistrictId((prev) => ({ ...prev, [district.id]: users }));
    }
  }, [loadedDistricts, upazilaPages, usersByDistrictId, usersByUpazilaId]);

  const toggleDistrictExpanded = (districtId: number) => {
    const willExpand = !expandedDistrictIds.has(districtId);
    setExpandedDistrictIds((prev) => {
      const next = new Set(prev);
      if (next.has(districtId)) {
        next.delete(districtId);
      } else {
        next.add(districtId);
      }
      return next;
    });
    if (!willExpand) return;
    const page = upazilaPages[districtId];
    if (page && (page.items.length > 0 || page.isLoading || page.isFetching)) {
      return;
    }
    void loadUpazilasPage(districtId, 0, false);
  };

  const handleUpazilaToggle = async (upazila: AdminUpazila) => {
    const users = await fetchUsersForUpazila(upazila.id);
    toggleUsersSelection(users);
  };

  const handleDistrictCheckboxChange = async (districtId: number) => {
    setDistrictToggleLoadingIds((prev) => new Set(prev).add(districtId));
    try {
      const users = await ensureDistrictUsers(districtId);
      toggleUsersSelection(users);
    } finally {
      setDistrictToggleLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(districtId);
        return next;
      });
    }
  };

  const districtsHasMore = loadedDistricts.length < districtsTotal;
  const districtsLoading = loadingDistricts && loadedDistricts.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-spice-border">
      <div className="flex items-center justify-between border-b border-spice-border bg-spice-bg-tint px-3 py-2 text-xs font-semibold text-spice-text-medium">
        <span>District</span>
      </div>

      <InfiniteScrollContainer
        className="max-h-[32vh]"
        hasMore={!districtsLoading && !districtsError && districtsHasMore}
        onLoadMore={() => {
          void loadDistrictsPage(districtsOffset, true);
        }}
        loadedCount={loadedDistricts.length}
        isLoadingMore={fetchingDistricts && loadedDistricts.length > 0}
        disabled={districtsLoading || Boolean(districtsError)}
      >
        {districtsLoading ? (
          <div className="p-4 text-center text-sm text-spice-text-muted">
            Loading districts…
          </div>
        ) : districtsError ? (
          <div className="p-4 text-center text-sm text-spice-text-muted">
            Failed to load districts.{' '}
            <button
              type="button"
              className="font-semibold text-spice-brand-primary hover:underline"
              onClick={() => {
                setLoadedDistricts([]);
                setDistrictsOffset(0);
                void loadDistrictsPage(0, false);
              }}
            >
              Retry
            </button>
          </div>
        ) : loadedDistricts.length === 0 ? (
          <div className="p-4 text-center text-sm text-spice-text-muted">
            No districts found.
          </div>
        ) : (
          <div className="divide-y divide-spice-border">
            {loadedDistricts.map((district) => {
              const isExpanded = expandedDistrictIds.has(district.id);
              const upazilaPage = upazilaPages[district.id];
              const districtUsers = usersByDistrictId[district.id];
              const districtSelection = selectionStateForUsers(
                districtUsers,
                desiredUserIds,
              );
              const isDistrictToggleLoading =
                districtToggleLoadingIds.has(district.id) ||
                (districtUsers === undefined &&
                  loadingDistrictUserIds.has(district.id));

              return (
                <div key={district.id}>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-spice-bg-tint/30">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-spice-text-muted transition-colors hover:bg-spice-bg-tint hover:text-spice-text-primary"
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded
                            ? `Collapse ${district.name}`
                            : `Expand ${district.name}`
                        }
                        onClick={() => toggleDistrictExpanded(district.id)}
                      >
                        <ChevronIcon
                          expanded={isExpanded}
                          className="h-3.5 w-3.5"
                        />
                      </button>
                      <span className="truncate text-sm font-semibold text-spice-text-primary">
                        {district.name}
                      </span>
                    </div>
                    <DistrictSelectionCheckbox
                      checked={districtSelection.checked}
                      indeterminate={districtSelection.indeterminate}
                      disabled={isDistrictToggleLoading}
                      onChange={() => {
                        void handleDistrictCheckboxChange(district.id);
                      }}
                    />
                  </div>

                  {isExpanded ? (
                    <DistrictUpazilaList
                      page={upazilaPage}
                      desiredUserIds={desiredUserIds}
                      baselineUserIds={baselineUserIds}
                      usersByUpazilaId={usersByUpazilaId}
                      loadingUpazilaUserIds={loadingUpazilaUserIds}
                      onToggleUpazila={(upazila) => {
                        void handleUpazilaToggle(upazila);
                      }}
                      onRetry={() => {
                        void loadUpazilasPage(district.id, 0, false);
                      }}
                      onLoadMore={() => {
                        if (!upazilaPage) return;
                        void loadUpazilasPage(
                          district.id,
                          upazilaPage.offset,
                          true,
                        );
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </InfiniteScrollContainer>
    </div>
  );
};

interface DistrictSelectionCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  disabled?: boolean;
  onChange: () => void;
}

function DistrictSelectionCheckbox({
  checked,
  indeterminate,
  disabled = false,
  onChange,
}: DistrictSelectionCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label="Select all users in district"
      onChange={onChange}
      className={cn(
        SPICE_CHECKBOX_CLASSNAME,
        'disabled:cursor-wait disabled:opacity-60',
      )}
    />
  );
}

interface DistrictUpazilaListProps {
  page: DistrictUpazilaPage | undefined;
  desiredUserIds: ReadonlySet<number>;
  baselineUserIds: ReadonlySet<number>;
  usersByUpazilaId: Record<number, AdminUser[]>;
  loadingUpazilaUserIds: ReadonlySet<number>;
  onToggleUpazila: (upazila: AdminUpazila) => void;
  onRetry: () => void;
  onLoadMore: () => void;
}

function DistrictUpazilaList({
  page,
  desiredUserIds,
  baselineUserIds,
  usersByUpazilaId,
  loadingUpazilaUserIds,
  onToggleUpazila,
  onRetry,
  onLoadMore,
}: DistrictUpazilaListProps) {
  if (!page || page.isLoading) {
    return (
      <div className="bg-spice-bg-tint/40 px-8 py-2.5 text-xs text-spice-text-muted">
        Loading upazilas…
      </div>
    );
  }

  if (page.isError) {
    return (
      <div className="bg-spice-bg-tint/40 px-8 py-2.5 text-xs text-spice-text-muted">
        Failed to load upazilas.{' '}
        <button
          type="button"
          className="font-semibold text-spice-brand-primary hover:underline"
          onClick={onRetry}
        >
          Retry
        </button>
      </div>
    );
  }

  if (page.items.length === 0) {
    return (
      <div className="bg-spice-bg-tint/40 px-8 py-2.5 text-xs text-spice-text-muted">
        No upazilas found.
      </div>
    );
  }

  const hasMore = page.items.length < page.total;

  return (
    <div className="bg-spice-bg-tint/40">
      {page.items.map((upazila) => {
        const users = usersByUpazilaId[upazila.id];
        const selection = selectionStateForUsers(users, desiredUserIds);
        const isAlreadyAssigned = isAlreadyAssignedUpazila(
          users,
          baselineUserIds,
        );
        const isLoadingUsers = loadingUpazilaUserIds.has(upazila.id);

        return (
          <label
            key={upazila.id}
            className="flex cursor-pointer items-center justify-between px-8 py-2 hover:bg-spice-bg-tint/60"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-spice-text-primary">
                {upazila.name}
              </span>
              {isAlreadyAssigned ? (
                <span className="text-xs text-spice-text-muted">
                  Already assigned
                </span>
              ) : users && users.length === 0 ? (
                <span className="text-xs text-spice-text-muted">
                  No assignable users
                </span>
              ) : null}
            </div>
            <input
              type="checkbox"
              checked={selection.checked}
              ref={(element) => {
                if (element) {
                  element.indeterminate = selection.indeterminate;
                }
              }}
              disabled={isLoadingUsers}
              onChange={() => onToggleUpazila(upazila)}
              className={cn(
                SPICE_CHECKBOX_CLASSNAME,
                'disabled:cursor-wait disabled:opacity-60',
              )}
            />
          </label>
        );
      })}
      {hasMore ? (
        <button
          type="button"
          className={cn(
            'w-full px-8 py-2 text-left text-xs font-semibold text-spice-brand-primary hover:underline',
            page.isFetching && 'cursor-wait opacity-70',
          )}
          disabled={page.isFetching}
          onClick={onLoadMore}
        >
          {page.isFetching ? 'Loading more…' : 'Load more upazilas'}
        </button>
      ) : null}
    </div>
  );
}
