import type { AdminModuleLifecycleStatus } from '@/features/modules/api/adminModulesApi';

export type ModuleLibraryTab =
  | 'all'
  | 'published'
  | 'drafts'
  | 'needs_review'
  | 'deactivated'
  | 'discarded';

export type ModuleDateFilterType =
  | 'created'
  | 'published'
  | 'activated'
  | 'deactivated';

export type ModuleLibraryFilters = {
  domain: string;
  sourceDocumentId: string;
  createdFrom: string;
  createdTo: string;
  publishedFrom: string;
  publishedTo: string;
  activatedFrom: string;
  activatedTo: string;
  deactivatedFrom: string;
  deactivatedTo: string;
};

export const EMPTY_MODULE_LIBRARY_FILTERS: ModuleLibraryFilters = {
  domain: '',
  sourceDocumentId: '',
  createdFrom: '',
  createdTo: '',
  publishedFrom: '',
  publishedTo: '',
  activatedFrom: '',
  activatedTo: '',
  deactivatedFrom: '',
  deactivatedTo: '',
};

const DATE_TYPE_URL_KEYS: Record<
  ModuleDateFilterType,
  { from: keyof ModuleLibraryFilters; to: keyof ModuleLibraryFilters }
> = {
  created: { from: 'createdFrom', to: 'createdTo' },
  published: { from: 'publishedFrom', to: 'publishedTo' },
  activated: { from: 'activatedFrom', to: 'activatedTo' },
  deactivated: { from: 'deactivatedFrom', to: 'deactivatedTo' },
};

const DATE_TYPE_API_KEYS: Record<
  ModuleDateFilterType,
  { from: string; to: string }
> = {
  created: { from: 'created_from', to: 'created_to' },
  published: { from: 'published_from', to: 'published_to' },
  activated: { from: 'activated_from', to: 'activated_to' },
  deactivated: { from: 'deactivated_from', to: 'deactivated_to' },
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

export function moduleDateFilterTypeLabel(type: ModuleDateFilterType): string {
  if (type === 'published') return 'Published Date';
  if (type === 'activated') return 'Activated Date';
  if (type === 'deactivated') return 'Deactivated Date';
  return 'Created Date';
}

export function getAvailableDateFilterTypes(
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): ModuleDateFilterType[] {
  if (!isProgramManager) {
    return ['created', 'published'];
  }
  if (tab === 'drafts') return ['created'];
  if (tab === 'published') return ['created', 'published'];
  return ['created', 'published', 'activated', 'deactivated'];
}

function primaryDateTypeForTab(
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): ModuleDateFilterType {
  if (!isProgramManager || tab === 'published') return 'published';
  if (tab === 'drafts') return 'created';
  if (tab === 'deactivated') return 'deactivated';
  return 'published';
}

export function dateRangeValidationMessage(
  dateFrom: string,
  dateTo: string,
): string | null {
  const from = dateFrom.trim();
  const to = dateTo.trim();
  if (!from && !to) return null;
  if (!from || !to) return 'Both from and to dates are required.';
  if (from > to) return 'From date must be on or before to date.';
  return null;
}

export function isDateRangeInvalid(dateFrom: string, dateTo: string): boolean {
  return dateRangeValidationMessage(dateFrom, dateTo) !== null;
}

export function isAnyVisibleDateRangeInvalid(
  filters: ModuleLibraryFilters,
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): boolean {
  return getAvailableDateFilterTypes(tab, isProgramManager).some((type) => {
    const keys = DATE_TYPE_URL_KEYS[type];
    return isDateRangeInvalid(
      String(filters[keys.from]),
      String(filters[keys.to]),
    );
  });
}

export function buildModuleListTypedDateParams(
  filters: ModuleLibraryFilters,
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const type of getAvailableDateFilterTypes(tab, isProgramManager)) {
    const fieldKeys = DATE_TYPE_URL_KEYS[type];
    const apiKeys = DATE_TYPE_API_KEYS[type];
    const fromValue = String(filters[fieldKeys.from]).trim();
    const toValue = String(filters[fieldKeys.to]).trim();
    if (fromValue) {
      result[apiKeys.from] = `${fromValue}T00:00:00.000Z`;
    }
    if (toValue) {
      result[apiKeys.to] = endOfDayUtcFromDateInput(toValue);
    }
  }
  return result;
}

function hasVisibleDateFilters(
  filters: ModuleLibraryFilters,
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): boolean {
  return getAvailableDateFilterTypes(tab, isProgramManager).some((type) => {
    const keys = DATE_TYPE_URL_KEYS[type];
    return Boolean(filters[keys.from] || filters[keys.to]);
  });
}

export function hasActiveModuleFilters(
  filters: ModuleLibraryFilters,
  tab?: ModuleLibraryTab,
  isProgramManager?: boolean,
): boolean {
  if (filters.domain || filters.sourceDocumentId) return true;
  if (tab !== undefined && isProgramManager !== undefined) {
    return hasVisibleDateFilters(filters, tab, isProgramManager);
  }
  return Boolean(
    filters.createdFrom ||
    filters.createdTo ||
    filters.publishedFrom ||
    filters.publishedTo ||
    filters.activatedFrom ||
    filters.activatedTo ||
    filters.deactivatedFrom ||
    filters.deactivatedTo,
  );
}

/**
 * Keep a selected domain only when it appears in the provided options list.
 * Used by callers that need to validate a domain against a known option set.
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
): AdminModuleLifecycleStatus | undefined {
  if (!isProgramManager) return 'published';
  if (tab === 'published') return 'published';
  if (tab === 'drafts') return 'draft';
  if (tab === 'needs_review') return 'review_pending';
  if (tab === 'deactivated') return 'deactivated';
  if (tab === 'discarded') return 'retired';
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
    value === 'needs_review' ||
    value === 'deactivated' ||
    value === 'discarded' ||
    value === 'all'
  ) {
    return value;
  }
  return 'drafts';
}

export function parseFiltersFromSearchParams(
  params: URLSearchParams,
  tab: ModuleLibraryTab = 'drafts',
  isProgramManager = true,
): ModuleLibraryFilters {
  const filters: ModuleLibraryFilters = {
    domain: params.get('domain') ?? '',
    sourceDocumentId: params.get('doc') ?? '',
    createdFrom: params.get('created_from') ?? '',
    createdTo: params.get('created_to') ?? '',
    publishedFrom: params.get('published_from') ?? '',
    publishedTo: params.get('published_to') ?? '',
    activatedFrom: params.get('activated_from') ?? '',
    activatedTo: params.get('activated_to') ?? '',
    deactivatedFrom: params.get('deactivated_from') ?? '',
    deactivatedTo: params.get('deactivated_to') ?? '',
  };

  const legacyFrom = params.get('from') ?? '';
  const legacyTo = params.get('to') ?? '';
  if (legacyFrom || legacyTo) {
    const primary = primaryDateTypeForTab(tab, isProgramManager);
    const keys = DATE_TYPE_URL_KEYS[primary];
    if (!filters[keys.from] && legacyFrom) {
      filters[keys.from] = legacyFrom;
    }
    if (!filters[keys.to] && legacyTo) {
      filters[keys.to] = legacyTo;
    }
  }

  return filters;
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
  if (filters.sourceDocumentId) params.set('doc', filters.sourceDocumentId);

  for (const type of [
    'created',
    'published',
    'activated',
    'deactivated',
  ] as const) {
    const fieldKeys = DATE_TYPE_URL_KEYS[type];
    const apiKeys = DATE_TYPE_API_KEYS[type];
    const fromValue = String(filters[fieldKeys.from]);
    const toValue = String(filters[fieldKeys.to]);
    if (fromValue) params.set(apiKeys.from, fromValue);
    if (toValue) params.set(apiKeys.to, toValue);
  }

  return params;
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
  if (column === 'published') return 'Published at';
  if (column === 'activated') return 'Activated at';
  if (column === 'deactivated') return 'Deactivated at';
  return 'Created at';
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

export function getModuleListEmptyMessage(
  activeFilters: ModuleLibraryFilters,
  tab: ModuleLibraryTab,
  isProgramManager: boolean,
): string {
  if (hasActiveModuleFilters(activeFilters, tab, isProgramManager)) {
    return 'No modules match for the selected filters.';
  }
  if (!isProgramManager) {
    return 'No published modules yet.';
  }
  if (tab === 'drafts') return 'No draft modules yet.';
  if (tab === 'published') return 'No published modules yet.';
  if (tab === 'needs_review') return 'No modules requiring review.';
  if (tab === 'deactivated') return 'No deactivated modules found.';
  if (tab === 'discarded') return 'No discarded modules found.';
  return 'No modules yet.';
}
