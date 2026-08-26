import type {
  DocumentUsageDocumentRow,
  DocumentUsageEventRow,
  DocumentUsageTopItem,
} from '@/features/admin-dashboard/types/dashboard.types';
import { hierarchyRoleKind } from '@/features/admin-dashboard/utils/teamActivity';

const DOCUMENT_USAGE_ROLE_ABBREVIATION = {
  am: 'AM',
  po: 'PO',
  sk: 'SK',
} as const;

export const OVERVIEW_TOP_LIMIT = 5;
export const OVERVIEW_DOCUMENTS_LIMIT = 5;
export const PAGE_SIZE_OPTIONS = [5, 10, 15, 25] as const;
export const DEFAULT_PAGE_SIZE = 10;

export type DocumentUsageListView = 'overview' | 'documentsAll';
export type DocumentUsageView = DocumentUsageListView | 'documentDetail';

export interface DocumentUsageQueryArgs {
  top_limit: number;
  documents_limit: number;
  documents_offset: number;
  events_limit: number;
  events_offset: number;
  document_id?: string;
  q?: string;
}

export interface DocumentUsageTopCard {
  id: string;
  rank: number;
  title: string;
  views: number;
  uniqueUsers: number | null;
  percent: number;
}

export function buildDocumentUsageQueryArgs(params: {
  view: DocumentUsageView;
  detailDocumentId?: string | null;
  documentsPage: number;
  documentsPageSize: number;
  eventsPage: number;
  eventsPageSize: number;
  /** Server-side title search; only sent on documentsAll. */
  q?: string;
}): DocumentUsageQueryArgs {
  const {
    view,
    detailDocumentId,
    documentsPage,
    documentsPageSize,
    eventsPage,
    eventsPageSize,
    q,
  } = params;

  if (view === 'overview') {
    return {
      top_limit: OVERVIEW_TOP_LIMIT,
      documents_limit: OVERVIEW_DOCUMENTS_LIMIT,
      documents_offset: 0,
      events_limit: 1,
      events_offset: 0,
    };
  }

  if (view === 'documentDetail' && detailDocumentId) {
    return {
      document_id: detailDocumentId,
      top_limit: 1,
      documents_limit: 1,
      documents_offset: 0,
      events_limit: eventsPageSize,
      events_offset: eventsPage * eventsPageSize,
    };
  }

  const trimmedQ = q?.trim();
  return {
    top_limit: OVERVIEW_TOP_LIMIT,
    documents_limit: documentsPageSize,
    documents_offset: documentsPage * documentsPageSize,
    events_limit: 1,
    events_offset: 0,
    ...(trimmedQ ? { q: trimmedQ } : {}),
  };
}

export function uniqueUsersByDocumentId(
  documents: DocumentUsageDocumentRow[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of documents) {
    map.set(row.document_id, row.unique_users);
  }
  return map;
}

export function mapTopDocuments(
  topDocuments: DocumentUsageTopItem[],
  uniqueUsersByDocument: Map<string, number>,
): DocumentUsageTopCard[] {
  const maxViews = Math.max(...topDocuments.map((item) => item.view_count), 1);
  return topDocuments.map((item, index) => ({
    id: item.document_id,
    rank: index + 1,
    title: item.document_title ?? item.document_id,
    views: item.view_count,
    uniqueUsers: uniqueUsersByDocument.get(item.document_id) ?? null,
    percent: (item.view_count / maxViews) * 100,
  }));
}

export function formatEventGeography(
  district: string | null,
  upazilaId: string | null,
): string {
  return [district, upazilaId].filter(Boolean).join(' / ') || '—';
}

/** Compact AM / PO / SK labels for the document-usage opens table. */
export function formatDocumentUsageRoleAbbreviation(
  role: string | null,
): string {
  if (role == null || role.trim() === '') return '—';
  const kind = hierarchyRoleKind(role);
  if (kind === 'unknown') return role;
  return DOCUMENT_USAGE_ROLE_ABBREVIATION[kind];
}

export function mapEventRows(
  events: DocumentUsageEventRow[],
): Array<DocumentUsageEventRow & { geography: string }> {
  return events.map((event) => ({
    ...event,
    geography: formatEventGeography(event.district, event.upazila_id),
  }));
}

export function paginationRange(
  page: number,
  pageSize: number,
  rowCount: number,
): { start: number; end: number } {
  if (rowCount <= 0) return { start: 0, end: 0 };
  const start = page * pageSize + 1;
  const end = page * pageSize + rowCount;
  return { start, end };
}
