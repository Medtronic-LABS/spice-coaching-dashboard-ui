import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAGE_SIZE,
  OVERVIEW_DOCUMENTS_LIMIT,
  OVERVIEW_TOP_LIMIT,
  TOP_ALL_LIMIT,
  buildDocumentUsageQueryArgs,
  filterDocumentsBySearch,
  formatEventGeography,
  mapEventRows,
  mapTopDocuments,
  paginationRange,
  uniqueUsersByDocumentId,
} from '@/features/admin-dashboard/utils/documentUsage';
import type {
  DocumentUsageDocumentRow,
  DocumentUsageEventRow,
  DocumentUsageTopItem,
} from '@/features/admin-dashboard/types/dashboard.types';

function documentRow(
  partial: Partial<DocumentUsageDocumentRow> &
    Pick<DocumentUsageDocumentRow, 'document_id'>,
): DocumentUsageDocumentRow {
  return {
    document_title: partial.document_title ?? partial.document_id,
    total_views: partial.total_views ?? 1,
    unique_users: partial.unique_users ?? 1,
    last_viewed_at: partial.last_viewed_at ?? null,
    last_viewed_by_user_id: partial.last_viewed_by_user_id ?? null,
    last_viewed_by_user_name: partial.last_viewed_by_user_name ?? null,
    ...partial,
  };
}

describe('buildDocumentUsageQueryArgs', () => {
  it('builds overview limits', () => {
    expect(
      buildDocumentUsageQueryArgs({
        view: 'overview',
        documentsPage: 2,
        documentsPageSize: 10,
        eventsPage: 3,
        eventsPageSize: 10,
      }),
    ).toEqual({
      top_limit: OVERVIEW_TOP_LIMIT,
      documents_limit: OVERVIEW_DOCUMENTS_LIMIT,
      documents_offset: 0,
      events_limit: 1,
      events_offset: 0,
    });
  });

  it('builds topAll limits', () => {
    expect(
      buildDocumentUsageQueryArgs({
        view: 'topAll',
        documentsPage: 0,
        documentsPageSize: DEFAULT_PAGE_SIZE,
        eventsPage: 0,
        eventsPageSize: DEFAULT_PAGE_SIZE,
      }),
    ).toMatchObject({
      top_limit: TOP_ALL_LIMIT,
      documents_limit: TOP_ALL_LIMIT,
      documents_offset: 0,
    });
  });

  it('builds documentsAll pagination offsets', () => {
    expect(
      buildDocumentUsageQueryArgs({
        view: 'documentsAll',
        documentsPage: 2,
        documentsPageSize: 10,
        eventsPage: 0,
        eventsPageSize: 10,
      }),
    ).toEqual({
      top_limit: OVERVIEW_TOP_LIMIT,
      documents_limit: 10,
      documents_offset: 20,
      events_limit: 1,
      events_offset: 0,
    });
  });

  it('builds documentDetail with document_id and event pagination', () => {
    expect(
      buildDocumentUsageQueryArgs({
        view: 'documentDetail',
        detailDocumentId: 'doc-9',
        documentsPage: 0,
        documentsPageSize: 10,
        eventsPage: 1,
        eventsPageSize: 15,
      }),
    ).toEqual({
      document_id: 'doc-9',
      top_limit: 1,
      documents_limit: 1,
      documents_offset: 0,
      events_limit: 15,
      events_offset: 15,
    });
  });
});

describe('document usage row mappers', () => {
  it('maps top documents with unique-user join and percent scale', () => {
    const top: DocumentUsageTopItem[] = [
      { document_id: 'a', document_title: 'Alpha', view_count: 10 },
      { document_id: 'b', document_title: null, view_count: 5 },
    ];
    const uniqueUsers = uniqueUsersByDocumentId([
      documentRow({ document_id: 'a', unique_users: 4 }),
      documentRow({ document_id: 'b', unique_users: 2 }),
    ]);

    expect(mapTopDocuments(top, uniqueUsers)).toEqual([
      {
        id: 'a',
        rank: 1,
        title: 'Alpha',
        views: 10,
        uniqueUsers: 4,
        percent: 100,
      },
      {
        id: 'b',
        rank: 2,
        title: 'b',
        views: 5,
        uniqueUsers: 2,
        percent: 50,
      },
    ]);
  });

  it('filters documents by title or last viewer name', () => {
    const rows = [
      documentRow({
        document_id: '1',
        document_title: 'Onboarding PDF',
        last_viewed_by_user_name: 'Asha',
      }),
      documentRow({
        document_id: '2',
        document_title: 'Policy',
        last_viewed_by_user_name: 'Rafi',
      }),
    ];

    expect(
      filterDocumentsBySearch(rows, 'onboard').map((r) => r.document_id),
    ).toEqual(['1']);
    expect(
      filterDocumentsBySearch(rows, 'rafi').map((r) => r.document_id),
    ).toEqual(['2']);
    expect(filterDocumentsBySearch(rows, '  ').length).toBe(2);
  });

  it('formats event geography and maps rows', () => {
    expect(formatEventGeography('Dhaka', 'up-1')).toBe('Dhaka / up-1');
    expect(formatEventGeography(null, null)).toBe('—');

    const events: DocumentUsageEventRow[] = [
      {
        event_id: 'e1',
        document_id: 'd1',
        document_title: 'Doc',
        user_id: 1,
        user_name: 'Asha',
        user_role: 'sk',
        upazila_id: 'u1',
        district: 'Dhaka',
        viewed_at: '2026-01-01T00:00:00Z',
      },
    ];

    expect(mapEventRows(events)[0]?.geography).toBe('Dhaka / u1');
  });

  it('computes pagination display ranges', () => {
    expect(paginationRange(0, 10, 0)).toEqual({ start: 0, end: 0 });
    expect(paginationRange(1, 10, 4)).toEqual({ start: 11, end: 14 });
  });
});
