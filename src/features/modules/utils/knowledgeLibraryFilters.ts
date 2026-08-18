import type { FetchSourceDocumentsParams } from '@/features/modules/api/adminSourceDocumentsApi';
import { dateRangeValidationMessage } from '@/features/modules/utils/moduleListFilters';
import {
  KNOWLEDGE_LIBRARY_FILTER_DEFAULTS,
  type KnowledgeLibraryFilterState,
} from '@/features/modules/types/knowledgeLibrary.types';

/** Drawer-only filter fields (search/sort/status stay outside). */
export type KnowledgeLibraryDrawerFilters = Pick<
  KnowledgeLibraryFilterState,
  'uploadedAtFrom' | 'uploadedAtTo' | 'uploadedBy' | 'assigned' | 'ingested'
>;

export const KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS: KnowledgeLibraryDrawerFilters =
  {
    uploadedAtFrom: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.uploadedAtFrom,
    uploadedAtTo: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.uploadedAtTo,
    uploadedBy: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.uploadedBy,
    assigned: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.assigned,
    ingested: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.ingested,
  };

export function hasActiveKnowledgeDrawerFilters(
  filters: KnowledgeLibraryDrawerFilters,
): boolean {
  return Boolean(
    filters.uploadedAtFrom ||
    filters.uploadedAtTo ||
    filters.uploadedBy ||
    filters.assigned ||
    filters.ingested,
  );
}

export function isKnowledgeDrawerDateRangeInvalid(
  filters: KnowledgeLibraryDrawerFilters,
): boolean {
  return (
    dateRangeValidationMessage(filters.uploadedAtFrom, filters.uploadedAtTo) !==
    null
  );
}

export function uploadedDateInputToFromIso(dateInput: string): string {
  return new Date(`${dateInput.trim()}T00:00:00.000Z`).toISOString();
}

export function uploadedDateInputToToIso(dateInput: string): string {
  const date = new Date(`${dateInput.trim()}T00:00:00.000Z`);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

/**
 * Maps Knowledge Library UI status tab + ingested drawer filter to
 * `GET /admin/source-documents` `status` query values.
 * The backend has no `ingested` query param.
 */
export function resolveKnowledgeCatalogStatusFilter(args: {
  statusTab: KnowledgeLibraryFilterState['status'];
  ingested: KnowledgeLibraryFilterState['ingested'];
}): FetchSourceDocumentsParams['status'] {
  if (args.statusTab === 'retired') return 'retired';
  if (args.ingested === 'true') return 'ingested';
  if (args.ingested === 'false') return ['uploaded', 'ingesting', 'failed'];
  return undefined;
}
