import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Loader,
  Modal,
  SearchInput,
  Select,
  Tabs,
  Tooltip,
  TruncatedText,
} from '@/components/ui';
import { Table } from '@/components/common/Table';
import {
  SettingsFilterDrawer,
  SettingsFilterTriggerButton,
} from '@/components/common/SettingsFilterDrawer';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { paths } from '@/constants/routes';
import { getCurrentRole } from '@/constants/role';
import {
  useCreateModuleMutation,
  useDeactivateModuleMutation,
  useDeleteModuleMutation,
  useFetchModuleDomainOptionsQuery,
  useFetchModulesQuery,
  useOverrideMergeModuleMutation,
  useReactivateModuleMutation,
} from '@/features/modules/api/adminModulesApi';
import { useFetchSourceDocumentsQuery } from '@/features/modules/api/adminSourceDocumentsApi';
import { ModuleAssignmentDialog } from '@/features/modules/components/ModuleAssignmentDialog';
import { ModuleLibraryFilters } from '@/features/modules/components/ModuleLibraryFilters';
import { ModuleTaxonomyField } from '@/features/modules/components/ModuleTaxonomyField';
import {
  NEEDS_REVIEW_TOOLTIP_CONTENT,
  NeedsReviewTab,
} from '@/features/modules/components/NeedsReviewTab';
import { DiscardedTabTable } from '@/features/modules/components/DiscardedTabTable';
import { ModuleStatusBadge } from '@/features/modules/components/ModuleStatusBadge';
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
  getModuleListingDateColumns,
  getModuleListEmptyMessage,
  hasActiveModuleFilters,
  isAnyVisibleDateRangeInvalid,
  moduleListingDateColumnHeader,
  type ModuleLibraryFilters as ModuleLibraryFilterState,
  type ModuleListingDateColumn,
} from '@/features/modules/utils/moduleListFilters';
import {
  appendRecentIngestDocument,
  readRecentIngestDocuments,
} from '@/features/ingest/utils/recentIngestDocumentsStorage';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { cn } from '@/utils';
import {
  DEPLOYMENT_PRIMARY_LOCALE,
  resolveDisplayText,
} from '@/config/deploymentLocale';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  CREATE_MODULE_FORM_DEFAULTS,
  CREATE_MODULE_FORM_PLACEHOLDERS,
} from '@/features/modules/constants/createModuleFormDefaults';
import { normalizeModuleTaxonomyLabel } from '@/features/modules/utils/normalizeModuleTaxonomyLabel';
import {
  getEstimatedMinutesValidationError,
  MAX_ESTIMATED_MINUTES,
  formatEstimatedMinutesFieldValue,
  parseEstimatedMinutesInput,
} from '@/features/modules/utils/estimatedMinutesValidation';
import { formatEstimatedMinutesDisplay } from '@/features/ingest/utils/formatEstimatedMinutesDisplay';

const DIFFICULTY_LEVEL_OPTIONS = ['easy', 'moderate', 'hard'] as const;

/** Minimum characters before the module list search hits the API. */
const MODULE_SEARCH_MIN_CHARS = 3;
const MODULE_SEARCH_DEBOUNCE_MS = 300;
/** Page size for the server-side source document typeahead. */
const SOURCE_DOCUMENT_SEARCH_LIMIT = 50;
const MODULE_PAGE_SIZE_OPTIONS = [5, 10, 15, 25, 50] as const;
const DEFAULT_MODULE_PAGE_SIZE = 10;

const CREATE_MODULE_INPUT_CLASS =
  'h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm';

type AdminModuleDifficultyLevel = (typeof DIFFICULTY_LEVEL_OPTIONS)[number];

type CreateModuleFormState = {
  title_bn: string;
  description_bn: string;
  domain: string;
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
    module_type: 'refresher',
    estimated_minutes: CREATE_MODULE_FORM_DEFAULTS.estimated_minutes,
    difficulty_level: CREATE_MODULE_FORM_DEFAULTS.difficulty_level,
    chatbot_faqs_only: CREATE_MODULE_FORM_DEFAULTS.chatbot_faqs_only,
  };
}

const moduleBadge = (status: ModuleStatus) => {
  return <ModuleStatusBadge status={status} />;
};

function listingDateColumnDef(
  column: ModuleListingDateColumn,
): ColumnDef<ModuleLibraryItem> {
  const key =
    column === 'published'
      ? 'publishedAt'
      : column === 'activated'
        ? 'activatedAt'
        : column === 'deactivated'
          ? 'deactivatedAt'
          : 'createdAt';
  return {
    key,
    header: moduleListingDateColumnHeader(column),
    render: (row) => (
      <span className="text-xs text-spice-text-medium">
        {column === 'published'
          ? (row.publishedAt ?? '—')
          : column === 'activated'
            ? (row.activatedAt ?? '—')
            : column === 'deactivated'
              ? (row.deactivatedAt ?? '—')
              : row.createdAt}
      </span>
    ),
  };
}

export const ModuleLibraryPage = () => {
  const role = getCurrentRole();
  const isProgramManager = role === 'programManager';
  const { t } = useTranslation();
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
  } = useModuleListFilters(isProgramManager);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_MODULE_PAGE_SIZE);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    setPage(0);
  }, [searchQ]);

  useEffect(() => {
    setPageInput(String(page + 1));
  }, [page]);

  const [createOpen, setCreateOpen] = useState(false);
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
  const [deactivateError, setDeactivateError] = useState('');
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
  const [overrideMergeModule] = useOverrideMergeModuleMutation();
  const [deleteModule] = useDeleteModuleMutation();

  const handleOverrideMerge = async (moduleId: string) => {
    await overrideMergeModule({ moduleId }).unwrap();
    refreshModuleList();
  };

  const handleSkipReview = async (moduleId: string) => {
    await deleteModule({ moduleId }).unwrap();
    refreshModuleList();
  };

  const handleViewModule = (moduleId: string) => {
    navigate(
      paths.adminModuleReviewDetails.replace(
        ':moduleId',
        encodeURIComponent(moduleId),
      ),
    );
  };

  const dateRangeInvalid = isAnyVisibleDateRangeInvalid(
    activeFilters,
    tab,
    isProgramManager,
  );
  const dateParams = buildModuleListTypedDateParams(
    activeFilters,
    tab,
    isProgramManager,
  );
  const filtersActive = hasActiveModuleFilters(
    activeFilters,
    tab,
    isProgramManager,
  );
  const { data: domainOptions = [], refetch: refetchDomainOptions } =
    useFetchModuleDomainOptionsQuery({});
  const {
    data: modulesPage,
    refetch,
    isLoading: isLoadingModules,
    isUninitialized: modulesQueryUninitialized,
  } = useFetchModulesQuery(
    {
      limit: pageSize,
      offset: page * pageSize,
      status: lifecycleStatus,
      domain: activeFilters.domain || undefined,
      ...dateParams,
      sourceDocumentId: activeFilters.sourceDocumentId || undefined,
      q: searchQ,
    },
    { skip: dateRangeInvalid },
  );
  const modulesForList = useMemo(
    () => (dateRangeInvalid ? [] : (modulesPage?.modules ?? [])),
    [dateRangeInvalid, modulesPage?.modules],
  );
  const totalModules = modulesPage?.total_modules ?? 0;
  const totalPages = modulesPage?.total_pages ?? 0;

  const refreshModuleList = useCallback(() => {
    if (dateRangeInvalid || modulesQueryUninitialized) return;
    try {
      void refetch().catch(() => undefined);
    } catch {
      // Query may be skipped or unsubscribed after navigation.
    }
  }, [dateRangeInvalid, modulesQueryUninitialized, refetch]);

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
      setPage(0);
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

    const hasTransientState =
      state.tab !== undefined ||
      state.sourceDocumentId !== undefined ||
      state.openAssignment !== undefined;

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
      status:
        m.lifecycle_status === 'published'
          ? 'published'
          : m.lifecycle_status === 'deactivated'
            ? 'deactivated'
            : 'draft',
      createdAt: formatDisplayDateTime(m.created_at),
      publishedAt: formatDisplayDateTime(m.published_at),
      activatedAt: formatDisplayDateTime(getModuleActivatedAt(m)),
      deactivatedAt: formatDisplayDateTime(m.last_deactivated_at),
    }));
    return rows;
  }, [modulesForDisplay]);

  const dateColumns = useMemo(
    () => getModuleListingDateColumns(tab, isProgramManager),
    [isProgramManager, tab],
  );

  const tableCaption = isProgramManager
    ? tab === 'published'
      ? 'Published modules'
      : tab === 'drafts'
        ? 'Draft modules'
        : tab === 'deactivated'
          ? 'Deactivated modules'
          : 'All modules'
    : 'Published modules';

  const emptyMessage = getModuleListEmptyMessage(
    activeFilters,
    tab,
    isProgramManager,
  );

  const hasNextPage = totalPages > 0 && page + 1 < totalPages;
  const hasPrevPage = page > 0;
  const currentTabItemCount =
    tab === 'needs_review' || tab === 'discarded'
      ? modulesForList.length
      : filtered.length;
  const rangeStart = currentTabItemCount ? page * pageSize + 1 : 0;
  const rangeEnd = currentTabItemCount
    ? page * pageSize + currentTabItemCount
    : 0;

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

  const columns: Array<ColumnDef<ModuleLibraryItem>> = useMemo(
    () => [
      {
        key: 'title',
        header: 'Module',
        render: (row) => (
          <div className="min-w-0">
            <TruncatedText text={row.title}>
              <Link
                to={paths.adminModuleReviewDetails.replace(
                  ':moduleId',
                  encodeURIComponent(row.id),
                )}
                className="font-semibold text-spice-brand-primary underline decoration-spice-brand-primary/40 underline-offset-2 hover:decoration-spice-brand-primary"
              >
                {row.title}
              </Link>
            </TruncatedText>
            <div className="text-xs text-spice-text-muted">{row.category}</div>
          </div>
        ),
      },
      {
        key: 'lessons',
        header: 'Content',
        render: (row) => (
          <div className="inline-grid w-max grid-cols-[4.75rem_auto_5.5rem_auto_3.25rem] items-center gap-x-1 whitespace-nowrap text-xs text-spice-text-medium">
            <span>
              {row.lessons === 1 ? '1 lesson' : `${row.lessons} lessons`}
            </span>
            <span className="text-spice-text-muted" aria-hidden="true">
              |
            </span>
            {row.questions > 0 ? (
              <span className="text-center">
                {row.questions === 1
                  ? '1 question'
                  : `${row.questions} questions`}
              </span>
            ) : (
              <span className="inline-flex w-full items-center justify-center">
                <span className="inline-flex items-center rounded-full bg-spice-bg-tint px-2 py-0.5 text-[10px] font-semibold text-spice-text-muted ring-1 ring-spice-border">
                  No quiz
                </span>
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
        render: (row) => moduleBadge(row.status),
      },
      ...dateColumns.map(listingDateColumnDef),
      {
        key: 'id',
        header: 'Actions',
        className: 'text-left',
        render: (row) => {
          if (row.status === 'deactivated') {
            if (!isProgramManager) return null;
            return (
              <div className="flex justify-start gap-2">
                <Button
                  variant="primary"
                  className="h-8 px-3 text-xs"
                  disabled={isReactivating}
                  onClick={async () => {
                    try {
                      await reactivateModule({ moduleId: row.id }).unwrap();
                      refreshModuleList();
                    } catch {
                      // Refetch keeps the list consistent if partial failure occurs.
                      refreshModuleList();
                    }
                  }}
                >
                  {isReactivating ? 'Activating…' : 'Activate'}
                </Button>
              </div>
            );
          }
          if (row.status === 'published') {
            return (
              <div className="flex justify-start gap-2">
                <Button
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    setAssignmentModule({ id: row.id, title: row.title });
                    setAssignmentOpen(true);
                  }}
                >
                  Assign
                </Button>
                {isProgramManager ? (
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs text-spice-semantic-error hover:bg-spice-semantic-errorBg"
                    onClick={() => {
                      setDeactivateError('');
                      setDeactivateModuleData({
                        id: row.id,
                        title: row.title,
                      });
                      setDeactivateConfirmOpen(true);
                    }}
                  >
                    Deactivate
                  </Button>
                ) : null}
              </div>
            );
          }
          if (!isProgramManager) {
            return null;
          }
          return (
            <div className="flex justify-start gap-2">
              <Button
                className="h-8 px-3 text-xs"
                onClick={() =>
                  navigate(
                    paths.adminModuleReviewDetails.replace(
                      ':moduleId',
                      encodeURIComponent(row.id),
                    ),
                  )
                }
              >
                Review
              </Button>
            </div>
          );
        },
      },
    ],
    [
      dateColumns,
      isProgramManager,
      isReactivating,
      navigate,
      reactivateModule,
      refreshModuleList,
    ],
  );

  return (
    <section className="space-y-5">
      <Loader
        open={
          isCreating ||
          isDeactivating ||
          isReactivating ||
          (!dateRangeInvalid && isLoadingModules)
        }
        label={
          isCreating
            ? 'Creating module…'
            : isDeactivating
              ? 'Deactivating module…'
              : isReactivating
                ? 'Activating module…'
                : 'Loading modules…'
        }
      />
      {createOpen ? (
        <Modal
          open={createOpen}
          labelledBy="create-module-title"
          onClose={() => {
            if (isCreating) return;
            setCreateError('');
            setCreateOpen(false);
          }}
        >
          <Card
            variant="elevated"
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden border-spice-border p-0 shadow-lg"
          >
            <div className="shrink-0 space-y-4 p-6 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="create-module-title"
                    className="text-xl font-semibold text-spice-text-primary"
                  >
                    Create module
                  </h2>
                  <p className="mt-1 text-xs text-spice-text-muted">
                    Creates a draft module in the admin module library.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="h-9 px-3 text-xs"
                  disabled={isCreating}
                  onClick={() => {
                    setCreateError('');
                    setCreateOpen(false);
                  }}
                >
                  Close
                </Button>
              </div>

              {createError ? (
                <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
                  {createError}
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6">
              <div className="grid gap-3">
                <label className="block w-full space-y-1">
                  <span className="text-xs font-semibold text-spice-text-primary">
                    Title (BN)
                    <span
                      className="text-spice-semantic-error"
                      aria-hidden="true"
                    >
                      {' '}
                      *
                    </span>
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                    value={createForm.title_bn}
                    disabled={isCreating}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        title_bn: e.target.value,
                      }))
                    }
                    placeholder="বাংলা শিরোনাম…"
                  />
                </label>
                <label className="block w-full space-y-1">
                  <span className="text-xs font-semibold text-spice-text-primary">
                    Description (BN)
                  </span>
                  <textarea
                    className="min-h-[84px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm"
                    value={createForm.description_bn}
                    disabled={isCreating}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        description_bn: e.target.value,
                      }))
                    }
                    placeholder="মডিউল বিবরণ…"
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
                  <span className="text-xs font-semibold text-spice-text-primary">
                    Estimated minutes
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
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
                  <span className="text-xs font-semibold text-spice-text-primary">
                    Difficulty level
                  </span>
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

              <label className="flex min-h-10 items-start gap-3 rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2.5">
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0"
                  disabled={isCreating}
                  checked={createForm.chatbot_faqs_only}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      chatbot_faqs_only: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-spice-text-medium">
                  <span className="font-semibold text-spice-text-primary">
                    Chatbot FAQs Only
                  </span>
                </span>
              </label>
            </div>

            <div className="flex shrink-0 justify-end gap-2 px-6 pb-6 pt-6">
              <Button
                variant="secondary"
                className="h-9 text-xs"
                disabled={isCreating}
                onClick={() => {
                  setCreateError('');
                  setCreateOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="h-9 text-xs"
                disabled={
                  isCreating ||
                  !createForm.title_bn.trim() ||
                  !createForm.domain.trim() ||
                  estimatedMinutesError !== null
                }
                onClick={async () => {
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
                  try {
                    const domain = normalizeModuleTaxonomyLabel(domainRaw);
                    const descriptionBn = createForm.description_bn.trim();
                    const created = await createModule({
                      title: {
                        bn: createForm.title_bn.trim(),
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
                        cards: [
                          {
                            id: 'card-0',
                            title: {},
                            body: {
                              [DEPLOYMENT_PRIMARY_LOCALE]: [
                                {
                                  type: 'paragraph',
                                  content: [{ type: 'text', text: '' }],
                                },
                              ],
                            },
                          },
                        ],
                      },
                    }).unwrap();
                    setCreateOpen(false);
                    void refetchDomainOptions();
                    setCreateForm(createEmptyCreateForm());
                    navigate(
                      paths.adminModuleReviewDetails.replace(
                        ':moduleId',
                        encodeURIComponent(created.id),
                      ),
                    );
                  } catch {
                    setCreateError(
                      'Failed to create module. Please try again.',
                    );
                  }
                }}
              >
                {isCreating ? 'Creating…' : 'Create draft'}
              </Button>
            </div>
          </Card>
        </Modal>
      ) : null}

      {deactivateConfirmOpen && deactivateModuleData ? (
        <Modal
          open={deactivateConfirmOpen}
          labelledBy="deactivate-module-title"
          onClose={() => {
            if (isDeactivating) return;
            setDeactivateError('');
            setDeactivateConfirmOpen(false);
            setDeactivateModuleData(null);
          }}
        >
          <Card
            variant="elevated"
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden border-spice-border p-0 shadow-lg"
          >
            <div className="shrink-0 space-y-4 p-6 pb-4">
              <div>
                <h2
                  id="deactivate-module-title"
                  className="text-xl font-semibold text-spice-text-primary"
                >
                  Deactivate Module
                </h2>
                <p className="mt-2 text-sm text-spice-text-medium">
                  You are deactivating{' '}
                  <span className="font-semibold text-spice-text-primary">
                    {deactivateModuleData.title}
                  </span>
                  . Once deactivated, this module will no longer be visible to
                  users for new assignments or training workflows. Do you want
                  to proceed?
                </p>
              </div>

              {deactivateError ? (
                <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
                  {deactivateError}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 justify-end gap-2 p-6 pt-2">
              <Button
                variant="secondary"
                className="h-9 text-xs"
                disabled={isDeactivating}
                onClick={() => {
                  setDeactivateError('');
                  setDeactivateConfirmOpen(false);
                  setDeactivateModuleData(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="h-9 text-xs bg-spice-semantic-error hover:bg-spice-semantic-error/90"
                disabled={isDeactivating}
                onClick={async () => {
                  setDeactivateError('');
                  try {
                    await deactivateModule({
                      moduleId: deactivateModuleData.id,
                    }).unwrap();
                    setDeactivateConfirmOpen(false);
                    setDeactivateModuleData(null);
                    refreshModuleList();
                  } catch {
                    setDeactivateError(
                      'Failed to deactivate module. Please try again.',
                    );
                  }
                }}
              >
                {isDeactivating ? 'Deactivating…' : 'Deactivate'}
              </Button>
            </div>
          </Card>
        </Modal>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            {isProgramManager ? 'Module Library' : t('moduleLibrary.title')}
          </h1>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="w-full sm:w-72">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search modules..."
            />
          </div>
          {isProgramManager ? (
            <>
              <Button
                onClick={() => {
                  setCreateError('');
                  setCreateForm(createEmptyCreateForm());
                  setCreateOpen(true);
                }}
              >
                Create Module
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Card variant="elevated" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          {isProgramManager ? (
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
                        label="Needs Review merge and skip information"
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
              className="w-fit px-[10px]"
            />
          ) : (
            <div />
          )}
          <SettingsFilterTriggerButton
            active={filtersActive}
            expanded={filtersDrawerOpen}
            onClick={handleOpenFiltersDrawer}
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
            isProgramManager={isProgramManager}
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
            modules={modulesForList}
            isLoading={isLoadingModules}
            onMerge={handleOverrideMerge}
            onSkip={handleSkipReview}
          />
        ) : tab === 'discarded' ? (
          <DiscardedTabTable
            modules={modulesForList}
            isLoading={isLoadingModules}
            onView={handleViewModule}
          />
        ) : (
          <Table<ModuleLibraryItem>
            data={filtered}
            columns={columns}
            keyExtractor={(r) => r.id}
            caption={tableCaption}
            emptyMessage={emptyMessage}
          />
        )}

        <div className="flex flex-col gap-3 border-t border-spice-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-spice-text-muted">
            <label className="inline-flex items-center gap-2">
              <span className="whitespace-nowrap font-medium text-spice-text-medium">
                Rows
              </span>
              <Select
                aria-label="Rows per page"
                className="h-8 w-[4.5rem] px-2 text-xs"
                value={String(pageSize)}
                options={MODULE_PAGE_SIZE_OPTIONS.map((size) => ({
                  label: String(size),
                  value: String(size),
                }))}
                onChange={(value) => {
                  const next = Number.parseInt(value, 10);
                  if (!Number.isFinite(next) || next <= 0) return;
                  setPageSize(next);
                  setPage(0);
                }}
              />
            </label>

            <label className="inline-flex items-center gap-2">
              <span className="whitespace-nowrap font-medium text-spice-text-medium">
                Page
              </span>
              <input
                type="number"
                min={1}
                max={totalPages > 0 ? totalPages : 1}
                step={1}
                inputMode="numeric"
                aria-label="Page number"
                className="h-8 w-14 rounded-md border border-spice-border-mid bg-spice-bg-surface px-2 text-center text-xs font-semibold text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/25"
                value={pageInput}
                onChange={(e) => handlePageInputChange(e.target.value)}
                onBlur={commitPageInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                      e.preventDefault();
                      return;
                    }
                  }
                }}
              />
              <span className="whitespace-nowrap">
                of{' '}
                <span className="font-semibold text-spice-text-medium">
                  {totalPages}
                </span>
              </span>
            </label>

            {filtered.length ? (
              <span className="whitespace-nowrap">
                Showing{' '}
                <span className="font-semibold text-spice-text-medium">
                  {rangeStart}
                </span>
                –
                <span className="font-semibold text-spice-text-medium">
                  {rangeEnd}
                </span>
                {totalModules > 0 ? (
                  <>
                    {' '}
                    of{' '}
                    <span className="font-semibold text-spice-text-medium">
                      {totalModules}
                    </span>
                  </>
                ) : null}
              </span>
            ) : (
              <span>No results on this page</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={!hasPrevPage}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              disabled={!hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
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
