export type ModuleLibraryTab = 'all' | 'published' | 'drafts' | 'deactivated';

export type ModuleLibraryFilters = {
  domain: string;
  dateFrom: string;
  dateTo: string;
  sourceDocumentId: string;
};

export const EMPTY_MODULE_LIBRARY_FILTERS: ModuleLibraryFilters = {
  domain: '',
  dateFrom: '',
  dateTo: '',
  sourceDocumentId: '',
};

const KNOWN_DOMAIN_ACRONYMS = new Set(['rmnch', 'ncd', 'anc']);

export function formatModuleDomainLabel(domain: string): string {
  const lower = domain.trim().toLowerCase();
  if (!lower) return domain;
  if (KNOWN_DOMAIN_ACRONYMS.has(lower)) {
    return lower.toUpperCase();
  }
  return lower
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function endOfDayUtcFromDateInput(dateInput: string): string {
  const date = new Date(`${dateInput.trim()}T00:00:00.000Z`);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

export function buildModuleListDateParams(
  dateFrom: string,
  dateTo: string,
): { date_from?: string; date_to?: string } {
  const result: { date_from?: string; date_to?: string } = {};
  if (dateFrom.trim()) {
    result.date_from = `${dateFrom.trim()}T00:00:00.000Z`;
  }
  if (dateTo.trim()) {
    result.date_to = endOfDayUtcFromDateInput(dateTo);
  }
  return result;
}

export function isDateRangeInvalid(dateFrom: string, dateTo: string): boolean {
  if (!dateFrom.trim() || !dateTo.trim()) return false;
  return dateFrom.trim() > dateTo.trim();
}

export function hasActiveModuleFilters(filters: ModuleLibraryFilters): boolean {
  return Boolean(
    filters.domain ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.sourceDocumentId,
  );
}

/**
 * Domain options are scoped to the current lifecycle tab. If a carried-over
 * domain is not in the tab's options, treat it as cleared so the UI and list
 * request stay in sync (Select would otherwise show "All domains" while the
 * API still receives the stale domain).
 */
export function resolveDomainForOptions(
  domain: string,
  options: readonly string[],
): string {
  if (!domain) return '';
  return options.includes(domain) ? domain : '';
}

export function tabToLifecycleStatus(
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): 'draft' | 'published' | 'deactivated' | undefined {
  if (!isProgramManager) return 'published';
  if (tab === 'published') return 'published';
  if (tab === 'drafts') return 'draft';
  if (tab === 'deactivated') return 'deactivated';
  return undefined;
}

export function parseModuleLibraryTab(
  value: string | null,
  isProgramManager: boolean,
): ModuleLibraryTab {
  if (!isProgramManager) return 'published';
  if (
    value === 'published' ||
    value === 'drafts' ||
    value === 'deactivated' ||
    value === 'all'
  ) {
    return value;
  }
  return 'drafts';
}

export function parseFiltersFromSearchParams(
  params: URLSearchParams,
): ModuleLibraryFilters {
  return {
    domain: params.get('domain') ?? '',
    dateFrom: params.get('from') ?? '',
    dateTo: params.get('to') ?? '',
    sourceDocumentId: params.get('doc') ?? '',
  };
}

export function buildModuleListSearchParams(
  tab: ModuleLibraryTab,
  filters: ModuleLibraryFilters,
  isProgramManager: boolean,
): URLSearchParams {
  const params = new URLSearchParams();
  if (isProgramManager) {
    params.set('tab', tab);
  }
  if (filters.domain) params.set('domain', filters.domain);
  if (filters.dateFrom) params.set('from', filters.dateFrom);
  if (filters.dateTo) params.set('to', filters.dateTo);
  if (filters.sourceDocumentId) params.set('doc', filters.sourceDocumentId);
  return params;
}

export function getModuleListDateHint(
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): string {
  if (!isProgramManager || tab === 'published') {
    return 'Date range filters by publish date.';
  }
  if (tab === 'drafts') {
    return 'Date range filters by creation date.';
  }
  if (tab === 'deactivated') {
    return '';
  }
  return 'Date range uses publish date when available, otherwise creation date.';
}

export type ModuleListingDateSource = {
  lifecycle_status: string;
  published_at: string | null;
  created_at: string;
  first_activated_at?: string | null;
  last_deactivated_at?: string | null;
  last_reactivated_at?: string | null;
};

export type ModuleListingDateColumn =
  | 'created'
  | 'published'
  | 'activated'
  | 'deactivated';

export function getModuleListingDateColumns(
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): ModuleListingDateColumn[] {
  if (!isProgramManager) {
    return ['created', 'published'];
  }
  if (tab === 'drafts') {
    return ['created'];
  }
  if (tab === 'deactivated') {
    return ['created', 'activated', 'deactivated'];
  }
  // published + all
  return ['created', 'published'];
}

export function moduleListingDateColumnHeader(
  column: ModuleListingDateColumn,
): string {
  if (column === 'published') return 'Published';
  if (column === 'activated') return 'Activated';
  if (column === 'deactivated') return 'Deactivated';
  return 'Created';
}

export function getModuleActivatedAt(
  module: ModuleListingDateSource,
): string | null {
  return (
    module.last_reactivated_at ??
    module.first_activated_at ??
    module.published_at ??
    null
  );
}

export function getModuleListingDate(
  module: ModuleListingDateSource,
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): string {
  const effectiveTab = isProgramManager ? tab : 'published';
  if (effectiveTab === 'drafts') {
    return module.created_at;
  }
  if (effectiveTab === 'published') {
    return module.published_at ?? module.created_at;
  }
  if (effectiveTab === 'deactivated') {
    return (
      getModuleActivatedAt(module) ??
      module.last_deactivated_at ??
      module.created_at
    );
  }
  return module.lifecycle_status === 'published' && module.published_at
    ? module.published_at
    : module.created_at;
}

export function getModuleListEmptyMessage(
  activeFilters: ModuleLibraryFilters,
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): string {
  if (hasActiveModuleFilters(activeFilters)) {
    return 'No modules match for the selected filters..';
  }
  if (!isProgramManager) {
    return 'No published modules yet.';
  }
  if (tab === 'drafts') return 'No draft modules yet.';
  if (tab === 'published') return 'No published modules yet.';
  if (tab === 'deactivated') return 'No deactivated modules found.';
  return 'No modules yet.';
}
