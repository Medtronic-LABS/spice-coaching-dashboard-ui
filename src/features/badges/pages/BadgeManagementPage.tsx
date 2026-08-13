import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banner,
  Button,
  Card,
  type ComboboxOption,
  ErrorState,
  Loader,
  Modal,
  SearchInput,
  Tooltip,
  TruncatedText,
} from '@/components/ui';
import { ArrowRightIcon, CloseIcon, SearchIcon } from '@/assets/icon';
import { Table } from '@/components/common/Table';
import { TablePagination } from '@/components/common/TablePagination';
import {
  SettingsFilterDrawer,
  SettingsFilterTriggerButton,
} from '@/components/common/SettingsFilterDrawer';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import {
  useCommitBadgeSequenceOrderMutation,
  useCreateBadgeMutation,
  useDeleteBadgeMutation,
  useFetchBadgesQuery,
  useLazyFetchBadgesQuery,
  useUpdateBadgeMutation,
} from '@/features/badges/api/adminBadgesApi';
import { BadgeFormModal } from '@/features/badges/components/BadgeFormModal';
import type {
  BadgeFormMode,
  BadgeFormState,
} from '@/features/badges/components/BadgeFormModal';
import { BadgeImageThumb } from '@/features/badges/components/BadgeImageThumb';
import { BadgeManagementFiltersPanel } from '@/features/badges/components/BadgeManagementFiltersPanel';
import { BadgeSequenceReorderList } from '@/features/badges/components/BadgeSequenceReorderList';
import type { PublishedModuleOption } from '@/features/badges/components/BadgeModuleMultiSelect';
import {
  EMPTY_BADGE_FILTERS,
  type AdminBadge,
  type AdminBadgeListQuery,
  type AdminBadgeWriteBody,
  type BadgeManagementFilters,
} from '@/features/badges/types/badge.types';
import {
  buildBadgeListDateParams,
  getMutationErrorMessage,
  hasActiveBadgeFilters,
  isDateRangeInvalid,
  nextGlobalBadgeSequence,
  objectNameFromStoragePath,
  reorderBadges,
  sortBadgesBySequenceAsc,
} from '@/features/badges/utils/badgeForm';
import {
  useFetchModulesQuery,
  useLazyFetchModulesQuery,
} from '@/features/modules/api/adminModulesApi';
import type { AdminModulesListItem } from '@/features/modules/api/adminModulesApi';
import { isAssignablePublishedModule } from '@/features/modules/utils/isAssignablePublishedModule';
import { resolveDisplayText } from '@/config/deploymentLocale';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAutoDismissFeedback } from '@/hooks/useAutoDismissFeedback';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

const BADGE_PAGE_SIZE_OPTIONS = [5, 10, 15, 25, 50] as const;
const DEFAULT_BADGE_PAGE_SIZE = 10;
const MODULE_PICKER_PAGE_SIZE = 50;
/** Used for filter options and full-list sequence editing. */
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
const SEQUENCE_EDIT_INFO =
  'Enabling Rearrange Milestone clears search and filters, disables them, and loads all milestones for drag reordering. Use Reset to restore the initial order, or Back to list to discard changes and return to the table.';
const PAGE_SUBTITLE =
  'Configure milestones by mapping an image and published modules. Learners earn a milestone after completing all mapped active modules. Use Rearrange Milestone to reorder milestones on the roadmap.';
const TOOLBAR_BUTTON_CLASS = 'h-9 text-xs';

type FeedbackState =
  | { tone: 'success'; message: string }
  | { tone: 'critical'; message: string }
  | null;

function emptyForm(): BadgeFormState {
  return {
    name: '',
    moduleIds: [],
    imageStoragePath: '',
    imageObjectName: '',
    imagePreviewUrl: '',
    imagePendingUpload: false,
    imageChanged: false,
  };
}

function formFromBadge(badge: AdminBadge): BadgeFormState {
  return {
    name: badge.name,
    moduleIds: [...badge.module_ids],
    imageStoragePath: badge.image_storage_path,
    imageObjectName: objectNameFromStoragePath(badge.image_storage_path),
    imagePreviewUrl: '',
    imagePendingUpload: false,
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
      domain: badge.domain,
    };
  }
  return cache;
}

export const BadgeManagementPage = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [moduleFilterSearchTerm, setModuleFilterSearchTerm] = useState('');
  const debouncedModuleSearchQuery = useDebouncedValue(
    moduleSearchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const debouncedModuleFilterSearchTerm = useDebouncedValue(
    moduleFilterSearchTerm,
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
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<BadgeFormMode>('create');
  const [selectedModuleCache, setSelectedModuleCache] = useState<
    Record<string, PublishedModuleOption>
  >({});
  const [activeBadge, setActiveBadge] = useState<AdminBadge | null>(null);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBadge | null>(null);

  const [isSequenceEditing, setIsSequenceEditing] = useState(false);
  const [sequenceBaseline, setSequenceBaseline] = useState<AdminBadge[]>([]);
  const [sequenceDraft, setSequenceDraft] = useState<AdminBadge[]>([]);
  const [sequenceCatalogTruncated, setSequenceCatalogTruncated] =
    useState(false);
  const [isEnteringSequenceEdit, setIsEnteringSequenceEdit] = useState(false);

  const dateParams = useMemo(
    () => buildBadgeListDateParams(appliedFilters),
    [appliedFilters],
  );

  const listQueryArgs = useMemo(
    () => ({
      q: debouncedQuery.trim() || undefined,
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
    refetch: refetchBadges,
  } = useFetchBadgesQuery(listQueryArgs, { skip: isSequenceEditing });

  /** Full catalog for filter options and Edit Sequence eligibility. */
  const { data: catalogList } = useFetchBadgesQuery(BADGE_CATALOG_QUERY);
  const [fetchBadgeCatalog] = useLazyFetchBadgesQuery();
  const [triggerModulesPage] = useLazyFetchModulesQuery();

  const moduleLookupQuery = debouncedModuleSearchQuery.trim();
  const [loadedPublishedModules, setLoadedPublishedModules] = useState<
    PublishedModuleOption[]
  >([]);
  const [modulesTotal, setModulesTotal] = useState(0);
  const [modulesOffset, setModulesOffset] = useState(0);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesLoadingMore, setModulesLoadingMore] = useState(false);
  const [modulesLoadError, setModulesLoadError] = useState(false);

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
  const [commitBadgeSequenceOrder, { isLoading: isSavingSequence }] =
    useCommitBadgeSequenceOrderMutation();
  const [deleteBadge, { isLoading: isDeleting }] = useDeleteBadgeMutation();

  const mapPublishedModuleOption = useCallback(
    (module: AdminModulesListItem): PublishedModuleOption | null => {
      if (!isAssignablePublishedModule(module)) return null;
      return {
        id: module.id,
        title: resolveDisplayText(module.title) || module.id,
        domain: module.domain,
      };
    },
    [],
  );

  const loadPublishedModulesPage = useCallback(
    async (offset: number, append: boolean) => {
      if (!formOpen) return;
      if (append) {
        setModulesLoadingMore(true);
      } else {
        setModulesLoading(true);
      }
      setModulesLoadError(false);

      try {
        const page = await triggerModulesPage({
          status: 'published',
          chatbot_faqs_only: false,
          limit: MODULE_PICKER_PAGE_SIZE,
          offset,
          q: moduleLookupQuery || undefined,
          sort_by: 'title',
          sort_dir: 'asc',
        }).unwrap();

        const mapped = page.modules
          .map(mapPublishedModuleOption)
          .filter((module): module is PublishedModuleOption => module !== null);

        setModulesTotal(page.total_modules);
        setModulesOffset(page.offset + page.modules.length);
        setLoadedPublishedModules((prev) => {
          if (!append) return mapped;
          const seen = new Set(prev.map((module) => module.id));
          const next = [...prev];
          for (const module of mapped) {
            if (seen.has(module.id)) continue;
            next.push(module);
            seen.add(module.id);
          }
          return next;
        });
      } catch {
        setModulesLoadError(true);
      } finally {
        setModulesLoading(false);
        setModulesLoadingMore(false);
      }
    },
    [formOpen, mapPublishedModuleOption, moduleLookupQuery, triggerModulesPage],
  );

  useEffect(() => {
    if (!formOpen) {
      setLoadedPublishedModules([]);
      setModulesTotal(0);
      setModulesOffset(0);
      setModulesLoading(false);
      setModulesLoadingMore(false);
      setModulesLoadError(false);
      return;
    }
    void loadPublishedModulesPage(0, false);
  }, [formOpen, loadPublishedModulesPage]);

  useEffect(() => {
    if (loadedPublishedModules.length === 0) return;
    setSelectedModuleCache((prev) => {
      const next = { ...prev };
      for (const module of loadedPublishedModules) {
        next[module.id] = module;
      }
      return next;
    });
  }, [loadedPublishedModules]);

  const modulesHasMore = modulesOffset < modulesTotal;

  const pickerModules = useMemo(() => {
    const merged: PublishedModuleOption[] = [];
    const seen = new Set<string>();

    // Keep published search order stable; do not hoist selected rows to the top.
    for (const module of loadedPublishedModules) {
      if (seen.has(module.id)) continue;
      merged.push(module);
      seen.add(module.id);
    }

    for (const moduleId of form.moduleIds) {
      if (seen.has(moduleId)) continue;
      const selected = selectedModuleCache[moduleId];
      if (!selected) continue;
      merged.push(selected);
      seen.add(selected.id);
    }

    return merged;
  }, [form.moduleIds, loadedPublishedModules, selectedModuleCache]);

  const badges = useMemo(() => badgeList?.badges ?? [], [badgeList?.badges]);
  const catalogBadges = useMemo(
    () => catalogList?.badges ?? badges,
    [badges, catalogList?.badges],
  );
  const totalBadges = badgeList?.total ?? badges.length;
  const totalPages = badgeList?.total_pages ?? 0;
  const hasPrevPage = page > 0;
  const hasNextPage = totalPages > 0 && page + 1 < totalPages;
  const rangeStart = badges.length ? page * pageSize + 1 : 0;
  const rangeEnd = badges.length ? page * pageSize + badges.length : 0;
  const canEditSequence =
    (catalogList?.total ?? catalogList?.badges.length ?? totalBadges) >= 2;

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

  const isSaving = isCreating || isUpdating;
  const filtersActive = hasActiveBadgeFilters(appliedFilters);
  const hasSequenceDraftChanges = useMemo(() => {
    if (sequenceBaseline.length !== sequenceDraft.length) return true;
    return sequenceBaseline.some(
      (badge, index) => badge.id !== sequenceDraft[index]?.id,
    );
  }, [sequenceBaseline, sequenceDraft]);

  useAutoDismissFeedback(feedback, () => setFeedback(null));

  const resetForm = useCallback(() => {
    setForm(emptyForm());
    setSelectedModuleCache({});
    setModuleSearchQuery('');
    setActiveBadge(null);
    setFormMode('create');
    setFormOpen(false);
    setFormError('');
  }, []);

  const startCreate = useCallback(() => {
    setForm(emptyForm());
    setSelectedModuleCache({});
    setModuleSearchQuery('');
    setActiveBadge(null);
    setFormMode('create');
    setFormOpen(true);
    setFormError('');
    setFeedback(null);
  }, []);

  const startEdit = useCallback((badge: AdminBadge) => {
    setForm(formFromBadge(badge));
    setSelectedModuleCache(moduleCacheFromBadge(badge));
    setModuleSearchQuery('');
    setActiveBadge(badge);
    setFormMode('edit');
    setFormOpen(true);
    setFormError('');
    setFeedback(null);
  }, []);

  const startView = useCallback((badge: AdminBadge) => {
    setForm(formFromBadge(badge));
    setSelectedModuleCache(moduleCacheFromBadge(badge));
    setModuleSearchQuery('');
    setActiveBadge(badge);
    setFormMode('view');
    setFormOpen(true);
    setFormError('');
    setFeedback(null);
  }, []);

  const resolveWriteDomain = useCallback((): string | null => {
    for (const moduleId of form.moduleIds) {
      const fromPicker = pickerModules.find((module) => module.id === moduleId);
      const domain = (
        fromPicker ?? selectedModuleCache[moduleId]
      )?.domain.trim();
      if (domain) return domain;
    }
    return activeBadge?.domain.trim() || null;
  }, [activeBadge?.domain, form.moduleIds, pickerModules, selectedModuleCache]);

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'Milestone name is required.';
    if (formMode === 'create' && !form.imageChanged) {
      return 'Upload a milestone image before adding.';
    }
    if (formMode === 'edit' && form.imagePendingUpload && !form.imageChanged) {
      return 'Finish uploading the selected milestone image before updating.';
    }
    if (!form.imageStoragePath.trim()) {
      return 'Milestone image is required.';
    }
    if (form.moduleIds.length === 0) {
      return 'Select at least one published module.';
    }
    if (!resolveWriteDomain()) {
      return 'Unable to determine domain from the selected modules.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (formMode === 'edit' && !form.imageChanged && !form.imageStoragePath) {
      setFormError('Milestone image is required.');
      return;
    }

    if (formMode === 'create' && !form.imageChanged) {
      setFormError('Upload a milestone image before adding.');
      return;
    }

    setFormError('');
    setFeedback(null);

    const domain = resolveWriteDomain();
    if (!domain) {
      setFormError('Unable to determine domain from the selected modules.');
      return;
    }
    let sequence: number | null =
      formMode === 'edit' ? (activeBadge?.sequence ?? null) : null;

    if (formMode === 'create') {
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
      if (formMode === 'edit' && activeBadge) {
        await updateBadge({ badgeId: activeBadge.id, body }).unwrap();
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

  const exitSequenceEdit = useCallback(() => {
    setIsSequenceEditing(false);
    setSequenceBaseline([]);
    setSequenceDraft([]);
    setSequenceCatalogTruncated(false);
  }, []);

  const handleEnterSequenceEdit = useCallback(async () => {
    setFeedback(null);
    setFormOpen(false);
    setFiltersOpen(false);
    setQuery('');
    setDraftFilters(EMPTY_BADGE_FILTERS);
    setAppliedFilters(EMPTY_BADGE_FILTERS);
    setPage(0);
    setIsEnteringSequenceEdit(true);

    try {
      const catalog = await fetchBadgeCatalog(BADGE_CATALOG_QUERY).unwrap();
      const ordered = sortBadgesBySequenceAsc(catalog.badges);
      if (ordered.length < 2) {
        setFeedback({
          tone: 'critical',
          message: 'At least two milestones are required to edit sequence.',
        });
        return;
      }
      if (catalog.total > ordered.length) {
        setSequenceCatalogTruncated(true);
        setFeedback({
          tone: 'critical',
          message: `Only the first ${ordered.length} of ${catalog.total} milestones can be rearranged in this view. Save is disabled until the catalog fits the limit.`,
        });
      } else {
        setSequenceCatalogTruncated(false);
      }
      setSequenceBaseline(ordered);
      setSequenceDraft(ordered);
      setIsSequenceEditing(true);
    } catch (error) {
      setFeedback({
        tone: 'critical',
        message: getMutationErrorMessage(error),
      });
    } finally {
      setIsEnteringSequenceEdit(false);
    }
  }, [fetchBadgeCatalog]);

  const handleSequenceReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setSequenceDraft((prev) => reorderBadges(prev, fromIndex, toIndex));
    },
    [],
  );

  const handleResetSequence = useCallback(() => {
    setSequenceDraft([...sequenceBaseline]);
    setFeedback(null);
  }, [sequenceBaseline]);

  const handleBackToList = useCallback(() => {
    setFeedback(null);
    exitSequenceEdit();
  }, [exitSequenceEdit]);

  const handleSaveSequence = useCallback(async () => {
    if (sequenceCatalogTruncated) {
      setFeedback({
        tone: 'critical',
        message:
          'Cannot save rearrangement while the milestone catalog exceeds the editable limit.',
      });
      return;
    }
    setFeedback(null);
    try {
      await commitBadgeSequenceOrder({
        baseline: sequenceBaseline,
        draft: sequenceDraft,
      }).unwrap();
      setFeedback({
        tone: 'success',
        message: 'Milestone sequence updated successfully.',
      });
      exitSequenceEdit();
    } catch (error) {
      setFeedback({
        tone: 'critical',
        message: getMutationErrorMessage(error),
      });
    }
  }, [
    commitBadgeSequenceOrder,
    exitSequenceEdit,
    sequenceBaseline,
    sequenceCatalogTruncated,
    sequenceDraft,
  ]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setFeedback(null);
    try {
      await deleteBadge({ badgeId: deleteTarget.id }).unwrap();
      if (activeBadge?.id === deleteTarget.id) {
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
    if (isSequenceEditing) return;
    if (isDateRangeInvalid(draftFilters.createdFrom, draftFilters.createdTo)) {
      return;
    }
    setPage(0);
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setPage(0);
    setDraftFilters(EMPTY_BADGE_FILTERS);
    setAppliedFilters(EMPTY_BADGE_FILTERS);
  };

  const columns = useMemo<ColumnDef<AdminBadge>[]>(
    () => [
      {
        key: 'sequence',
        header: 'Seq No.',
        className: 'w-24 whitespace-nowrap px-2 sm:px-3',
        headerClassName: 'w-24 whitespace-nowrap px-2 sm:px-3',
        render: (row) => (
          <span className="font-medium tabular-nums text-spice-text-primary">
            {row.sequence ?? '—'}
          </span>
        ),
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
          const label = titles.join(', ');
          return (
            <div className="w-full min-w-0 max-w-[16rem]">
              <TruncatedText
                text={label}
                className="text-sm text-spice-text-medium"
              />
            </div>
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
    [startEdit, startView],
  );

  if (badgesLoading && !isSequenceEditing) {
    return <Loader open label="Loading milestones…" />;
  }

  if (badgesError && !isSequenceEditing) {
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

  // Keep search/filter refetches quiet — only block for mutations / sequence mode.
  const loaderOpen =
    isSaving || isDeleting || isSavingSequence || isEnteringSequenceEdit;

  return (
    <section className="space-y-6">
      <Loader
        open={loaderOpen}
        label={
          isSavingSequence || isEnteringSequenceEdit
            ? isSavingSequence
              ? 'Saving rearrangement…'
              : 'Loading milestones for sequence edit…'
            : isSaving
              ? formMode === 'edit'
                ? 'Updating milestone…'
                : 'Creating milestone…'
              : isDeleting
                ? 'Deleting milestone…'
                : 'Working…'
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-xl space-y-1">
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            Milestone Management
          </h1>
          <p className="text-sm text-spice-text-muted">{PAGE_SUBTITLE}</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {isSequenceEditing ? (
            <>
              <Button
                variant="ghost"
                aria-label="Back to list"
                title="Back to list"
                onClick={handleBackToList}
                disabled={isSavingSequence}
                className="h-9 w-9 p-0"
              >
                <ArrowRightIcon className="h-5 w-5 rotate-180" />
              </Button>
              <Button
                variant="secondary"
                className={TOOLBAR_BUTTON_CLASS}
                onClick={handleResetSequence}
                disabled={isSavingSequence || !hasSequenceDraftChanges}
              >
                Reset
              </Button>
              <Button
                className={TOOLBAR_BUTTON_CLASS}
                onClick={() => void handleSaveSequence()}
                disabled={
                  isSavingSequence ||
                  sequenceCatalogTruncated ||
                  !hasSequenceDraftChanges
                }
              >
                Save Rearrangement
              </Button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Button
                variant="secondary"
                className={TOOLBAR_BUTTON_CLASS}
                onClick={() => void handleEnterSequenceEdit()}
                disabled={!canEditSequence || isEnteringSequenceEdit}
              >
                Rearrange Milestone
              </Button>
              <Tooltip
                label="About rearrange milestone"
                content={SEQUENCE_EDIT_INFO}
                placement="bottom"
              />
            </span>
          )}

          <Button
            className={TOOLBAR_BUTTON_CLASS}
            onClick={startCreate}
            disabled={isSequenceEditing || isEnteringSequenceEdit}
          >
            Create Milestone
          </Button>

          {isSequenceEditing ? (
            <button
              type="button"
              disabled
              aria-label="Search milestones"
              title="Search is disabled while rearranging milestones"
              className="inline-flex h-10 w-10 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-spice-border-mid bg-spice-bg-surface text-spice-text-primary opacity-50 shadow-sm"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-56 sm:w-64">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search milestones…"
                aria-label="Search milestones"
                className="min-w-0"
              />
            </div>
          )}
          <SettingsFilterTriggerButton
            active={filtersActive}
            expanded={filtersOpen}
            onClick={() => setFiltersOpen(true)}
            ariaLabel="Open milestone filters"
            tooltip={
              isSequenceEditing
                ? 'Filters are disabled while rearranging milestones'
                : 'Filter by creator, module, or created date'
            }
            disabled={isSequenceEditing}
          />
        </div>
      </div>

      {feedback ? (
        <Banner tone={feedback.tone}>
          <div className="flex items-center justify-between gap-3">
            <span>{feedback.message}</span>
            {feedback.tone === 'success' ? (
              <Button
                variant="ghost"
                aria-label="Dismiss success message"
                onClick={() => setFeedback(null)}
                className="h-8 w-8 p-0"
              >
                <CloseIcon className="h-5 w-5" />
              </Button>
            ) : null}
          </div>
        </Banner>
      ) : null}

      <Card className="overflow-hidden p-0">
        {isSequenceEditing ? (
          <BadgeSequenceReorderList
            badges={sequenceDraft}
            disabled={isSavingSequence}
            onReorder={handleSequenceReorder}
          />
        ) : (
          <>
            <Table
              data={badges}
              columns={columns}
              keyExtractor={(row) => row.id}
              emptyMessage="No milestones match the current filters."
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
          </>
        )}
      </Card>

      <SettingsFilterDrawer
        open={filtersOpen && !isSequenceEditing}
        onClose={() => setFiltersOpen(false)}
        title="Filter milestones"
        description="Choose filters, then click Apply to update the list."
        titleId="badge-filters-title"
        descriptionId="badge-filters-desc"
      >
        <BadgeManagementFiltersPanel
          filters={draftFilters}
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

      <BadgeFormModal
        open={formOpen && !isSequenceEditing}
        mode={formMode}
        form={form}
        imageResetKey={
          activeBadge?.id ?? `create-${formOpen ? 'open' : 'closed'}`
        }
        formError={formError}
        isSaving={isSaving}
        pickerModules={pickerModules}
        modulesLoading={modulesLoading}
        moduleSearchQuery={moduleSearchQuery}
        onModuleSearchChange={setModuleSearchQuery}
        modulesHasMore={modulesHasMore}
        onModulesLoadMore={() => {
          if (modulesLoading || modulesLoadingMore || !modulesHasMore) return;
          void loadPublishedModulesPage(modulesOffset, true);
        }}
        modulesLoadingMore={modulesLoadingMore}
        modulesLoadError={modulesLoadError}
        onModulesLoadMoreRetry={() => {
          void loadPublishedModulesPage(modulesOffset, modulesOffset > 0);
        }}
        onFormChange={setForm}
        onClose={resetForm}
        onSubmit={() => void handleSubmit()}
        onEditFromView={() => {
          if (activeBadge) startEdit(activeBadge);
        }}
        onFormError={setFormError}
      />

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
            Delete Milestone?
          </h2>
          <p
            id="delete-badge-description"
            className="mt-2 text-sm text-spice-text-medium"
          >
            Are you sure you want to delete{' '}
            <span className="font-medium text-spice-text-primary">
              “{deleteTarget?.name}”
            </span>
            ?
          </p>
          <p className="mt-3 text-sm text-spice-text-medium">
            Deleting this milestone will remove it from the learner roadmap and
            prevent it from being awarded to learners in the future. Previously
            awarded milestones will remain in learners’ history.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              className="h-9 text-xs"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleConfirmDelete()}
              disabled={isDeleting}
              className="h-9 bg-spice-semantic-error text-xs hover:bg-spice-semantic-error/90"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
