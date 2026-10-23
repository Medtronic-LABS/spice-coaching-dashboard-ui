import { skipToken } from '@reduxjs/toolkit/query/react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      currentData: emptyDocumentUsageData,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <DocumentUsageSection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={{
          ...EMPTY_DASHBOARD_GEOGRAPHY,
          divisionId: '1',
        }}
      />,
    );

    expect(useFetchDocumentUsageQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '2026-01-01',
        to: '2026-01-31',
        division_id: 1,
      }),
    );
    expect(useFetchDocumentUsageQuery).toHaveBeenCalledWith(skipToken);
  });

  it('sends debounced title search q on documents all view', async () => {
    const user = userEvent.setup({ delay: null });
    const listData: DocumentUsageResponse = {
      ...emptyDocumentUsageData,
      total_document_rows: 2,
      documents: [
        {
          document_id: 'doc-1',
          document_title: 'Protocol A',
          total_views: 3,
          unique_users: 1,
          last_viewed_at: null,
          last_viewed_by_user_id: null,
          last_viewed_by_user_name: null,
        },
      ],
    };
    useFetchDocumentUsageQuery.mockReturnValue({
      data: listData,
      currentData: listData,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <DocumentUsageSection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /view all documents/i }),
    );

    const search = await screen.findByPlaceholderText(/search documents/i);
    await user.type(search, 'protocol');

    await waitFor(() => {
      expect(useFetchDocumentUsageQuery).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'protocol' }),
      );
    });
  });

  it('keeps search mounted and only skeletons the table while searching', async () => {
    const user = userEvent.setup({ delay: null });
    const listData: DocumentUsageResponse = {
      ...emptyDocumentUsageData,
      total_document_rows: 1,
      documents: [
        {
          document_id: 'doc-1',
          document_title: 'Protocol A',
          total_views: 3,
          unique_users: 1,
          last_viewed_at: null,
          last_viewed_by_user_id: null,
          last_viewed_by_user_name: null,
        },
      ],
    };
    useFetchDocumentUsageQuery.mockReturnValue({
      data: listData,
      currentData: listData,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <DocumentUsageSection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /view all documents/i }),
    );
    const search = await screen.findByPlaceholderText(/search documents/i);
    expect(screen.getByText('Protocol A')).toBeInTheDocument();

    useFetchDocumentUsageQuery.mockReturnValue({
      data: undefined,
      currentData: undefined,
      isLoading: false,
      isFetching: true,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    await user.type(search, 'protocol');

    await waitFor(() => {
      expect(screen.queryByText('Protocol A')).not.toBeInTheDocument();
    });
    expect(
      screen.getByPlaceholderText(/search documents/i),
    ).toBeInTheDocument();
  });
});
