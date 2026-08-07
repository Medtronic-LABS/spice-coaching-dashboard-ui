import {
  EMPTY_BADGE_FILTERS,
  type AdminBadge,
  type AdminBadgeWriteBody,
  type BadgeManagementFilters,
} from '@/features/badges/types/badge.types';

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
  const from = dateFrom.trim();
  const to = dateTo.trim();
  if (!from || !to) return false;
  return from > to;
}

export function hasActiveBadgeFilters(
  filters: BadgeManagementFilters,
): boolean {
  return (
    Boolean(filters.domain.trim()) ||
    Boolean(filters.createdBy.trim()) ||
    Boolean(filters.createdFrom.trim()) ||
    Boolean(filters.createdTo.trim()) ||
    Boolean(filters.moduleTitle.trim())
  );
}

/** Chatbot FAQ-only modules are not assignable to milestones / badge filters. */
export function isAssignablePublishedModule(module: {
  chatbot_faqs_only?: boolean;
}): boolean {
  return !module.chatbot_faqs_only;
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
export function sortBadgesBySequenceAsc(
  badges: readonly AdminBadge[],
): AdminBadge[] {
  return [...badges].sort((a, b) => {
    if (a.sequence == null && b.sequence == null) {
      return a.id.localeCompare(b.id);
    }
    if (a.sequence == null) return 1;
    if (b.sequence == null) return -1;
    if (a.sequence !== b.sequence) return a.sequence - b.sequence;
    return a.id.localeCompare(b.id);
  });
}

export function findSequenceNeighbor(
  badges: readonly AdminBadge[],
  badgeId: string,
  direction: 'up' | 'down',
): AdminBadge | null {
  const ordered = sortBadgesBySequenceAsc(badges);
  const index = ordered.findIndex((badge) => badge.id === badgeId);
  if (index < 0) return null;
  const neighborIndex = direction === 'up' ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= ordered.length) return null;
  const current = ordered[index];
  const neighbor = ordered[neighborIndex];
  if (current.sequence == null || neighbor.sequence == null) return null;
  return neighbor;
}

export function getMutationErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error &&
    'data' in error &&
    typeof (error as { data?: unknown }).data === 'object' &&
    (error as { data?: { message?: unknown } }).data?.message
  ) {
    return String((error as { data: { message: unknown } }).data.message);
  }
  return 'Something went wrong. Please try again.';
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
