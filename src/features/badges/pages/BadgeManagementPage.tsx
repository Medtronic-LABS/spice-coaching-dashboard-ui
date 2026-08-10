import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banner,
  Button,
  Card,
  Combobox,
  type ComboboxOption,
  ErrorState,
  Loader,
  Modal,
  SearchInput,
  Tooltip,
} from '@/components/ui';
import { Table } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import {
  SettingsFilterDrawer,
  SettingsFilterTriggerButton,
} from '@/components/common/SettingsFilterDrawer';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import {
  useCreateBadgeMutation,
  useDeleteBadgeMutation,
  useFetchBadgesQuery,
  useLazyFetchBadgesQuery,
  useReorderBadgePairMutation,
  useUpdateBadgeMutation,
} from '@/features/badges/api/adminBadgesApi';
import { BadgeImageThumb } from '@/features/badges/components/BadgeImageThumb';
import { BadgeImageUploadField } from '@/features/badges/components/BadgeImageUploadField';
import { BadgeManagementFiltersPanel } from '@/features/badges/components/BadgeManagementFiltersPanel';
import {
  BadgeModuleMultiSelect,
  type PublishedModuleOption,
} from '@/features/badges/components/BadgeModuleMultiSelect';
import {
  EMPTY_BADGE_FILTERS,
  type AdminBadge,
  type AdminBadgeListQuery,
  type AdminBadgeWriteBody,
  type BadgeManagementFilters,
} from '@/features/badges/types/badge.types';
import {
  buildBadgeListDateParams,
  findSequenceNeighbor,
  getMutationErrorMessage,
  hasActiveBadgeFilters,
  isDateRangeInvalid,
  nextGlobalBadgeSequence,
  objectNameFromStoragePath,
} from '@/features/badges/utils/badgeForm';
import {
  useFetchModuleDomainOptionsQuery,
  useFetchModulesQuery,
} from '@/features/modules/api/adminModulesApi';
import { isAssignablePublishedModule } from '@/features/modules/utils/isAssignablePublishedModule';
import { formatModuleDomainLabel } from '@/features/modules/utils/moduleListFilters';
import { resolveDisplayText } from '@/config/deploymentLocale';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

const FIELD_CLASS =
  'h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm';
const BADGE_PAGE_SIZE_OPTIONS = [5, 10, 15, 25, 50] as const;
const DEFAULT_BADGE_PAGE_SIZE = 10;
/** Used when filters open — need domain/creator options across a broad slice. */
const BADGE_CATALOG_QUERY: AdminBadgeListQuery = {
  sort_by: 'sequence',
  sort_dir: 'asc',
  limit: 200,
  offset: 0,
};
/** Highest existing sequence for create — must sort DESC so max is on first page. */
const BADGE_MAX_SEQUENCE_QUERY: AdminBadgeListQuery = {
  sort_by: 'sequence',
  sort_dir: 'desc',
  limit: 1,
  offset: 0,
};
const SEARCH_DEBOUNCE_MS = 300;

type FeedbackState =
  | { tone: 'success'; message: string }
  | { tone: 'critical'; message: string }
  | null;

type BadgeFormState = {
  name: string;
  domain: string;
  moduleIds: string[];
  imageStoragePath: string;
  imageObjectName: string;
  imagePreviewUrl: string;
  /** True when a new image was uploaded in this edit/create session. */
  imageChanged: boolean;
};

function emptyForm(): BadgeFormState {
  return {
    name: '',
    domain: '',
    moduleIds: [],
    imageStoragePath: '',
    imageObjectName: '',
    imagePreviewUrl: '',
    imageChanged: false,
  };
}

function formFromBadge(badge: AdminBadge): BadgeFormState {
  return {
    name: badge.name,
    domain: badge.domain,
    moduleIds: [...badge.module_ids],
    imageStoragePath: badge.image_storage_path,
    imageObjectName: objectNameFromStoragePath(badge.image_storage_path),
    imagePreviewUrl: '',
    imageChanged: false,
  };
}

function moduleCacheFromBadge(
  badge: AdminBadge,
): Record<string, PublishedModuleOption> {
  const cache: Record<string, PublishedModuleOption> = {};
  for (const module of badge.modules) {
    cache[module.id] = {
      id: module.id,
      title: resolveDisplayText(module.title) || module.id,
      domain: formatModuleDomainLabel(badge.domain),
    };
  }
  return cache;
}

export const BadgeManagementPage = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [moduleFilterSearchTerm, setModuleFilterSearchTerm] = useState('');
  const [domainSearchTerm, setDomainSearchTerm] = useState('');
  const [domainFilterSearchTerm, setDomainFilterSearchTerm] = useState('');
  const debouncedModuleSearchQuery = useDebouncedValue(
    moduleSearchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const debouncedModuleFilterSearchTerm = useDebouncedValue(
    moduleFilterSearchTerm,
    SEARCH_DEBOUNCE_MS,
  );
  const debouncedDomainSearchTerm = useDebouncedValue(
    domainSearchTerm,
    SEARCH_DEBOUNCE_MS,
  );
  const debouncedDomainFilterSearchTerm = useDebouncedValue(
    domainFilterSearchTerm,
    SEARCH_DEBOUNCE_MS,
  );
  const [draftFilters, setDraftFilters] =
    useState<BadgeManagementFilters>(EMPTY_BADGE_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<BadgeManagementFilters>(EMPTY_BADGE_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_BADGE_PAGE_SIZE);
  const [pageInput, setPageInput] = useState('1');

  const [form, setForm] = useState<BadgeFormState>(emptyForm);
  const [selectedModuleCache, setSelectedModuleCache] = useState<
    Record<string, PublishedModuleOption>
  >({});
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [viewingBadgeId, setViewingBadgeId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBadge | null>(null);
  const [reorderingBadgeId, setReorderingBadgeId] = useState<string | null>(
    null,
  );

  const dateParams = useMemo(
    () => buildBadgeListDateParams(appliedFilters),
    [appliedFilters],
  );

  const listQueryArgs = useMemo(
    () => ({
      q: debouncedQuery.trim() || undefined,
      domain: appliedFilters.domain.trim() || undefined,
      created_by: appliedFilters.createdBy.trim()
        ? [appliedFilters.createdBy.trim()]
        : undefined,
      module_title: appliedFilters.moduleTitle.trim()
        ? [appliedFilters.moduleTitle.trim()]
        : undefined,
      created_from: dateParams.created_from,
      created_to: dateParams.created_to,
      sort_by: 'sequence' as const,
      sort_dir: 'asc' as const,
      limit: pageSize,
      offset: page * pageSize,
    }),
    [appliedFilters, dateParams, debouncedQuery, page, pageSize],
  );

  const {
    data: badgeList,
    isLoading: badgesLoading,
    isError: badgesError,
    isFetching: badgesFetching,
    refetch: refetchBadges,
  } = useFetchBadgesQuery(listQueryArgs);

  /** Creator filter options when the catalog spans multiple pages. */
  const { data: filterCatalogList } = useFetchBadgesQuery(BADGE_CATALOG_QUERY, {
    skip: !filtersOpen,
  });
  const [fetchBadgeCatalog] = useLazyFetchBadgesQuery();

  const formDomainQuery = debouncedDomainSearchTerm.trim() || undefined;
  const filterDomainQuery = debouncedDomainFilterSearchTerm.trim() || undefined;

  const { data: moduleDomains = [], isFetching: formModuleDomainsFetching } =
    useFetchModuleDomainOptionsQuery({ q: formDomainQuery });

  const {
    data: filterModuleDomains = [],
    isFetching: filterModuleDomainsFetching,
  } = useFetchModuleDomainOptionsQuery({ q: filterDomainQuery });

  const selectedDomain = form.domain.trim();
  const moduleLookupQuery = debouncedModuleSearchQuery.trim();
  const { data: publishedModulesData, isLoading: modulesLoading } =
    useFetchModulesQuery(
      {
        status: 'published',
        domain: selectedDomain || undefined,
        chatbot_faqs_only: false,
        limit: 50,
        offset: 0,
        q: moduleLookupQuery || undefined,
        sort_by: 'title',
        sort_dir: 'asc',
      },
      { skip: !selectedDomain },
    );
  const moduleFilterLookupQuery = debouncedModuleFilterSearchTerm.trim();
  const { data: filterModulesData, isLoading: filterModulesLoading } =
    useFetchModulesQuery({
      status: 'published',
      chatbot_faqs_only: false,
      limit: 50,
      offset: 0,
      q: moduleFilterLookupQuery || undefined,
      sort_by: 'title',
      sort_dir: 'asc',
    });

  const [createBadge, { isLoading: isCreating }] = useCreateBadgeMutation();
  const [updateBadge, { isLoading: isUpdating }] = useUpdateBadgeMutation();
  const [reorderBadgePair] = useReorderBadgePairMutation();
  const [deleteBadge, { isLoading: isDeleting }] = useDeleteBadgeMutation();

  const publishedModules: PublishedModuleOption[] = useMemo(() => {
    const modules = publishedModulesData?.modules ?? [];
    return modules.filter(isAssignablePublishedModule).map((module) => ({
      id: module.id,
      title: resolveDisplayText(module.title) || module.id,
      domain: formatModuleDomainLabel(module.domain),
    }));
  }, [publishedModulesData?.modules]);

  useEffect(() => {
    if (publishedModules.length === 0) return;
    setSelectedModuleCache((prev) => {
      const next = { ...prev };
      for (const module of publishedModules) {
        next[module.id] = module;
      }
      return next;
    });
  }, [publishedModules]);

  const pickerModules = useMemo(() => {
    const merged: PublishedModuleOption[] = [];
    const seen = new Set<string>();

    for (const moduleId of form.moduleIds) {
      const selected = selectedModuleCache[moduleId];
      if (!selected || seen.has(selected.id)) continue;
      merged.push(selected);
      seen.add(selected.id);
    }

    for (const module of publishedModules) {
      if (seen.has(module.id)) continue;
      merged.push(module);
      seen.add(module.id);
    }

    return merged;
  }, [form.moduleIds, publishedModules, selectedModuleCache]);

  const badges = useMemo(() => badgeList?.badges ?? [], [badgeList?.badges]);
  const catalogBadges = useMemo(
    () => filterCatalogList?.badges ?? badges,
    [badges, filterCatalogList?.badges],
  );
  const totalBadges = badgeList?.total ?? badges.length;
  const totalPages = badgeList?.total_pages ?? 0;
  const hasPrevPage = page > 0;
  const hasNextPage = totalPages > 0 && page + 1 < totalPages;
  const rangeStart = badges.length ? page * pageSize + 1 : 0;
  const rangeEnd = badges.length ? page * pageSize + badges.length : 0;

  useEffect(() => {
    setPage(0);
  }, [appliedFilters, debouncedQuery, pageSize]);

  useEffect(() => {
    setPageInput(String(page + 1));
  }, [page]);

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const commitPageInput = () => {
    const parsed = Number.parseInt(pageInput, 10);
    const isValid =
      Number.isFinite(parsed) &&
      parsed >= 1 &&
      (totalPages <= 0 || parsed <= totalPages);
    if (!isValid) {
      setPageInput(String(page + 1));
      return;
    }
    setPage(parsed - 1);
  };

  const handlePageInputChange = (raw: string) => {
    if (raw === '') {
      setPageInput('');
      return;
    }
    if (!/^\d+$/.test(raw)) return;
    const parsed = Number.parseInt(raw, 10);
    if (parsed < 1) return;
    if (totalPages > 0 && parsed > totalPages) return;
    setPageInput(raw);
  };

  const createdByOptions = useMemo(() => {
    const set = new Set<string>();
    for (const badge of catalogBadges) {
      if (badge.created_by?.trim()) set.add(badge.created_by.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [catalogBadges]);

  const domainComboboxOptions = useMemo<ComboboxOption[]>(() => {
    const options = moduleDomains.map((domain) => ({
      label: formatModuleDomainLabel(domain),
      value: domain,
    }));
    if (
      form.domain &&
      !options.some((option) => option.value === form.domain)
    ) {
      options.unshift({
        label: formatModuleDomainLabel(form.domain),
        value: form.domain,
      });
    }
    return options;
  }, [form.domain, moduleDomains]);

  const filterDomainComboboxOptions = useMemo<ComboboxOption[]>(() => {
    const options = filterModuleDomains.map((domain) => ({
      label: formatModuleDomainLabel(domain),
      value: domain,
    }));
    if (
      draftFilters.domain &&
      !options.some((option) => option.value === draftFilters.domain)
    ) {
      options.unshift({
        label: formatModuleDomainLabel(draftFilters.domain),
        value: draftFilters.domain,
      });
    }
    return options;
  }, [draftFilters.domain, filterModuleDomains]);

  const filterModuleOptions = useMemo<ComboboxOption[]>(
    () =>
      (filterModulesData?.modules ?? [])
        .filter(isAssignablePublishedModule)
        .map((module) => ({
          label: resolveDisplayText(module.title) || module.id,
          value: resolveDisplayText(module.title) || module.id,
        })),
    [filterModulesData?.modules],
  );

  const editingBadge = useMemo(
    () => badges.find((badge) => badge.id === editingBadgeId) ?? null,
    [badges, editingBadgeId],
  );
  const viewingBadge = useMemo(
    () => badges.find((badge) => badge.id === viewingBadgeId) ?? null,
    [badges, viewingBadgeId],
  );

  useEffect(() => {
    if (editingBadgeId && !editingBadge && !badgesLoading) {
      setEditingBadgeId(null);
      setForm(emptyForm());
    }
  }, [badgesLoading, editingBadge, editingBadgeId]);
  useEffect(() => {
    if (viewingBadgeId && !viewingBadge && !badgesLoading) {
      setViewingBadgeId(null);
      setForm(emptyForm());
    }
  }, [badgesLoading, viewingBadge, viewingBadgeId]);

  const isReordering = Boolean(reorderingBadgeId);
  const isSaving = isCreating || isUpdating;
  const isViewMode = Boolean(viewingBadgeId);
  const filtersActive = hasActiveBadgeFilters(appliedFilters);

  const resetForm = useCallback(() => {
    setForm(emptyForm());
    setSelectedModuleCache({});
    setModuleSearchQuery('');
    setDomainSearchTerm('');
    setViewingBadgeId(null);
    setEditingBadgeId(null);
    setFormError('');
  }, []);

  const startEdit = useCallback((badge: AdminBadge) => {
    setForm(formFromBadge(badge));
    setSelectedModuleCache(moduleCacheFromBadge(badge));
    setModuleSearchQuery('');
    setDomainSearchTerm('');
    setViewingBadgeId(null);
    setEditingBadgeId(badge.id);
    setFormError('');
    setFeedback(null);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // jsdom does not implement scrollTo
    }
  }, []);

  const startView = useCallback((badge: AdminBadge) => {
    setForm(formFromBadge(badge));
    setSelectedModuleCache(moduleCacheFromBadge(badge));
    setModuleSearchQuery('');
    setDomainSearchTerm('');
    setEditingBadgeId(null);
    setViewingBadgeId(badge.id);
    setFormError('');
    setFeedback(null);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // jsdom does not implement scrollTo
    }
  }, []);

  const handleDomainChange = useCallback((domain: string) => {
    setForm((prev) => ({
      ...prev,
      domain,
      moduleIds: domain === prev.domain ? prev.moduleIds : [],
    }));
    setModuleSearchQuery('');
    setFormError('');
  }, []);

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'Milestone name is required.';
    if (!form.domain.trim()) return 'Domain is required.';
    if (!editingBadgeId && !form.imageChanged) {
      return 'Upload a milestone image before adding.';
    }
    if (!form.imageStoragePath.trim()) {
      return 'Milestone image is required.';
    }
    if (form.moduleIds.length === 0) {
      return 'Select at least one published module.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (editingBadgeId && !form.imageChanged && !form.imageStoragePath) {
      setFormError('Milestone image is required.');
      return;
    }

    if (!editingBadgeId && !form.imageChanged) {
      setFormError('Upload a milestone image before adding.');
      return;
    }

    setFormError('');
    setFeedback(null);

    const domain = form.domain.trim();
    let sequence: number | null = editingBadgeId
      ? (editingBadge?.sequence ?? null)
      : null;

    if (!editingBadgeId) {
      try {
        const catalog = await fetchBadgeCatalog(
          BADGE_MAX_SEQUENCE_QUERY,
        ).unwrap();
        sequence = nextGlobalBadgeSequence(catalog.badges);
      } catch (error) {
        setFormError(getMutationErrorMessage(error));
        return;
      }
    }

    const body: AdminBadgeWriteBody = {
      name: form.name.trim(),
      domain,
      image_storage_path: form.imageStoragePath,
      module_ids: form.moduleIds,
      sequence,
    };

    try {
      if (editingBadgeId) {
        await updateBadge({ badgeId: editingBadgeId, body }).unwrap();
        setFeedback({
          tone: 'success',
          message: 'Milestone updated successfully.',
        });
      } else {
        await createBadge(body).unwrap();
        setFeedback({
          tone: 'success',
          message: 'Milestone created successfully.',
        });
      }
      resetForm();
    } catch (error) {
      setFormError(getMutationErrorMessage(error));
    }
  };

  const handleReorder = useCallback(
    async (badge: AdminBadge, direction: 'up' | 'down') => {
      const neighbor = findSequenceNeighbor(badges, badge.id, direction);
      if (
        !neighbor ||
        badge.sequence == null ||
        neighbor.sequence == null ||
        isReordering
      ) {
        return;
      }

      const badgeSeq = badge.sequence;
      const neighborSeq = neighbor.sequence;

      setReorderingBadgeId(badge.id);
      try {
        await reorderBadgePair({
          badge,
          neighbor,
          badgeSequence: badgeSeq,
          neighborSequence: neighborSeq,
        }).unwrap();
      } catch (error) {
        setFeedback({
          tone: 'critical',
          message: getMutationErrorMessage(error),
        });
      } finally {
        setReorderingBadgeId(null);
      }
    },
    [badges, isReordering, reorderBadgePair],
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setFeedback(null);
    try {
      await deleteBadge({ badgeId: deleteTarget.id }).unwrap();
      if (editingBadgeId === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      setFeedback({
        tone: 'success',
        message: 'Milestone deleted successfully.',
      });
    } catch (error) {
      setFeedback({
        tone: 'critical',
        message: getMutationErrorMessage(error),
      });
      setDeleteTarget(null);
    }
  };

  const applyFilters = () => {
    if (isDateRangeInvalid(draftFilters.createdFrom, draftFilters.createdTo)) {
      return;
    }
    setPage(0);
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setPage(0);
    setDomainFilterSearchTerm('');
    setDraftFilters(EMPTY_BADGE_FILTERS);
    setAppliedFilters(EMPTY_BADGE_FILTERS);
  };

  const columns = useMemo<ColumnDef<AdminBadge>[]>(
    () => [
      {
        key: 'sequence',
        header: 'Seq No.',
        className: 'w-40 whitespace-nowrap px-2 sm:px-3',
        headerClassName: 'w-40 whitespace-nowrap px-2 sm:px-3',
        render: (row) => {
          const canMoveUp = Boolean(findSequenceNeighbor(badges, row.id, 'up'));
          const canMoveDown = Boolean(
            findSequenceNeighbor(badges, row.id, 'down'),
          );
          const rowBusy = reorderingBadgeId === row.id;
          const arrowButtonClass =
            'inline-flex h-7 w-9 items-center justify-center rounded-md border border-spice-border bg-spice-bg-surface text-base leading-none text-spice-text-primary transition hover:bg-spice-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary/30 disabled:cursor-not-allowed disabled:opacity-35';
          return (
            <div
              className={`flex items-center gap-2 ${rowBusy ? 'opacity-70' : ''}`}
            >
              <span className="min-w-[1.5rem] font-medium tabular-nums text-spice-text-primary">
                {row.sequence ?? '—'}
              </span>
              <div
                className="flex items-center gap-0.5"
                role="group"
                aria-label="Reorder sequence"
              >
                <button
                  type="button"
                  className={arrowButtonClass}
                  title="Move up"
                  aria-label={`Move ${row.name} up in sequence`}
                  disabled={!canMoveUp || isReordering}
                  onClick={() => void handleReorder(row, 'up')}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={arrowButtonClass}
                  title="Move down"
                  aria-label={`Move ${row.name} down in sequence`}
                  disabled={!canMoveDown || isReordering}
                  onClick={() => void handleReorder(row, 'down')}
                >
                  ↓
                </button>
              </div>
              {rowBusy ? (
                <span
                  className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-spice-border-mid border-t-spice-brand-primary"
                  aria-label="Updating sequence"
                />
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'name',
        header: 'Milestone',
        className: 'min-w-[14rem]',
        render: (row) => (
          <div className="flex min-w-0 items-center gap-3">
            <BadgeImageThumb
              storagePath={row.image_storage_path}
              alt={`${row.name} milestone`}
              className="shrink-0"
            />
            <span className="font-medium text-spice-text-primary">
              {row.name}
            </span>
          </div>
        ),
      },
      {
        key: 'domain',
        header: 'Domain (Name)',
        className: 'whitespace-nowrap',
        render: (row) => formatModuleDomainLabel(row.domain),
      },
      {
        key: 'module_ids',
        header: 'Modules',
        className: 'max-w-[16rem]',
        render: (row) => {
          const titles = (
            row.modules.length
              ? row.modules
              : row.module_ids.map((id) => ({
                  id,
                  title: {},
                }))
          ).map((module) => resolveDisplayText(module.title, module.id));
          if (!titles.length) {
            return <span className="text-sm text-spice-text-muted">—</span>;
          }
          const visible = titles.slice(0, 2);
          const remaining = titles.length - visible.length;
          const label =
            remaining > 0
              ? `${visible.join(', ')} +${remaining}`
              : visible.join(', ');
          return (
            <span
              className="line-clamp-2 text-sm text-spice-text-medium"
              title={titles.join(', ')}
            >
              {label}
            </span>
          );
        },
      },
      {
        key: 'created_by',
        header: 'Created By',
        className: 'whitespace-nowrap',
        render: (row) => row.created_by ?? '—',
      },
      {
        key: 'created_at',
        header: 'Created At',
        className: 'whitespace-nowrap',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {formatDisplayDateTime(row.created_at)}
          </span>
        ),
      },
      {
        key: 'updated_at',
        header: 'Last Updated',
        className: 'whitespace-nowrap',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {formatDisplayDateTime(row.updated_at)}
          </span>
        ),
      },
      {
        key: 'id',
        header: 'Actions',
        className: 'text-left',
        render: (row) => (
          <div className="flex justify-start gap-2">
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              onClick={() => startView(row)}
            >
              View
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              onClick={() => startEdit(row)}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs text-spice-semantic-error hover:bg-spice-semantic-errorBg"
              onClick={() => setDeleteTarget(row)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [
      badges,
      handleReorder,
      isReordering,
      reorderingBadgeId,
      startEdit,
      startView,
    ],
  );

  if (badgesLoading) {
    return <Loader open label="Loading milestones…" />;
  }

  if (badgesError) {
    return (
      <ErrorState
        title="Failed to load milestones"
        action={
          <Button variant="secondary" onClick={() => void refetchBadges()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <section className="space-y-6">
      <Loader
        open={isSaving || isDeleting || badgesFetching}
        label={
          isSaving
            ? editingBadgeId
              ? 'Updating milestone…'
              : 'Creating milestone…'
            : isDeleting
              ? 'Deleting milestone…'
              : 'Refreshing milestones…'
        }
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-spice-text-primary">
          Badge Management
        </h1>
        <p className="max-w-3xl text-sm text-spice-text-muted">
          Map milestone domain, image, and published modules so learners earn
          milestones when they complete all mapped active modules. Use the
          sequence arrows in the table to reorder the roadmap.
        </p>
      </div>

      {feedback ? (
        <Banner tone={feedback.tone}>{feedback.message}</Banner>
      ) : null}

      <Card variant="elevated" className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-spice-border pb-4">
          <div>
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-spice-text-primary">
              {isViewMode
                ? 'View milestone'
                : editingBadgeId
                  ? 'Edit milestone'
                  : 'Create milestone'}
              <Tooltip
                label="About milestone form"
                content="Choose domain, image, and published modules for the roadmap. Sequence is assigned automatically on create; reorder milestones with the table arrows."
                placement="bottom"
              />
            </h2>
          </div>
          {isViewMode ? (
            <span className="rounded-full bg-spice-bg-tint px-3 py-1 text-xs font-medium text-spice-text-primary">
              Viewing
            </span>
          ) : editingBadgeId ? (
            <span className="rounded-full bg-spice-brand-primary/10 px-3 py-1 text-xs font-medium text-spice-brand-primary">
              Editing
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <label className="block space-y-1.5 lg:col-span-6">
            <span className="text-xs font-semibold text-spice-text-primary">
              Milestone name{' '}
              <span className="text-spice-semantic-error">*</span>
            </span>
            <input
              className={FIELD_CLASS}
              value={form.name}
              placeholder="e.g. Safe Motherhood Champion"
              disabled={isViewMode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </label>

          <div className="space-y-1.5 lg:col-span-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-spice-text-primary">
              Domain <span className="text-spice-semantic-error">*</span>
              <Tooltip
                label="About domain"
                content="Select an existing domain. Published modules refresh for that domain; chatbot-only modules are excluded."
                placement="bottom"
              />
            </span>
            {isViewMode ? (
              <input
                className={FIELD_CLASS}
                value={formatModuleDomainLabel(form.domain)}
                disabled
                readOnly
              />
            ) : (
              <Combobox
                id="badge-form-domain"
                aria-label="Domain"
                value={form.domain}
                selectedLabel={
                  form.domain ? formatModuleDomainLabel(form.domain) : ''
                }
                options={domainComboboxOptions}
                searchTerm={domainSearchTerm}
                onSearchTermChange={setDomainSearchTerm}
                onChange={handleDomainChange}
                isLoading={formModuleDomainsFetching}
                placeholder="Search domains…"
                emptyMessage="No domains match your search"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="w-full max-w-[13rem] shrink-0">
            <BadgeImageUploadField
              required={!editingBadgeId && !isViewMode}
              disabled={isSaving || isViewMode}
              value={{
                storagePath: form.imageStoragePath,
                objectName: form.imageObjectName,
                previewUrl: form.imagePreviewUrl,
              }}
              onUploaded={(uploaded) => {
                setFormError('');
                setForm((prev) => ({
                  ...prev,
                  imageStoragePath: uploaded.storagePath,
                  imageObjectName: uploaded.objectName,
                  imagePreviewUrl: uploaded.previewUrl,
                  imageChanged: true,
                }));
              }}
              onError={(message) => setFormError(message)}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-spice-text-primary">
                Published modules{' '}
                <span className="text-spice-semantic-error">*</span>
                <Tooltip
                  label="About published modules"
                  content="Select a domain first. Only assignable published modules for that domain are listed; chatbot FAQ-only modules cannot be linked."
                  placement="bottom"
                />
              </span>
              <span className="text-xs text-spice-text-muted">
                {form.moduleIds.length} selected
              </span>
            </div>
            <BadgeModuleMultiSelect
              options={selectedDomain ? pickerModules : []}
              selectedIds={form.moduleIds}
              onChange={(moduleIds) =>
                setForm((prev) => ({ ...prev, moduleIds }))
              }
              disabled={isViewMode || !selectedDomain}
              searchValue={moduleSearchQuery}
              onSearchChange={setModuleSearchQuery}
              isLoading={Boolean(selectedDomain) && modulesLoading}
              emptyMessage={
                selectedDomain
                  ? 'No assignable published modules match your search.'
                  : 'Select a domain to load published modules.'
              }
            />
          </div>
        </div>

        {formError ? <Banner tone="critical">{formError}</Banner> : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-spice-border pt-4">
          {isViewMode ? (
            <>
              <Button variant="ghost" onClick={resetForm}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (viewingBadge) startEdit(viewingBadge);
                }}
              >
                Edit
              </Button>
            </>
          ) : editingBadgeId ? (
            <Button variant="ghost" onClick={resetForm} disabled={isSaving}>
              Cancel
            </Button>
          ) : null}
          {!isViewMode ? (
            <Button onClick={() => void handleSubmit()} disabled={isSaving}>
              {editingBadgeId ? 'Update' : 'Add'}
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="w-56 sm:w-64">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search milestones…"
            aria-label="Search milestones"
            className="min-w-0"
          />
        </div>
        <SettingsFilterTriggerButton
          active={filtersActive}
          expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}
          ariaLabel="Open milestone filters"
          tooltip="Filter by domain, creator, module, or created date"
        />
      </div>

      <Card className="overflow-hidden p-0">
        <Table
          data={badges}
          columns={columns}
          keyExtractor={(row) => row.id}
          emptyMessage="No milestones match the current filters."
          containerClassName="min-h-[12rem]"
        />
        <TablePagination
          page={page}
          pageSize={pageSize}
          pageSizeOptions={BADGE_PAGE_SIZE_OPTIONS}
          totalItems={totalBadges}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          pageInput={pageInput}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(0);
          }}
          onPageInputChange={handlePageInputChange}
          onCommitPageInput={commitPageInput}
          onPrevPage={() => setPage((current) => Math.max(0, current - 1))}
          onNextPage={() => setPage((current) => current + 1)}
        />
      </Card>

      <SettingsFilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter milestones"
        description="Choose filters, then click Apply to update the list."
        titleId="badge-filters-title"
        descriptionId="badge-filters-desc"
      >
        <BadgeManagementFiltersPanel
          filters={draftFilters}
          domainOptions={filterDomainComboboxOptions}
          domainSearchTerm={domainFilterSearchTerm}
          onDomainSearchTermChange={setDomainFilterSearchTerm}
          domainOptionsLoading={filterModuleDomainsFetching}
          createdByOptions={createdByOptions}
          moduleOptions={filterModuleOptions}
          moduleSearchTerm={moduleFilterSearchTerm}
          onModuleSearchTermChange={setModuleFilterSearchTerm}
          moduleOptionsLoading={filterModulesLoading}
          onChange={setDraftFilters}
          onClearAll={clearFilters}
          onApply={applyFilters}
        />
      </SettingsFilterDrawer>

      <Modal
        open={Boolean(deleteTarget)}
        labelledBy="delete-badge-title"
        describedBy="delete-badge-description"
        onClose={() => setDeleteTarget(null)}
      >
        <div className="mx-auto w-full max-w-md rounded-xl bg-spice-bg-surface p-6 shadow-spiceOverlay">
          <h2
            id="delete-badge-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            Delete milestone?
          </h2>
          <p
            id="delete-badge-description"
            className="mt-2 text-sm text-spice-text-medium"
          >
            This removes{' '}
            <span className="font-medium text-spice-text-primary">
              {deleteTarget?.name}
            </span>{' '}
            from the learner available/roadmap catalog. Soft-deleted milestones
            no longer appear as available; previously earned awards may still
            remain in history.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleConfirmDelete()}
              disabled={isDeleting}
              className="bg-spice-semantic-error hover:bg-spice-semantic-error/90"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
