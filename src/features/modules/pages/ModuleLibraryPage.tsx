import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  FormLabel,
  LimitedTextInput,
  LimitedTextarea,
  Loader,
  Modal,
  ModalTitle,
  QuotedDisplayLabel,
  SearchInput,
  Select,
  StatusBadge,
  TABLE_STATUS_BADGE_CLASSNAME,
  Tabs,
  Tooltip,
  TruncatedText,
  typographyClasses,
  useSnackbar,
} from '@/components/ui';
import { Table } from '@/components/common/Table';
import { PageTitle } from '@/components/common/PageTitle';
import { TablePagination } from '@/components/common/TablePagination';
import {
  SettingsFilterDrawer,
  SettingsFilterTriggerButton,
} from '@/components/common/SettingsFilterDrawer';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { adminModuleReviewPaths } from '@/constants/routes';
import {
  FIELD_LIMITS,
  TABLE_CELL_LABEL_MAX_LENGTH,
  TABLE_TITLE_COLUMN_CLASS,
  fieldLimitExceededMessage,
} from '@/constants/fieldLimits';
import { truncateDisplayText } from '@/utils/truncateDisplayText';
import {
  useCreateModuleMutation,
  useDeactivateModuleMutation,
  useDeleteModuleMutation,
  useFetchModuleDomainOptionsQuery,
  useFetchModulesQuery,
  useOverrideMergeModuleMutation,
  useReactivateModuleMutation,
  useSplitMergeModuleMutation,
} from '@/features/modules/api/adminModulesApi';
import { usePublishModuleMutation } from '@/features/modules/api/moduleCreationPipelineApi';
import { useFetchSourceDocumentsQuery } from '@/features/modules/api/adminSourceDocumentsApi';
import { ModuleAssignmentDialog } from '@/features/modules/components/ModuleAssignmentDialog';
import { ModuleAssignedUsersCell } from '@/features/modules/components/ModuleAssignedUsersCell';
import { ChatbotFaqsOnlyField } from '@/features/modules/components/ChatbotFaqsOnlyField';
import { ModuleLibraryFilters } from '@/features/modules/components/ModuleLibraryFilters';
import { ModuleTaxonomyField } from '@/features/modules/components/ModuleTaxonomyField';
import {
  NEEDS_REVIEW_TOOLTIP_CONTENT,
  NeedsReviewTab,
} from '@/features/modules/components/NeedsReviewTab';
import {
  ModulePublishedSuccessModal,
  type ModulePublishedSuccessSummary,
} from '@/features/modules/components/ModulePublishedSuccessModal';
import { isAssignablePublishedModule } from '@/features/modules/utils/isAssignablePublishedModule';
import { DiscardedTabTable } from '@/features/modules/components/DiscardedTabTable';
import { getModuleStatusBadgeProps } from '@/features/modules/utils/moduleStatusBadge';
import { useModuleListFilters } from '@/features/modules/hooks/useModuleListFilters';
import type {
  ModuleLibraryItem,
  ModuleStatus,
} from '@/features/modules/types/moduleLibrary.types';
import type {
  ModuleLibraryLocationState,
  ModuleLibraryTab,
} from '@/features/modules/types/moduleLibraryNavigation.types';
import { sourceDocumentFilterLabel } from '@/features/modules/utils/moduleDocumentFilter';
import {
  buildModuleListTypedDateParams,
  EMPTY_MODULE_LIBRARY_FILTERS,
  formatModuleDomainLabel,
  getModuleActivatedAt,
  getModuleDeactivatedAt,
  getModuleListingActorColumns,
  getModuleListingDateColumns,
  getModuleListEmptyMessage,
  hasActiveModuleFilters,
  isAnyVisibleDateRangeInvalid,
  type ModuleLibraryFilters as ModuleLibraryFilterState,
} from '@/features/modules/utils/moduleListFilters';
import {
  listingActorColumnDef,
  listingDateColumnDef,
} from '@/features/modules/utils/moduleLibraryColumnDefs';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';
import {
  appendRecentIngestDocument,
  readRecentIngestDocuments,
} from '@/features/ingest/utils/recentIngestDocumentsStorage';
import { formatEstimatedMinutesDisplay } from '@/features/ingest/utils/formatEstimatedMinutesDisplay';
import { CONTENT_DOMAIN_TYPE_TOOLTIP } from '@/features/ingest/constants/ingestConfigurationTooltips';
import { INGEST_CONTENT_DOMAIN_OPTIONS } from '@/features/ingest/constants/ingestFormOptions';
import type { IngestContentDomain } from '@/features/ingest/api/adminIngestApi';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { cn } from '@/utils';
import { resolveDisplayText } from '@/config/deploymentLocale';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTablePageInput } from '@/hooks/useTablePageInput';
import {
  DEFAULT_TABLE_PAGE_SIZE,
  TABLE_PAGE_SIZE_OPTIONS,
  tableHasNextPage,
  tableHasPrevPage,
  tablePageOffset,
  tablePaginationRange,
} from '@/utils/tablePagination';
import {
  CREATE_MODULE_FORM_DEFAULTS,
  CREATE_MODULE_FORM_PLACEHOLDERS,
} from '@/features/modules/constants/createModuleFormDefaults';
import {
  MODULE_LIBRARY_ACTION_BUTTON_CLASS,
  MODULE_LIBRARY_ACTION_WIDTH_CLASS,
} from '@/features/modules/constants/moduleLibraryActionStyles';
import { normalizeModuleTaxonomyLabel } from '@/features/modules/utils/normalizeModuleTaxonomyLabel';
import {
  MAX_ESTIMATED_MINUTES,
  MAX_ESTIMATED_MINUTES_DIGITS,
  formatEstimatedMinutesFieldValue,
  getEstimatedMinutesValidationError,
  parseEstimatedMinutesInput,
} from '@/features/modules/utils/estimatedMinutesValidation';
import { createEmptyAdminModuleCard } from '@/features/modules/utils/adminModuleCardUtils';
import { createEmptyAdminModuleQuizItem } from '@/features/modules/utils/adminModuleQuizUtils';

const DIFFICULTY_LEVEL_OPTIONS = ['easy', 'moderate', 'hard'] as const;

/** Minimum characters before the module list search hits the API. */
const MODULE_SEARCH_MIN_CHARS = 1;
const MODULE_SEARCH_DEBOUNCE_MS = 300;
/** Page size for the server-side source document typeahead. */
const SOURCE_DOCUMENT_SEARCH_LIMIT = 50;

const CREATE_MODULE_INPUT_CLASS =
  'h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm';

type ModuleLibraryActionSlot = 'assign' | 'review' | 'publish' | 'deactivate';

const MODULE_LIBRARY_ACTION_SLOT_CLASS: Record<
  ModuleLibraryActionSlot,
  string
> = {
  assign: `inline-flex h-8 ${MODULE_LIBRARY_ACTION_WIDTH_CLASS} shrink-0 justify-start`,
  review: `inline-flex h-8 ${MODULE_LIBRARY_ACTION_WIDTH_CLASS} shrink-0 justify-start`,
  publish: `inline-flex h-8 ${MODULE_LIBRARY_ACTION_WIDTH_CLASS} shrink-0 justify-start`,
  deactivate: `inline-flex h-8 ${MODULE_LIBRARY_ACTION_WIDTH_CLASS} shrink-0 justify-start`,
};

function getModuleLibraryActionSlots(
  tab: ModuleLibraryTab,
): ModuleLibraryActionSlot[] {
  if (tab === 'published') {
    return ['assign', 'deactivate'];
  }
  if (tab === 'drafts') {
    return ['review', 'publish'];
  }
  return [];
}

function ModuleLibraryActionSlot({
  slot,
  children,
}: {
  slot: ModuleLibraryActionSlot;
  children?: ReactNode;
}) {
  return (
    <div
      className={MODULE_LIBRARY_ACTION_SLOT_CLASS[slot]}
      data-action-slot={slot}
    >
      {children ?? (
        <span
          className="inline-flex h-full w-full items-center justify-center text-spice-text-medium"
          aria-hidden="true"
        >
          —
        </span>
      )}
    </div>
  );
}

type AdminModuleDifficultyLevel = (typeof DIFFICULTY_LEVEL_OPTIONS)[number];

type CreateModuleFormState = {
  title_bn: string;
  description_bn: string;
  domain: string;
  content_domain: IngestContentDomain;
  module_type: string;
  estimated_minutes: number;
  difficulty_level: AdminModuleDifficultyLevel;
  chatbot_faqs_only: boolean;
};

function createEmptyCreateForm(): CreateModuleFormState {
  return {
    title_bn: '',
    description_bn: '',
    domain: '',
    content_domain: CREATE_MODULE_FORM_DEFAULTS.content_domain,
    module_type: 'refresher',
    estimated_minutes: CREATE_MODULE_FORM_DEFAULTS.estimated_minutes,
    difficulty_level: CREATE_MODULE_FORM_DEFAULTS.difficulty_level,
    chatbot_faqs_only: CREATE_MODULE_FORM_DEFAULTS.chatbot_faqs_only,
  };
}

const moduleBadge = (status: ModuleStatus) => (
  <StatusBadge
    {...getModuleStatusBadgeProps(status)}
    className={TABLE_STATUS_BADGE_CLASSNAME}
  />
);

function isNeedsReviewStatus(status?: string): boolean {
  const norm = (status || '').trim().toLowerCase();
  return (
    norm === 'review_pending' ||
    norm === 'needs_review' ||
    norm === 'review pending' ||
    norm === 'pending_review' ||
    norm === 'needs review'
  );
}

export const ModuleLibraryPage = () => {
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, MODULE_SEARCH_DEBOUNCE_MS);
  const searchQ = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    return trimmed.length >= MODULE_SEARCH_MIN_CHARS ? trimmed : undefined;
  }, [debouncedQuery]);
  const {
    tab,
    activeFilters,
    lifecycleStatus,
    setTab,
    setFilters,
    resolveExternalViewSearch,
  } = useModuleListFilters();
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [paginationTotalPages, setPaginationTotalPages] = useState(0);
  const {
    page,
    setPage,
    pageInput,
    resetPage,
    commitPageInput,
    handlePageInputChange,
  } = useTablePageInput(paginationTotalPages);

  useEffect(() => {
    resetPage();
  }, [searchQ, resetPage]);

  const [createOpen, setCreateOpen] = useState(false);
  const [expandedReviewModuleId, setExpandedReviewModuleId] = useState<
    string | null
  >(null);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ModuleLibraryFilterState>(
    EMPTY_MODULE_LIBRARY_FILTERS,
  );
  const [documentSearch, setDocumentSearch] = useState('');
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [deactivateModuleData, setDeactivateModuleData] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentModule, setAssignmentModule] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState<CreateModuleFormState>(
    createEmptyCreateForm,
  );
  const [createModule, { isLoading: isCreating }] = useCreateModuleMutation();
  const estimatedMinutesError = getEstimatedMinutesValidationError(
    createForm.estimated_minutes,
  );
  const [deactivateModule, { isLoading: isDeactivating }] =
    useDeactivateModuleMutation();
  const [reactivateModule, { isLoading: isReactivating }] =
    useReactivateModuleMutation();
  const [reactivatingModuleId, setReactivatingModuleId] = useState<
    string | null
  >(null);
  const [publishModule, { isLoading: isPublishing }] =
    usePublishModuleMutation();
  const [publishingModuleId, setPublishingModuleId] = useState<string | null>(
    null,
  );
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const [publishSuccessSummary, setPublishSuccessSummary] =
    useState<ModulePublishedSuccessSummary | null>(null);
  const [overrideMergeModule] = useOverrideMergeModuleMutation();
  const [splitMergeModule] = useSplitMergeModuleMutation();
  const [deleteModule] = useDeleteModuleMutation();

  const handleOverrideMerge = async (moduleId: string) => {
    await overrideMergeModule({ moduleId }).unwrap();
    refreshModuleList();
  };

  const handleKeepNewReview = async (moduleId: string) => {
    await splitMergeModule({ moduleId }).unwrap();
    refreshModuleList();
  };

  const handleSkipReview = async (moduleId: string) => {
    await deleteModule({ moduleId }).unwrap();
    refreshModuleList();
  };

  const handleViewModule = (moduleId: string) => {
    navigate(adminModuleReviewPaths.details(moduleId));
  };

  const dateRangeInvalid = isAnyVisibleDateRangeInvalid(activeFilters, tab);
  const dateParams = buildModuleListTypedDateParams(activeFilters, tab);
  const filtersActive = hasActiveModuleFilters(activeFilters, tab);
  const [sortBy, setSortBy] = useState<string | undefined>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = useCallback(
    (newSortBy: string, newSortDir: 'asc' | 'desc') => {
      setSortBy(newSortBy);
      setSortDir(newSortDir);
      resetPage();
    },
    [resetPage],
  );

  const { data: domainOptions = [], refetch: refetchDomainOptions } =
    useFetchModuleDomainOptionsQuery({});
  const {
    currentData: currentModulesPage,
    refetch,
    isFetching: isFetchingModules,
    isError: modulesQueryError,
    error: modulesFetchError,
    isUninitialized: modulesQueryUninitialized,
  } = useFetchModulesQuery(
    {
      limit: pageSize,
      offset: tablePageOffset(page, pageSize),
      status: lifecycleStatus,
      domain: activeFilters.domain || undefined,
      ...dateParams,
      sourceDocumentId: activeFilters.sourceDocumentId || undefined,
      q: searchQ,
      sort_by: sortBy,
      sort_dir: sortDir,
    },
    { skip: dateRangeInvalid },
  );
  const modulesForList = useMemo(
    () => (dateRangeInvalid ? [] : (currentModulesPage?.modules ?? [])),
    [dateRangeInvalid, currentModulesPage?.modules],
  );
  const totalModules = currentModulesPage?.total_modules ?? 0;
  const totalPages = currentModulesPage?.total_pages ?? 0;

  useEffect(() => {
    setPaginationTotalPages(totalPages);
  }, [totalPages]);

  const refreshModuleList = useCallback(() => {
    if (dateRangeInvalid || modulesQueryUninitialized) return;
    try {
      void refetch().catch(() => undefined);
    } catch {
      // Query may be skipped or unsubscribed after navigation.
    }
  }, [dateRangeInvalid, modulesQueryUninitialized, refetch]);

  const modulesTableQueryError =
    modulesQueryError && !isFetchingModules
      ? {
          queryError: modulesFetchError,
          queryErrorTitle: 'Failed to load modules',
          onRetryQuery: refreshModuleList,
        }
      : {};

  const handleOpenFiltersDrawer = () => {
    setDraftFilters(activeFilters);
    setDocumentSearch('');
    setFiltersDrawerOpen(true);
  };

  const handleCloseFiltersDrawer = () => {
    setFiltersDrawerOpen(false);
    setDocumentSearch('');
  };

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setPage(0);
    setDocumentSearch('');
    setFiltersDrawerOpen(false);
  };

  const handleClearDraftFilters = () => {
    const cleared = {
      ...EMPTY_MODULE_LIBRARY_FILTERS,
    };
    setDraftFilters(cleared);
    setFilters(cleared);
    setPage(0);
    setDocumentSearch('');
  };

  const handleTabChange = (value: string) => {
    setTab(value as ModuleLibraryTab);
    setPage(0);
  };

  useEffect(() => {
    const state = location.state as ModuleLibraryLocationState | null;
    if (!state) return;

    let nextSearch = location.search;
    if (state.tab || state.sourceDocumentId) {
      const query = resolveExternalViewSearch(
        state.tab ?? tab,
        state.sourceDocumentId
          ? { sourceDocumentId: state.sourceDocumentId }
          : {},
      );
      nextSearch = query ? `?${query}` : '';
      resetPage();
    }
    if (state.sourceDocumentId) {
      appendRecentIngestDocument({
        source_document_id: state.sourceDocumentId,
        title: state.sourceDocumentTitle,
        ingested_at: new Date().toISOString(),
      });
    }
    if (state.openAssignment) {
      setAssignmentModule({
        id: state.openAssignment.moduleId,
        title: state.openAssignment.moduleTitle,
      });
      setAssignmentOpen(true);
    }
    if (state.openCreateModule) {
      setCreateError('');
      setCreateForm({
        ...createEmptyCreateForm(),
        title_bn:
          state.openCreateModule.title_bn?.trim() ??
          createEmptyCreateForm().title_bn,
        domain:
          state.openCreateModule.domain?.trim() ??
          createEmptyCreateForm().domain,
      });
      setCreateOpen(true);
    }

    const hasTransientState =
      state.tab !== undefined ||
      state.sourceDocumentId !== undefined ||
      state.openAssignment !== undefined ||
      state.openCreateModule !== undefined;

    if (!hasTransientState) return;

    navigate(`${location.pathname}${nextSearch}`, {
      replace: true,
      state: state.chwId ? { chwId: state.chwId } : undefined,
    });
  }, [
    location.pathname,
    location.search,
    location.state,
    navigate,
    resetPage,
    resolveExternalViewSearch,
    tab,
  ]);

  const debouncedDocumentSearch = useDebouncedValue(
    documentSearch,
    MODULE_SEARCH_DEBOUNCE_MS,
  );
  const documentSearchQ = debouncedDocumentSearch.trim() || undefined;
  const { data: sourceDocumentList, isFetching: isSearchingDocuments } =
    useFetchSourceDocumentsQuery({
      status: 'ingested',
      q: documentSearchQ,
      limit: SOURCE_DOCUMENT_SEARCH_LIMIT,
    });
  const sourceDocuments = sourceDocumentList?.source_documents;
  const totalSourceDocuments = sourceDocumentList?.total_source_documents ?? 0;

  const modulesForDisplay = useMemo(
    () =>
      tab === 'discarded'
        ? modulesForList
        : modulesForList.filter(
            (module) => module.lifecycle_status !== 'retired',
          ),
    [modulesForList, tab],
  );

  useEffect(() => {
    if (!assignmentOpen || !assignmentModule) return;
    const listed = modulesForDisplay.find(
      (module) => module.id === assignmentModule.id,
    );
    if (listed && !isAssignablePublishedModule(listed)) {
      setAssignmentOpen(false);
      setAssignmentModule(null);
    }
  }, [assignmentModule, assignmentOpen, modulesForDisplay]);

  const documentFilterOptions = useMemo(() => {
    const searchTerm = documentSearchQ?.toLowerCase();
    const options = [{ label: 'All documents', value: '' }];
    const seen = new Set<string>();

    for (const document of sourceDocuments ?? []) {
      if (!document.id || seen.has(document.id)) continue;
      seen.add(document.id);
      options.push({
        label: sourceDocumentFilterLabel(
          document.id,
          document.title,
          document.original_filename,
        ),
        value: document.id,
      });
    }

    // Recently ingested documents may not be searchable server-side yet;
    // merge them in, honouring the active search term client-side.
    for (const document of readRecentIngestDocuments()) {
      if (seen.has(document.source_document_id)) continue;
      const label = sourceDocumentFilterLabel(
        document.source_document_id,
        document.title,
      );
      if (searchTerm && !label.toLowerCase().includes(searchTerm)) continue;
      seen.add(document.source_document_id);
      options.push({ label, value: document.source_document_id });
    }

    const selectedSourceDocumentId = draftFilters.sourceDocumentId;
    if (
      selectedSourceDocumentId &&
      !seen.has(selectedSourceDocumentId) &&
      !searchTerm
    ) {
      options.push({
        label: sourceDocumentFilterLabel(selectedSourceDocumentId),
        value: selectedSourceDocumentId,
      });
    }

    return options;
  }, [documentSearchQ, draftFilters.sourceDocumentId, sourceDocuments]);

  const selectedDocumentLabel = useMemo(() => {
    const selectedSourceDocumentId = draftFilters.sourceDocumentId;
    if (!selectedSourceDocumentId) return 'All documents';
    const fromCatalog = (sourceDocuments ?? []).find(
      (document) => document.id === selectedSourceDocumentId,
    );
    if (fromCatalog) {
      return sourceDocumentFilterLabel(
        fromCatalog.id,
        fromCatalog.title,
        fromCatalog.original_filename,
      );
    }
    const fromRecent = readRecentIngestDocuments().find(
      (document) => document.source_document_id === selectedSourceDocumentId,
    );
    return sourceDocumentFilterLabel(
      selectedSourceDocumentId,
      fromRecent?.title,
    );
  }, [draftFilters.sourceDocumentId, sourceDocuments]);

  const listedDocumentCount = sourceDocuments?.length ?? 0;
  const documentFilterHint =
    totalSourceDocuments > listedDocumentCount
      ? `Showing ${listedDocumentCount} of ${totalSourceDocuments} documents — type to narrow down`
      : undefined;

  const filtered = useMemo(() => {
    const rows: ModuleLibraryItem[] = modulesForDisplay.map((m) => ({
      id: m.id,
      title: resolveDisplayText(m.title),
      category: formatModuleDomainLabel(m.domain),
      lessons: m.card_count,
      questions: m.quiz_count,
      durationLabel: `~${formatEstimatedMinutesDisplay(m.estimated_minutes)}`,
      estimatedMinutes: m.estimated_minutes,
      status: (m.lifecycle_status as ModuleStatus) ?? 'draft',
      createdAt: formatDisplayDateTime(m.created_at),
      lastUpdatedAt: formatDisplayDateTime(m.updated_at || m.created_at),
      publishedAt: formatDisplayDateTime(m.published_at),
      activatedAt: formatDisplayDateTime(getModuleActivatedAt(m)),
      deactivatedAt: formatDisplayDateTime(getModuleDeactivatedAt(m)),
      generatedBy: m.created_by?.name ?? null,
      publishedBy: m.published_by?.name ?? null,
      activatedBy: m.activated_by?.name ?? null,
      deactivatedBy: m.deactivated_by?.name ?? null,
      chatbot_faqs_only: Boolean(m.chatbot_faqs_only),
    }));
    return rows;
  }, [modulesForDisplay]);

  const dateColumns = useMemo(() => getModuleListingDateColumns(tab), [tab]);

  const actorColumns = useMemo(() => getModuleListingActorColumns(tab), [tab]);

  const tableCaption =
    tab === 'published'
      ? 'Published modules'
      : tab === 'drafts'
        ? 'Draft modules'
        : tab === 'deactivated'
          ? 'Deactivated modules'
          : 'All modules';

  const emptyMessage = getModuleListEmptyMessage(activeFilters, tab);

  const hasNextPage = tableHasNextPage(page, totalPages);
  const hasPrevPage = tableHasPrevPage(page);
  const currentTabItemCount =
    tab === 'needs_review' || tab === 'discarded'
      ? modulesForList.length
      : filtered.length;
  const { start: rangeStart, end: rangeEnd } = tablePaginationRange(
    page,
    pageSize,
    currentTabItemCount,
  );

  const columns: Array<ColumnDef<ModuleLibraryItem>> = useMemo(
    () => [
      {
        key: 'title',
        header: 'Module',
        headerClassName: TABLE_TITLE_COLUMN_CLASS,
        className: TABLE_TITLE_COLUMN_CLASS,
        sortable: true,
        sortKey: 'title',
        render: (row) => {
          const displayTitle = truncateDisplayText(
            row.title,
            TABLE_CELL_LABEL_MAX_LENGTH,
          );
          return (
            <div className="w-full min-w-0">
              <TruncatedText
                text={row.title}
                maxChars={TABLE_CELL_LABEL_MAX_LENGTH}
              >
                {isNeedsReviewStatus(row.status) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedReviewModuleId(row.id);
                      setTab('needs_review');
                    }}
                    className={cn(
                      typographyClasses.tableCellPrimary,
                      'block w-full truncate break-all text-left font-semibold text-spice-brand-primary hover:underline',
                    )}
                  >
                    {displayTitle}
                  </button>
                ) : (
                  <Link
                    to={adminModuleReviewPaths.details(row.id)}
                    className={cn(
                      typographyClasses.tableCellPrimary,
                      'block truncate break-all font-semibold text-spice-brand-primary hover:underline',
                    )}
                  >
                    {displayTitle}
                  </Link>
                )}
              </TruncatedText>
            </div>
          );
        },
      },
      {
        key: 'lessons',
        header: 'Content',
        render: (row) => (
          <div className="inline-flex items-center gap-x-1 whitespace-nowrap">
            <span>
              {row.lessons === 1 ? '1 lesson' : `${row.lessons} lessons`}
            </span>
            <span className="text-spice-text-muted" aria-hidden="true">
              |
            </span>
            {row.questions > 0 ? (
              <span>
                {row.questions === 1
                  ? '1 question'
                  : `${row.questions} questions`}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-spice-bg-tint px-2 py-0.5 text-xs font-semibold text-spice-text-muted ring-1 ring-spice-border">
                No quiz
              </span>
            )}
            <span className="text-spice-text-muted" aria-hidden="true">
              |
            </span>
            <span>{row.durationLabel}</span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        className: 'whitespace-nowrap',
        sortable: tab === 'all',
        sortKey: 'lifecycle_status',
        render: (row) => (
          <div className="flex items-center">{moduleBadge(row.status)}</div>
        ),
      },
      ...dateColumns.map(listingDateColumnDef),
      ...actorColumns.map(listingActorColumnDef),
      ...(tab === 'published' || tab === 'all'
        ? [
            {
              key: 'assigned',
              header: 'Assigned',
              className: 'whitespace-nowrap',
              render: (row: ModuleLibraryItem) => (
                <ModuleAssignedUsersCell
                  moduleId={row.id}
                  enabled={
                    row.status === 'published' &&
                    isAssignablePublishedModule(row)
                  }
                />
              ),
            } satisfies ColumnDef<ModuleLibraryItem>,
          ]
        : []),
      {
        key: 'id',
        header: 'Actions',
        className: 'text-left whitespace-nowrap',
        render: (row) => {
          const actionSlots = getModuleLibraryActionSlots(tab);
          const reserveActionSlots = actionSlots.length > 0;
          const actionButtonClass = reserveActionSlots
            ? 'h-8 w-full px-3 text-xs'
            : MODULE_LIBRARY_ACTION_BUTTON_CLASS;

          const assignButton =
            row.status === 'published' && isAssignablePublishedModule(row) ? (
              <Button
                className={actionButtonClass}
                onClick={() => {
                  setAssignmentModule({ id: row.id, title: row.title });
                  setAssignmentOpen(true);
                }}
              >
                Assign
              </Button>
            ) : null;

          const reviewButton =
            row.status !== 'published' && row.status !== 'deactivated' ? (
              <Button
                className={actionButtonClass}
                onClick={() => {
                  if (isNeedsReviewStatus(row.status)) {
                    setExpandedReviewModuleId(row.id);
                    setTab('needs_review');
                  } else {
                    navigate(adminModuleReviewPaths.details(row.id));
                  }
                }}
              >
                {isNeedsReviewStatus(row.status) ? 'Resolve' : 'Review'}
              </Button>
            ) : null;

          const isPublishingRow = isPublishing && publishingModuleId === row.id;
          const publishButton =
            row.status === 'draft' ? (
              <Button
                variant="primary"
                className={actionButtonClass}
                disabled={isPublishingRow}
                onClick={async () => {
                  if (isPublishing) return;
                  setPublishingModuleId(row.id);
                  try {
                    await publishModule({ moduleId: row.id }).unwrap();
                    setPublishSuccessSummary({
                      title: row.title,
                      topic: row.category,
                      lessonCount: row.lessons,
                      quizCount: row.questions,
                      estimateMinutes: row.estimatedMinutes,
                    });
                    setPublishSuccessOpen(true);
                    snackbar.showSuccess('Module published successfully.');
                    refreshModuleList();
                  } catch (error) {
                    snackbar.showError(
                      formatRtkQueryError(error) ||
                        'Failed to publish module. Please try again.',
                    );
                    refreshModuleList();
                  } finally {
                    setPublishingModuleId(null);
                  }
                }}
              >
                {isPublishingRow ? 'Publishing…' : 'Publish'}
              </Button>
            ) : null;

          const deactivateButton =
            row.status === 'published' ? (
              <Button
                variant="secondary"
                className={cn(
                  actionButtonClass,
                  'text-spice-semantic-error hover:bg-spice-semantic-errorBg',
                )}
                onClick={() => {
                  setDeactivateModuleData({
                    id: row.id,
                    title: row.title,
                  });
                  setDeactivateConfirmOpen(true);
                }}
              >
                Deactivate
              </Button>
            ) : null;

          const isReactivatingRow =
            isReactivating && reactivatingModuleId === row.id;
          const activateButton =
            row.status === 'deactivated' ? (
              <Button
                variant="primary"
                className={actionButtonClass}
                disabled={isReactivatingRow}
                onClick={async () => {
                  if (isReactivating) return;
                  setReactivatingModuleId(row.id);
                  try {
                    await reactivateModule({ moduleId: row.id }).unwrap();
                    refreshModuleList();
                  } catch {
                    refreshModuleList();
                  } finally {
                    setReactivatingModuleId(null);
                  }
                }}
              >
                {isReactivatingRow ? 'Activating…' : 'Activate'}
              </Button>
            ) : null;

          const packedActions = [
            { key: 'assign', node: assignButton },
            { key: 'review', node: reviewButton },
            { key: 'publish', node: publishButton },
            { key: 'deactivate', node: deactivateButton ?? activateButton },
          ].filter((action) => action.node != null);

          if (!reserveActionSlots) {
            if (packedActions.length === 0) return null;
            return (
              <div className="flex justify-start gap-2">
                {packedActions.map((action) => (
                  <Fragment key={action.key}>{action.node}</Fragment>
                ))}
              </div>
            );
          }

          const slotContent: Record<ModuleLibraryActionSlot, ReactNode> = {
            assign: assignButton,
            review: reviewButton,
            publish: publishButton,
            deactivate: deactivateButton ?? activateButton,
          };

          return (
            <div className="flex justify-start gap-2">
              {actionSlots.map((slot) => (
                <ModuleLibraryActionSlot key={slot} slot={slot}>
                  {slotContent[slot]}
                </ModuleLibraryActionSlot>
              ))}
            </div>
          );
        },
      },
    ],
    [
      actorColumns,
      dateColumns,
      isPublishing,
      isReactivating,
      navigate,
      publishModule,
      publishingModuleId,
      reactivateModule,
      reactivatingModuleId,
      refreshModuleList,
      setTab,
      tab,
    ],
  );

  return (
    <section className="space-y-5">
      {publishSuccessSummary ? (
        <ModulePublishedSuccessModal
          open={publishSuccessOpen}
          summary={publishSuccessSummary}
          onRedirect={() => {
            setPublishSuccessOpen(false);
            setPublishSuccessSummary(null);
            setTab('published');
          }}
        />
      ) : null}
      <Loader
        open={isCreating || isDeactivating || isReactivating || isPublishing}
        label={
          isCreating
            ? 'Creating module…'
            : isDeactivating
              ? 'Deactivating module…'
              : isReactivating
                ? 'Activating module…'
                : 'Publishing module…'
        }
      />
      {createOpen ? (
        <Modal
          open={createOpen}
          labelledBy="create-module-title"
          contentClassName="max-w-2xl"
          onClose={() => {
            if (isCreating) return;
            setCreateError('');
            setCreateOpen(false);
          }}
        >
          <Card
            variant="elevated"
            className="w-full space-y-4 border-spice-border p-6 pr-12 shadow-lg sm:p-7 sm:pr-14"
          >
            <div>
              <ModalTitle id="create-module-title">Create module</ModalTitle>
              <p className="mt-1 text-xs text-spice-text-muted">
                Creates a draft module in the admin module library.
              </p>
            </div>

            {createError ? (
              <p className="text-xs text-spice-semantic-error">{createError}</p>
            ) : null}

            <div className="space-y-4">
              <div className="grid gap-3">
                <label className="block w-full space-y-1">
                  <FormLabel required>Title (BN)</FormLabel>
                  <LimitedTextInput
                    id="create-module-title-bn"
                    value={createForm.title_bn}
                    maxLength={FIELD_LIMITS.moduleTitle}
                    disabled={isCreating}
                    placeholder="বাংলা শিরোনাম…"
                    onChange={(title_bn) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        title_bn,
                      }))
                    }
                  />
                </label>
                <label className="block w-full space-y-1">
                  <FormLabel>Description (BN)</FormLabel>
                  <LimitedTextarea
                    id="create-module-description-bn"
                    value={createForm.description_bn}
                    maxLength={FIELD_LIMITS.description}
                    disabled={isCreating}
                    placeholder="মডিউল বিবরণ…"
                    textareaClassName="min-h-[84px] border-spice-border"
                    onChange={(description_bn) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        description_bn,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="grid items-start gap-3 sm:grid-cols-2">
                <ModuleTaxonomyField
                  id="create-module-domain"
                  label="Domain"
                  value={createForm.domain}
                  options={domainOptions}
                  placeholder={CREATE_MODULE_FORM_PLACEHOLDERS.domain}
                  disabled={isCreating}
                  required
                  onChange={(domain) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      domain,
                    }))
                  }
                />
                <label className="block space-y-1 self-start">
                  <FormLabel className="flex min-h-5 items-center gap-1.5">
                    Content domain type
                    <Tooltip
                      label="About Content domain type"
                      content={CONTENT_DOMAIN_TYPE_TOOLTIP}
                      placement="top"
                    />
                  </FormLabel>
                  <Select
                    className="w-full"
                    options={INGEST_CONTENT_DOMAIN_OPTIONS}
                    value={createForm.content_domain}
                    disabled={isCreating}
                    aria-label="Content domain type"
                    onChange={(value) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        content_domain: value as IngestContentDomain,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-1 self-start">
                  <FormLabel>Estimated minutes</FormLabel>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={MAX_ESTIMATED_MINUTES_DIGITS}
                    autoComplete="off"
                    className={cn(
                      CREATE_MODULE_INPUT_CLASS,
                      estimatedMinutesError &&
                        'border-spice-semantic-error ring-1 ring-spice-semantic-error',
                    )}
                    value={formatEstimatedMinutesFieldValue(
                      createForm.estimated_minutes,
                    )}
                    disabled={isCreating}
                    aria-invalid={Boolean(estimatedMinutesError)}
                    aria-describedby={
                      estimatedMinutesError
                        ? 'create-module-estimated-minutes-error'
                        : undefined
                    }
                    onChange={(e) => {
                      setCreateError('');
                      setCreateForm((prev) => ({
                        ...prev,
                        estimated_minutes: parseEstimatedMinutesInput(
                          e.target.value,
                        ),
                      }));
                    }}
                  />
                  {estimatedMinutesError ? (
                    <p
                      id="create-module-estimated-minutes-error"
                      className="text-xs text-spice-semantic-error"
                    >
                      {estimatedMinutesError}
                    </p>
                  ) : null}
                </label>
                <label className="block space-y-1 self-start">
                  <FormLabel>Difficulty level</FormLabel>
                  <select
                    className={cn(CREATE_MODULE_INPUT_CLASS, 'select-arrow')}
                    value={createForm.difficulty_level}
                    disabled={isCreating}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        difficulty_level: e.target
                          .value as AdminModuleDifficultyLevel,
                      }))
                    }
                  >
                    {DIFFICULTY_LEVEL_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <ChatbotFaqsOnlyField
                checked={createForm.chatbot_faqs_only}
                disabled={isCreating}
                onChange={(checked) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    chatbot_faqs_only: checked,
                  }))
                }
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-spice-border pt-4">
              <Button
                variant="secondary"
                disabled={isCreating}
                onClick={() => {
                  setCreateError('');
                  setCreateOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  isCreating ||
                  !createForm.title_bn.trim() ||
                  !createForm.domain.trim() ||
                  estimatedMinutesError !== null
                }
                onClick={() => {
                  void (async () => {
                    setCreateError('');
                    if (estimatedMinutesError) {
                      setCreateError(estimatedMinutesError);
                      return;
                    }
                    const domainRaw = createForm.domain.trim();
                    if (!domainRaw) {
                      setCreateError('Domain is required.');
                      return;
                    }
                    if (domainRaw.length > FIELD_LIMITS.taxonomy) {
                      setCreateError(
                        fieldLimitExceededMessage(
                          'Domain',
                          FIELD_LIMITS.taxonomy,
                        ),
                      );
                      return;
                    }
                    const titleBn = createForm.title_bn.trim();
                    if (titleBn.length > FIELD_LIMITS.moduleTitle) {
                      setCreateError(
                        fieldLimitExceededMessage(
                          'Title',
                          FIELD_LIMITS.moduleTitle,
                        ),
                      );
                      return;
                    }
                    const descriptionBn = createForm.description_bn.trim();
                    if (descriptionBn.length > FIELD_LIMITS.description) {
                      setCreateError(
                        fieldLimitExceededMessage(
                          'Description',
                          FIELD_LIMITS.description,
                        ),
                      );
                      return;
                    }
                    try {
                      const domain = normalizeModuleTaxonomyLabel(domainRaw);
                      const created = await createModule({
                        title: {
                          bn: titleBn,
                        },
                        ...(descriptionBn
                          ? {
                              description: {
                                bn: descriptionBn,
                              },
                            }
                          : {}),
                        domain,
                        sub_domain: null,
                        content_domain: createForm.content_domain,
                        module_type: createForm.module_type,
                        estimated_minutes: Math.min(
                          MAX_ESTIMATED_MINUTES,
                          Math.max(
                            1,
                            Number.isFinite(createForm.estimated_minutes)
                              ? createForm.estimated_minutes
                              : 1,
                          ),
                        ),

                        difficulty_level: createForm.difficulty_level,
                        chatbot_faqs_only: createForm.chatbot_faqs_only,
                        module_json: {
                          cards: [createEmptyAdminModuleCard()],
                          quiz: [createEmptyAdminModuleQuizItem(1)],
                        },
                      }).unwrap();
                      setCreateOpen(false);
                      void refetchDomainOptions();
                      setCreateForm(createEmptyCreateForm());
                      navigate(adminModuleReviewPaths.details(created.id));
                    } catch {
                      snackbar.showError(
                        'Failed to create module. Please try again.',
                      );
                    }
                  })();
                }}
              >
                {isCreating ? 'Creating…' : 'Create draft'}
              </Button>
            </div>
          </Card>
        </Modal>
      ) : null}

      {deactivateConfirmOpen && deactivateModuleData ? (
        <ConfirmDialog
          open={deactivateConfirmOpen}
          labelledBy="deactivate-module-title"
          describedBy="deactivate-module-description"
          title="Deactivate module"
          description={
            <>
              You are deactivating{' '}
              <QuotedDisplayLabel text={deactivateModuleData.title} />. Once
              deactivated, this module will no longer be visible to users for
              new assignments or training workflows. Do you want to proceed?
            </>
          }
          confirmLabel="Deactivate"
          confirmingLabel="Deactivating…"
          isConfirming={isDeactivating}
          disabled={isDeactivating}
          onClose={() => {
            setDeactivateConfirmOpen(false);
            setDeactivateModuleData(null);
          }}
          onConfirm={() => {
            void (async () => {
              try {
                await deactivateModule({
                  moduleId: deactivateModuleData.id,
                }).unwrap();
                setDeactivateConfirmOpen(false);
                setDeactivateModuleData(null);
                snackbar.showSuccess('Module deactivated successfully.');
                refreshModuleList();
              } catch (error) {
                snackbar.showError(
                  formatRtkQueryError(error) ||
                    'Failed to deactivate module. Please try again.',
                );
              }
            })();
          }}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageTitle title="Module Library" />
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="w-full sm:w-72">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search modules..."
              className="h-[35px] rounded-lg pl-10 pr-4 text-base placeholder:text-spice-text-onSurfaceVariant"
            />
          </div>
          <Button
            onClick={() => {
              setCreateError('');
              setCreateForm(createEmptyCreateForm());
              setCreateOpen(true);
            }}
          >
            Create Module
          </Button>
        </div>
      </div>

      <Card variant="elevated" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Tabs
            items={[
              { label: 'Drafts', value: 'drafts' },
              { label: 'Published', value: 'published' },
              {
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    Needs Review
                    <Tooltip
                      as="span"
                      label="Needs Review Keep New, Discard New, and Merge information"
                      content={NEEDS_REVIEW_TOOLTIP_CONTENT}
                      placement="bottom"
                    />
                  </span>
                ),
                value: 'needs_review',
              },
              { label: 'Deactivated', value: 'deactivated' },
              { label: 'Discarded', value: 'discarded' },
              { label: 'All', value: 'all' },
            ]}
            value={tab}
            onChange={handleTabChange}
            className="w-fit min-w-0"
          />
          <SettingsFilterTriggerButton
            active={filtersActive}
            expanded={filtersDrawerOpen}
            onClick={handleOpenFiltersDrawer}
            ariaLabel="Open filters"
            tooltip={
              filtersActive
                ? 'Results reflect the filters currently applied.'
                : 'Use filters to narrow results.'
            }
          />
        </div>

        <SettingsFilterDrawer
          open={filtersDrawerOpen}
          onClose={handleCloseFiltersDrawer}
          title="Filters"
          description="Choose filters, then click Apply to update the list."
          titleId="module-library-filters-title"
          descriptionId="module-library-filters-desc"
        >
          <ModuleLibraryFilters
            filters={draftFilters}
            tab={tab}
            domains={domainOptions}
            sourceDocumentOptions={documentFilterOptions}
            sourceDocumentId={draftFilters.sourceDocumentId}
            sourceDocumentLabel={selectedDocumentLabel}
            sourceDocumentSearch={documentSearch}
            sourceDocumentsLoading={isSearchingDocuments}
            sourceDocumentsHint={documentFilterHint}
            onSourceDocumentChange={(value) => {
              setDraftFilters({ ...draftFilters, sourceDocumentId: value });
            }}
            onSourceDocumentSearchChange={setDocumentSearch}
            onChange={setDraftFilters}
            onClearAll={handleClearDraftFilters}
            onApply={handleApplyFilters}
          />
        </SettingsFilterDrawer>

        {tab === 'needs_review' ? (
          <NeedsReviewTab
            modules={isFetchingModules ? [] : modulesForList}
            isLoading={isFetchingModules}
            onMerge={handleOverrideMerge}
            onDiscardNew={handleSkipReview}
            onKeepNew={handleKeepNewReview}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            initialExpandedId={expandedReviewModuleId}
            emptyMessage={emptyMessage}
            {...modulesTableQueryError}
          />
        ) : tab === 'discarded' ? (
          <DiscardedTabTable
            modules={isFetchingModules ? [] : modulesForList}
            isLoading={isFetchingModules}
            onView={handleViewModule}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            {...modulesTableQueryError}
          />
        ) : (
          <Table<ModuleLibraryItem>
            data={isFetchingModules ? [] : filtered}
            columns={columns}
            keyExtractor={(r) => r.id}
            caption={tableCaption}
            isLoading={isFetchingModules}
            loadingMessage="Loading modules…"
            emptyMessage={emptyMessage}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            {...modulesTableQueryError}
          />
        )}

        <TablePagination
          page={page}
          pageSize={pageSize}
          pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
          totalItems={totalModules}
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
          onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
        />
      </Card>
      {assignmentOpen && assignmentModule ? (
        <ModuleAssignmentDialog
          open={assignmentOpen}
          onClose={() => {
            setAssignmentOpen(false);
            setAssignmentModule(null);
          }}
          moduleId={assignmentModule.id}
          moduleTitle={assignmentModule.title}
        />
      ) : null}
    </section>
  );
};
