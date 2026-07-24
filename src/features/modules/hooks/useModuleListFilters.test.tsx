import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useModuleListFilters } from './useModuleListFilters';

function createWrapper(initialRoute: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
    );
  };
}

describe('useModuleListFilters', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reads filters from URL search params', () => {
    const { result } = renderHook(() => useModuleListFilters(true), {
      wrapper: createWrapper(
        '/module-library?tab=published&domain=Hypertension',
      ),
    });

    expect(result.current.tab).toBe('published');
    expect(result.current.activeFilters).toEqual({
      domain: 'Hypertension',
      dateFrom: '',
      dateTo: '',
      sourceDocumentId: '',
    });
  });

  it('keeps the same filters when switching tabs', () => {
    const { result } = renderHook(() => useModuleListFilters(true), {
      wrapper: createWrapper('/module-library'),
    });

    act(() => {
      result.current.setTab('published');
    });
    act(() => {
      result.current.setFilters({
        domain: 'Hypertension',
        dateFrom: '',
        dateTo: '',
        sourceDocumentId: '',
      });
    });

    expect(result.current.activeFilters.domain).toBe('Hypertension');

    act(() => {
      result.current.setTab('drafts');
    });

    expect(result.current.tab).toBe('drafts');
    expect(result.current.activeFilters.domain).toBe('Hypertension');

    act(() => {
      result.current.setTab('deactivated');
    });

    expect(result.current.tab).toBe('deactivated');
    expect(result.current.activeFilters.domain).toBe('Hypertension');
  });

  it('does not restore filters from an earlier visit on a bare url', () => {
    window.localStorage.setItem(
      'adminModuleLibraryView',
      JSON.stringify({
        tab: 'published',
        filters: {
          domain: 'Hypertension',
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
          sourceDocumentId: 'doc-9',
        },
      }),
    );

    const { result } = renderHook(() => useModuleListFilters(true), {
      wrapper: createWrapper('/module-library'),
    });

    expect(result.current.tab).toBe('drafts');
    expect(result.current.activeFilters).toEqual({
      domain: '',
      dateFrom: '',
      dateTo: '',
      sourceDocumentId: '',
    });
  });

  it('combines an externally passed document with explicit URL filters only', () => {
    window.localStorage.setItem(
      'adminModuleLibraryView',
      JSON.stringify({
        tab: 'deactivated',
        filters: {
          domain: 'Stale domain',
          dateFrom: '2025-01-01',
          dateTo: '2025-01-31',
          sourceDocumentId: 'stale-doc',
        },
      }),
    );
    const { result } = renderHook(() => useModuleListFilters(true), {
      wrapper: createWrapper(
        '/module-library?tab=published&domain=Hypertension&from=2026-01-01',
      ),
    });

    const resolved = result.current.resolveExternalViewSearch('all', {
      sourceDocumentId: 'current-doc',
    });

    expect(resolved).toBe(
      'tab=all&domain=Hypertension&from=2026-01-01&doc=current-doc',
    );
  });

  it('clears filters from URL', () => {
    const { result } = renderHook(() => useModuleListFilters(true), {
      wrapper: createWrapper(
        '/module-library?tab=published&domain=Hypertension',
      ),
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.activeFilters).toEqual({
      domain: '',
      dateFrom: '',
      dateTo: '',
      sourceDocumentId: '',
    });
  });
});
