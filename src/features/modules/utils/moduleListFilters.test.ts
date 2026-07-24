import { describe, expect, it } from 'vitest';
import {
  buildModuleListDateParams,
  buildModuleListSearchParams,
  EMPTY_MODULE_LIBRARY_FILTERS,
  formatModuleDomainLabel,
  getModuleActivatedAt,
  getModuleListDateHint,
  getModuleListingDate,
  getModuleListingDateColumns,
  getModuleListEmptyMessage,
  hasActiveModuleFilters,
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

  it('builds ISO date params for API requests', () => {
    expect(buildModuleListDateParams('2026-04-01', '2026-04-30')).toEqual({
      date_from: '2026-04-01T00:00:00.000Z',
      date_to: '2026-04-30T23:59:59.999Z',
    });
    expect(buildModuleListDateParams('', '')).toEqual({});
  });

  it('detects invalid date ranges', () => {
    expect(isDateRangeInvalid('2026-04-30', '2026-04-01')).toBe(true);
    expect(isDateRangeInvalid('2026-04-01', '2026-04-30')).toBe(false);
    expect(isDateRangeInvalid('2026-04-01', '')).toBe(false);
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

  it('parses and builds URL search params', () => {
    const params = new URLSearchParams(
      'tab=published&domain=rmnch&from=2026-01-01',
    );
    expect(parseModuleLibraryTab(params.get('tab'), true)).toBe('published');
    expect(parseFiltersFromSearchParams(params)).toEqual({
      domain: 'rmnch',
      dateFrom: '2026-01-01',
      dateTo: '',
      sourceDocumentId: '',
    });
    expect(
      buildModuleListSearchParams(
        'published',
        {
          domain: 'rmnch',
          dateFrom: '2026-01-01',
          dateTo: '',
          sourceDocumentId: '',
        },
        true,
      ).toString(),
    ).toBe('tab=published&domain=rmnch&from=2026-01-01');
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

  it('returns tab-aware date hints', () => {
    expect(getModuleListDateHint('published', true)).toBe(
      'Date range filters by publish date.',
    );
    expect(getModuleListDateHint('drafts', true)).toBe(
      'Date range filters by creation date.',
    );
    expect(getModuleListDateHint('deactivated', true)).toBe('');
    expect(getModuleListDateHint('all', true)).toContain('publish date');
    expect(getModuleListDateHint('published', false)).toBe(
      'Date range filters by publish date.',
    );
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
    expect(moduleListingDateColumnHeader('created')).toBe('Created');
    expect(moduleListingDateColumnHeader('published')).toBe('Published');
    expect(moduleListingDateColumnHeader('activated')).toBe('Activated');
    expect(moduleListingDateColumnHeader('deactivated')).toBe('Deactivated');
  });

  it('picks listing dates by tab', () => {
    const module = {
      lifecycle_status: 'deactivated',
      published_at: '2026-01-01T00:00:00.000Z',
      created_at: '2025-12-01T00:00:00.000Z',
      first_activated_at: '2026-01-01T00:00:00.000Z',
      last_reactivated_at: '2026-02-10T00:00:00.000Z',
      last_deactivated_at: '2026-03-15T00:00:00.000Z',
    };
    expect(getModuleListingDate(module, 'deactivated', true)).toBe(
      '2026-02-10T00:00:00.000Z',
    );
    expect(getModuleActivatedAt(module)).toBe('2026-02-10T00:00:00.000Z');
    expect(getModuleListingDate(module, 'published', true)).toBe(
      '2026-01-01T00:00:00.000Z',
    );
    expect(getModuleListingDate(module, 'drafts', true)).toBe(
      '2025-12-01T00:00:00.000Z',
    );
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
    ).toBe('No modules match for the selected filters..');
    expect(
      getModuleListEmptyMessage(EMPTY_MODULE_LIBRARY_FILTERS, 'drafts', true),
    ).toBe('No draft modules yet.');
  });
});
