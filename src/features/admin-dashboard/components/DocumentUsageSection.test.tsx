import { describe, expect, it, vi } from 'vitest';
import { DocumentUsageSection } from '@/features/admin-dashboard/components/DocumentUsageSection';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import type { DocumentUsageResponse } from '@/features/admin-dashboard/types/dashboard.types';
import { renderWithProviders } from '@/test-utils/render';

const useFetchDocumentUsageQuery = vi.hoisted(() => vi.fn());

vi.mock('@/features/admin-dashboard/api/dashboardApi', () => ({
  useFetchDocumentUsageQuery: (
    ...args: Parameters<typeof useFetchDocumentUsageQuery>
  ) => useFetchDocumentUsageQuery(...args),
}));

const emptyDocumentUsageData: DocumentUsageResponse = {
  from_date: '2026-01-01',
  to_date: '2026-01-31',
  total_views: 0,
  unique_documents: 0,
  unique_users: 0,
  top_documents: [],
  total_document_rows: 0,
  documents: [],
  total_events: 0,
  events: [],
  documents_limit: 5,
  documents_offset: 0,
  events_limit: 1,
  events_offset: 0,
};

describe('DocumentUsageSection', () => {
  it('refetches document usage with geography params', () => {
    useFetchDocumentUsageQuery.mockReturnValue({
      data: emptyDocumentUsageData,
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <DocumentUsageSection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={{ ...EMPTY_DASHBOARD_GEOGRAPHY, division: 'Dhaka' }}
      />,
    );

    expect(useFetchDocumentUsageQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '2026-01-01',
        to: '2026-01-31',
        division: 'Dhaka',
      }),
      expect.anything(),
    );
  });
});
