import { describe, expect, it } from 'vitest';
import {
  buildModuleListSearchParams,
  buildModuleListTypedDateParams,
  dateRangeValidationMessage,
  EMPTY_MODULE_LIBRARY_FILTERS,
  formatModuleDomainLabel,
  getAvailableDateFilterTypes,
  getModuleActivatedAt,
  getModuleListingDateColumns,
  getModuleListEmptyMessage,
  hasActiveModuleFilters,
  isAnyVisibleDateRangeInvalid,
  isDateRangeInvalid,
  moduleListingDateColumnHeader,
  parseFiltersFromSearchParams,
  parseModuleLibraryTab,
  resolveDomainForOptions,
  tabToLifecycleStatus,
} from './moduleListFilters';

describe('moduleListFilters', () => {
  it('formats known domain acronyms in uppercase', () => {
    expect(formatModuleDomainLabel('rmnch')).toBe('RMNCH');
    expect(formatModuleDomainLabel('ncd')).toBe('NCD');
  });

  it('title-cases unknown domain labels', () => {
    expect(formatModuleDomainLabel('hypertension')).toBe('Hypertension');
    expect(formatModuleDomainLabel('spice_app')).toBe('Spice App');
  });

  it('builds typed ISO date params for visible types only', () => {
    const filters = {
      ...EMPTY_MODULE_LIBRARY_FILTERS,
      createdFrom: '2026-04-01',
      createdTo: '2026-04-30',
      publishedFrom: '2026-05-01',
      publishedTo: '2026-05-31',
      deactivatedFrom: '2026-06-01',
    };
    expect(buildModuleListTypedDateParams(filters, 'drafts', true)).toEqual({
      created_from: '2026-04-01T00:00:00.000Z',
      created_to: '2026-04-30T23:59:59.999Z',
    });
    expect(buildModuleListTypedDateParams(filters, 'published', true)).toEqual({
      created_from: '2026-04-01T00:00:00.000Z',
      created_to: '2026-04-30T23:59:59.999Z',
      published_from: '2026-05-01T00:00:00.000Z',
      published_to: '2026-05-31T23:59:59.999Z',
    });
    expect(
      buildModuleListTypedDateParams(filters, 'deactivated', true)
        .deactivated_from,
    ).toBe('2026-06-01T00:00:00.000Z');
  });

  it('returns available date types by tab', () => {
    expect(getAvailableDateFilterTypes('drafts', true)).toEqual(['created']);
    expect(getAvailableDateFilterTypes('published', true)).toEqual([
      'created',
      'published',
    ]);
    expect(getAvailableDateFilterTypes('all', true)).toEqual([
      'created',
      'published',
      'activated',
      'deactivated',
    ]);
    expect(getAvailableDateFilterTypes('published', false)).toEqual([
      'created',
      'published',
    ]);
  });

  it('detects invalid date ranges', () => {
    expect(isDateRangeInvalid('2026-04-30', '2026-04-01')).toBe(true);
    expect(isDateRangeInvalid('2026-04-01', '2026-04-30')).toBe(false);
    expect(isDateRangeInvalid('2026-04-01', '')).toBe(true);
  });

  it('returns specific date range validation messages', () => {
    expect(dateRangeValidationMessage('', '')).toBeNull();
    expect(dateRangeValidationMessage('2026-04-01', '')).toBe(
      'Both from and to dates are required.',
    );
    expect(dateRangeValidationMessage('', '2026-04-30')).toBe(
      'Both from and to dates are required.',
    );
    expect(dateRangeValidationMessage('2026-04-30', '2026-04-01')).toBe(
      'From date must be on or before to date.',
    );
  });

  it('ignores hidden date types for badge / invalid checks on drafts', () => {
    const filters = {
      ...EMPTY_MODULE_LIBRARY_FILTERS,
      publishedFrom: '2026-05-01',
      publishedTo: '2026-04-01',
    };
    expect(hasActiveModuleFilters(filters, 'drafts', true)).toBe(false);
    expect(isAnyVisibleDateRangeInvalid(filters, 'drafts', true)).toBe(false);
    expect(hasActiveModuleFilters(filters, 'published', true)).toBe(true);
    expect(isAnyVisibleDateRangeInvalid(filters, 'published', true)).toBe(true);
  });

  it('detects active filters', () => {
    expect(hasActiveModuleFilters(EMPTY_MODULE_LIBRARY_FILTERS)).toBe(false);
    expect(
      hasActiveModuleFilters({
        ...EMPTY_MODULE_LIBRARY_FILTERS,
        domain: 'rmnch',
      }),
    ).toBe(true);
  });

  it('keeps a selected domain only when it exists in the current options', () => {
    expect(resolveDomainForOptions('', ['anc', 'ncd'])).toBe('');
    expect(resolveDomainForOptions('anc', ['anc', 'ncd'])).toBe('anc');
    expect(resolveDomainForOptions('anc', ['ncd', 'rmnch'])).toBe('');
    expect(resolveDomainForOptions('anc', [])).toBe('');
  });

  it('maps tabs to lifecycle status', () => {
    expect(tabToLifecycleStatus('published', true)).toBe('published');
    expect(tabToLifecycleStatus('drafts', true)).toBe('draft');
    expect(tabToLifecycleStatus('deactivated', true)).toBe('deactivated');
    expect(tabToLifecycleStatus('all', true)).toBeUndefined();
    expect(tabToLifecycleStatus('all', false)).toBe('published');
  });

  it('parses typed URL keys and migrates legacy from/to once', () => {
    const legacy = new URLSearchParams(
      'tab=published&domain=rmnch&from=2026-01-01',
    );
    expect(parseModuleLibraryTab(legacy.get('tab'), true)).toBe('published');
    expect(parseFiltersFromSearchParams(legacy, 'published', true)).toEqual({
      ...EMPTY_MODULE_LIBRARY_FILTERS,
      domain: 'rmnch',
      publishedFrom: '2026-01-01',
    });

    const typed = {
      ...EMPTY_MODULE_LIBRARY_FILTERS,
      domain: 'rmnch',
      publishedFrom: '2026-01-01',
    };
    expect(
      buildModuleListSearchParams('published', typed, true).toString(),
    ).toBe('tab=published&domain=rmnch&published_from=2026-01-01');
  });

  it('round-trips the source document filter through the doc param', () => {
    const params = buildModuleListSearchParams(
      'drafts',
      { ...EMPTY_MODULE_LIBRARY_FILTERS, sourceDocumentId: 'doc-123' },
      true,
    );
    expect(params.get('doc')).toBe('doc-123');
    expect(parseFiltersFromSearchParams(params).sourceDocumentId).toBe(
      'doc-123',
    );
  });

  it('persists the all tab in URL params so it does not fall back to drafts', () => {
    const params = buildModuleListSearchParams(
      'all',
      EMPTY_MODULE_LIBRARY_FILTERS,
      true,
    );
    expect(params.get('tab')).toBe('all');
    expect(parseModuleLibraryTab(params.get('tab'), true)).toBe('all');
  });

  it('returns tab-aware date columns', () => {
    expect(getModuleListingDateColumns('drafts', true)).toEqual(['created']);
    expect(getModuleListingDateColumns('published', true)).toEqual([
      'created',
      'published',
    ]);
    expect(getModuleListingDateColumns('deactivated', true)).toEqual([
      'created',
      'activated',
      'deactivated',
    ]);
    expect(getModuleListingDateColumns('all', true)).toEqual([
      'created',
      'published',
    ]);
    expect(getModuleListingDateColumns('published', false)).toEqual([
      'created',
      'published',
    ]);
  });

  it('labels date columns', () => {
    expect(moduleListingDateColumnHeader('created')).toBe('Created at');
    expect(moduleListingDateColumnHeader('published')).toBe('Published at');
    expect(moduleListingDateColumnHeader('activated')).toBe('Activated at');
    expect(moduleListingDateColumnHeader('deactivated')).toBe('Deactivated at');
  });

  it('prefers last_reactivated_at for Activated, then falls back', () => {
    expect(
      getModuleActivatedAt({
        lifecycle_status: 'deactivated',
        published_at: '2026-01-01T00:00:00.000Z',
        created_at: '2025-12-01T00:00:00.000Z',
        first_activated_at: '2026-01-01T00:00:00.000Z',
        last_reactivated_at: '2026-02-10T00:00:00.000Z',
      }),
    ).toBe('2026-02-10T00:00:00.000Z');
    expect(
      getModuleActivatedAt({
        lifecycle_status: 'deactivated',
        published_at: '2026-01-01T00:00:00.000Z',
        created_at: '2025-12-01T00:00:00.000Z',
        first_activated_at: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe('2026-01-01T00:00:00.000Z');
    expect(
      getModuleActivatedAt({
        lifecycle_status: 'deactivated',
        published_at: '2026-02-01T00:00:00.000Z',
        created_at: '2025-12-01T00:00:00.000Z',
      }),
    ).toBe('2026-02-01T00:00:00.000Z');
  });

  it('returns filter-aware empty messages', () => {
    expect(
      getModuleListEmptyMessage(
        { ...EMPTY_MODULE_LIBRARY_FILTERS, domain: 'ncd' },
        'published',
        true,
      ),
    ).toBe('No modules match for the selected filters.');
    expect(
      getModuleListEmptyMessage(EMPTY_MODULE_LIBRARY_FILTERS, 'drafts', true),
    ).toBe('No draft modules yet.');
  });
});
