import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';

export function reorderCards<T>(
  cards: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= cards.length ||
    toIndex >= cards.length ||
    fromIndex === toIndex
  ) {
    return [...cards];
  }
  const next = [...cards];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function moveCardUp<T>(cards: T[], index: number): T[] {
  if (index <= 0 || index >= cards.length) {
    return cards;
  }
  return reorderCards(cards, index, index - 1);
}

export function moveCardDown<T>(cards: T[], index: number): T[] {
  if (index < 0 || index >= cards.length - 1) {
    return cards;
  }
  return reorderCards(cards, index, index + 1);
}

/** Stable id for dnd-kit / React keys; suffixes index only when base id repeats. */
export function cardSortableId(
  cards: AdminModuleCard[],
  card: AdminModuleCard,
  index: number,
): string {
  const base = card.card_family_id ?? card.id;
  const duplicates = cards.filter(
    (c) => (c.card_family_id ?? c.id) === base,
  ).length;
  return duplicates > 1 ? `${base}-${index}` : base;
}

export function adjustSelectedIndexAfterReorder(
  selectedIndex: number,
  fromIndex: number,
  toIndex: number,
): number {
  if (selectedIndex === fromIndex) {
    return toIndex;
  }
  if (fromIndex < selectedIndex && toIndex >= selectedIndex) {
    return selectedIndex - 1;
  }
  if (fromIndex > selectedIndex && toIndex <= selectedIndex) {
    return selectedIndex + 1;
  }
  return selectedIndex;
}
