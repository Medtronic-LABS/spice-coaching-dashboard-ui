import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronIcon } from '@/assets/icon';
import { InfiniteScrollContainer } from '@/components/ui';
import {
  ASSIGNMENT_LIST_PAGE_SIZE,
  type AdminDistrict,
  type AdminUpazila,
  useLazyFetchAdminDistrictsPageQuery,
  useLazyFetchAdminUpazilasPageQuery,
} from '@/features/modules/api/adminAssignmentApi';
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
  desiredUpazilaSet: ReadonlySet<string>;
  baselineUpazilaSet: ReadonlySet<string>;
  onToggleUpazila: (upazilaName: string) => void;
  onToggleUpazilaNames: (upazilaNames: string[]) => void;
}

const emptyUpazilaPage = (): DistrictUpazilaPage => ({
  items: [],
  total: 0,
  offset: 0,
  isLoading: false,
  isFetching: false,
  isError: false,
});

export const AssignmentGeoDistrictHierarchy = ({
  divisionId,
  desiredUpazilaSet,
  baselineUpazilaSet,
  onToggleUpazila,
  onToggleUpazilaNames,
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
  const [districtToggleLoadingIds, setDistrictToggleLoadingIds] = useState<
    Set<number>
  >(() => new Set());

  const districtsRequestSeqRef = useRef(0);
  const upazilaRequestSeqRef = useRef<Map<number, number>>(new Map());

  const [
    triggerDistrictsPage,
    {
      isLoading: loadingDistricts,
      isError: districtsError,
      isFetching: fetchingDistricts,
    },
  ] = useLazyFetchAdminDistrictsPageQuery();
  const [triggerUpazilasPage] = useLazyFetchAdminUpazilasPageQuery();

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

      while (offset < total) {
        const page = await loadUpazilasPage(districtId, offset, offset > 0);
        if (!page || page.upazilas.length === 0) break;
        collected.push(...page.upazilas);
        total = page.total;
        offset += page.upazilas.length;
      }

      return collected;
    },
    [loadUpazilasPage],
  );

  useEffect(() => {
    setLoadedDistricts([]);
    setDistrictsTotal(0);
    setDistrictsOffset(0);
    setExpandedDistrictIds(new Set());
    setUpazilaPages({});
    upazilaRequestSeqRef.current = new Map();
    void loadDistrictsPage(0, false);
  }, [loadDistrictsPage]);

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

  const handleDistrictCheckboxChange = async (
    districtId: number,
    cachedPage: DistrictUpazilaPage | undefined,
  ) => {
    setDistrictToggleLoadingIds((prev) => new Set(prev).add(districtId));
    try {
      const upazilas =
        cachedPage &&
        cachedPage.items.length >= cachedPage.total &&
        cachedPage.total > 0
          ? cachedPage.items
          : await fetchAllUpazilasForDistrict(districtId);
      if (upazilas.length === 0) return;
      onToggleUpazilaNames(upazilas.map((upazila) => upazila.name));
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
              const upazilaNames =
                upazilaPage?.items.map((item) => item.name) ?? [];
              const selectedCount = upazilaNames.filter((name) =>
                desiredUpazilaSet.has(name),
              ).length;
              const hasLoadedUpazilas = upazilaNames.length > 0;
              const allLoadedSelected =
                hasLoadedUpazilas && selectedCount === upazilaNames.length;
              const isFullySelected =
                hasLoadedUpazilas &&
                upazilaPage !== undefined &&
                upazilaPage.items.length >= upazilaPage.total &&
                allLoadedSelected;
              const isPartiallySelected = selectedCount > 0 && !isFullySelected;
              const isDistrictToggleLoading = districtToggleLoadingIds.has(
                district.id,
              );

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
                      checked={isFullySelected}
                      indeterminate={isPartiallySelected}
                      disabled={isDistrictToggleLoading}
                      onChange={() => {
                        void handleDistrictCheckboxChange(
                          district.id,
                          upazilaPage,
                        );
                      }}
                    />
                  </div>

                  {isExpanded ? (
                    <DistrictUpazilaList
                      page={upazilaPage}
                      desiredUpazilaSet={desiredUpazilaSet}
                      baselineUpazilaSet={baselineUpazilaSet}
                      onToggleUpazila={onToggleUpazila}
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
      aria-label="Select all upazilas in district"
      onChange={onChange}
      className="h-4 w-4 rounded border-spice-border text-spice-brand-primary focus:ring-spice-brand-primary/25 disabled:cursor-wait disabled:opacity-60"
    />
  );
}

interface DistrictUpazilaListProps {
  page: DistrictUpazilaPage | undefined;
  desiredUpazilaSet: ReadonlySet<string>;
  baselineUpazilaSet: ReadonlySet<string>;
  onToggleUpazila: (upazilaName: string) => void;
  onRetry: () => void;
  onLoadMore: () => void;
}

function DistrictUpazilaList({
  page,
  desiredUpazilaSet,
  baselineUpazilaSet,
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
        const isChecked = desiredUpazilaSet.has(upazila.name);
        const isAlreadyAssigned = baselineUpazilaSet.has(upazila.name);

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
              ) : null}
            </div>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggleUpazila(upazila.name)}
              className="h-4 w-4 rounded border-spice-border text-spice-brand-primary focus:ring-spice-brand-primary/25"
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
