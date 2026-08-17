/** Hierarchy user reference returned on admin list/detail actor fields. */
export interface HierarchyActorRef {
  id: number;
  name: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeHierarchyActorRef(
  value: unknown,
): HierarchyActorRef | null {
  if (!isPlainObject(value)) return null;
  const id = value.id;
  const name = value.name;
  if (
    typeof id !== 'number' ||
    !Number.isFinite(id) ||
    typeof name !== 'string'
  ) {
    return null;
  }
  const trimmed = name.trim();
  if (!trimmed) return null;
  return { id, name: trimmed };
}

function actorDisplayName(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  const normalized = normalizeHierarchyActorRef(value);
  if (normalized) return normalized.name;
  if (!isPlainObject(value) || typeof value.name !== 'string') return undefined;

  const trimmed = value.name.trim();
  return trimmed || undefined;
}

/** Reads a displayable actor name from search-metadata string or object values. */
export function actorNameFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  if (!metadata) return undefined;
  return actorDisplayName(metadata[key]);
}

/** Display helper for actor name columns (`—` when missing). */
export function formatHierarchyActorName(
  name: string | null | undefined,
): string {
  return name?.trim() || '—';
}
