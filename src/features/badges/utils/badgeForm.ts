import {
  EMPTY_BADGE_FILTERS,
  type AdminBadge,
  type AdminBadgeWriteBody,
  type BadgeManagementFilters,
} from '@/features/badges/types/badge.types';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';

/** Derive object key from `bucket/key` or bare object key storage paths. */
export function objectNameFromStoragePath(storagePath: string): string {
  const clean = storagePath.trim().replace(/^\/+/, '');
  if (!clean) return '';

  const knownObjectPrefixes = ['uploads/', 'media/', 'badges/', 'thumbnails/'];
  if (knownObjectPrefixes.some((prefix) => clean.startsWith(prefix))) {
    return clean;
  }

  const slash = clean.indexOf('/');
  if (slash === -1) return clean;
  return clean.slice(slash + 1);
}

export function isDateRangeInvalid(dateFrom: string, dateTo: string): boolean {
  return dateRangeValidationMessage(dateFrom, dateTo) !== null;
}

export function dateRangeValidationMessage(
  dateFrom: string,
  dateTo: string,
): string | null {
  const from = dateFrom.trim();
  const to = dateTo.trim();
  if (!from && !to) return null;
  if (!from || !to) return 'Both from and to dates are required.';
  if (from > to) return 'From date must be on or before to date.';
  return null;
}

export function hasActiveBadgeFilters(
  filters: BadgeManagementFilters,
): boolean {
  return (
    Boolean(filters.createdBy.trim()) ||
    Boolean(filters.createdFrom.trim()) ||
    Boolean(filters.createdTo.trim()) ||
    Boolean(filters.moduleTitle.trim())
  );
}

export function endOfDayUtcFromDateInput(dateInput: string): string {
  const date = new Date(`${dateInput.trim()}T00:00:00.000Z`);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

export function buildBadgeListDateParams(filters: BadgeManagementFilters): {
  created_from?: string;
  created_to?: string;
} {
  const result: { created_from?: string; created_to?: string } = {};
  if (filters.createdFrom.trim()) {
    result.created_from = `${filters.createdFrom.trim()}T00:00:00.000Z`;
  }
  if (filters.createdTo.trim()) {
    result.created_to = endOfDayUtcFromDateInput(filters.createdTo);
  }
  return result;
}

/** Next global sequence: max existing sequence + 1 (starts at 1). */
export function nextGlobalBadgeSequence(
  badges: readonly Pick<AdminBadge, 'sequence'>[],
): number {
  let max = 0;
  for (const badge of badges) {
    if (badge.sequence != null && badge.sequence > max) {
      max = badge.sequence;
    }
  }
  return max + 1;
}

/** Active badges ordered by sequence ascending (nulls last). */
export {
  assignSequencesByOrder,
  diffBadgeSequenceChanges,
  reorderBadges,
  sortBadgesBySequenceAsc,
  type BadgeSequenceChange,
} from '@/features/badges/utils/badgeSequence';

export function getMutationErrorMessage(error: unknown): string {
  const message = formatRtkQueryError(error);
  return message === 'Something went wrong'
    ? 'Something went wrong. Please try again.'
    : message;
}

/** Full badge write body for create/update/reorder PUTs. */
export function toBadgeWriteBody(
  badge: Pick<
    AdminBadge,
    'name' | 'domain' | 'image_storage_path' | 'module_ids'
  >,
  sequence: number | null,
): AdminBadgeWriteBody {
  return {
    name: badge.name,
    domain: badge.domain,
    image_storage_path: badge.image_storage_path,
    module_ids: badge.module_ids,
    sequence,
  };
}

export { EMPTY_BADGE_FILTERS };
