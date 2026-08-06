import { dateRangeValidationMessage } from '@/features/modules/utils/moduleListFilters';
import {
  KNOWLEDGE_LIBRARY_FILTER_DEFAULTS,
  type KnowledgeLibraryFilters,
} from '@/features/modules/types/knowledgeLibrary.types';

/** Drawer-only filter fields (search/sort/status stay outside). */
export type KnowledgeLibraryDrawerFilters = Pick<
  KnowledgeLibraryFilters,
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
