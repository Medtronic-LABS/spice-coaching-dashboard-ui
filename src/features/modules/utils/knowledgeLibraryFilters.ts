import { dateRangeValidationMessage } from '@/features/modules/utils/moduleListFilters';
import {
  KNOWLEDGE_LIBRARY_FILTER_DEFAULTS,
  type KnowledgeLibraryFilters,
} from '@/features/modules/types/knowledgeLibrary.types';

/** Drawer-only filter fields (search/sort/status stay outside). */
export type KnowledgeLibraryDrawerFilters = Pick<
  KnowledgeLibraryFilters,
  | 'uploadedBy'
  | 'assigned'
  | 'uploadedAtFrom'
  | 'uploadedAtTo'
  | 'updatedAtFrom'
  | 'updatedAtTo'
>;

export const KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS: KnowledgeLibraryDrawerFilters =
  {
    uploadedBy: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.uploadedBy,
    assigned: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.assigned,
    uploadedAtFrom: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.uploadedAtFrom,
    uploadedAtTo: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.uploadedAtTo,
    updatedAtFrom: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.updatedAtFrom,
    updatedAtTo: KNOWLEDGE_LIBRARY_FILTER_DEFAULTS.updatedAtTo,
  };

export function hasActiveKnowledgeDrawerFilters(
  filters: KnowledgeLibraryDrawerFilters,
): boolean {
  if (filters.uploadedBy.trim()) return true;
  if (filters.assigned !== 'all') return true;
  if (filters.uploadedAtFrom || filters.uploadedAtTo) return true;
  if (filters.updatedAtFrom || filters.updatedAtTo) return true;
  return false;
}

export function isKnowledgeDrawerDateRangeInvalid(
  filters: KnowledgeLibraryDrawerFilters,
): boolean {
  return (
    dateRangeValidationMessage(filters.uploadedAtFrom, filters.uploadedAtTo) !==
      null ||
    dateRangeValidationMessage(filters.updatedAtFrom, filters.updatedAtTo) !==
      null
  );
}
