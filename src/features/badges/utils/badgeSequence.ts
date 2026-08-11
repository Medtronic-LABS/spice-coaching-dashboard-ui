import type { AdminBadge } from '@/features/badges/types/badge.types';

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

/** Move an item within a list (same semantics as module card reorder). */
export function reorderBadges<T>(
  items: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return [...items];
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Reassign sequences by new order, preserving the sorted set of existing
 * sequence numbers (gaps kept). Badges with null sequence get no number.
 */
export function assignSequencesByOrder(
  ordered: readonly AdminBadge[],
): AdminBadge[] {
  const sequencePool = sortBadgesBySequenceAsc(ordered)
    .map((badge) => badge.sequence)
    .filter((sequence): sequence is number => sequence != null);

  let poolIndex = 0;
  return ordered.map((badge) => {
    if (poolIndex >= sequencePool.length) {
      return { ...badge, sequence: null };
    }
    const sequence = sequencePool[poolIndex]!;
    poolIndex += 1;
    return { ...badge, sequence };
  });
}

export type BadgeSequenceChange = {
  badge: AdminBadge;
  fromSequence: number | null;
  toSequence: number | null;
};

/** Badges whose sequence must change to match the draft order. */
export function diffBadgeSequenceChanges(
  baseline: readonly AdminBadge[],
  draft: readonly AdminBadge[],
): BadgeSequenceChange[] {
  const baselineById = new Map(baseline.map((badge) => [badge.id, badge]));
  const assigned = assignSequencesByOrder(draft);
  const changes: BadgeSequenceChange[] = [];

  for (const badge of assigned) {
    const original = baselineById.get(badge.id);
    if (!original) continue;
    if (original.sequence === badge.sequence) continue;
    changes.push({
      badge: { ...original, sequence: badge.sequence },
      fromSequence: original.sequence,
      toSequence: badge.sequence,
    });
  }

  return changes;
}
