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

/** Display helper for actor name columns (`—` when missing). */
export function formatHierarchyActorName(
  name: string | null | undefined,
): string {
  return name?.trim() || '—';
}
