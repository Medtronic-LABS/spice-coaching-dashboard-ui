import { describe, expect, it } from 'vitest';
import type { AdminModuleCard } from '@/features/modules/types/adminModule.types';
import {
  adjustSelectedIndexAfterReorder,
  cardSortableId,
  moveCardDown,
  moveCardUp,
  reorderCards,
} from '@/features/modules/utils/adminModuleCardUtils';

describe('adminModuleCardUtils', () => {
  const cards = ['C1', 'C2', 'C3'];

  it('reorderCards moves middle item', () => {
    expect(reorderCards(cards, 1, 0)).toEqual(['C2', 'C1', 'C3']);
  });

  it('reorderCards moves first item to last', () => {
    expect(reorderCards(cards, 0, 2)).toEqual(['C2', 'C3', 'C1']);
  });

  it('reorderCards no-ops on invalid indices', () => {
    expect(reorderCards(cards, -1, 1)).toEqual(['C1', 'C2', 'C3']);
    expect(reorderCards(cards, 0, 5)).toEqual(['C1', 'C2', 'C3']);
    expect(reorderCards(cards, 1, 1)).toEqual(['C1', 'C2', 'C3']);
  });

  it('moveCardUp no-ops at first index', () => {
    const input = [...cards];
    expect(moveCardUp(input, 0)).toBe(input);
  });

  it('moveCardUp moves item up', () => {
    expect(moveCardUp(cards, 2)).toEqual(['C1', 'C3', 'C2']);
  });

  it('moveCardDown no-ops at last index', () => {
    const input = [...cards];
    expect(moveCardDown(input, 2)).toBe(input);
  });

  it('moveCardDown moves item down', () => {
    expect(moveCardDown(cards, 0)).toEqual(['C2', 'C1', 'C3']);
  });

  it('adjustSelectedIndexAfterReorder follows moved selection', () => {
    expect(adjustSelectedIndexAfterReorder(1, 1, 3)).toBe(3);
    expect(adjustSelectedIndexAfterReorder(1, 0, 2)).toBe(0);
    expect(adjustSelectedIndexAfterReorder(1, 2, 0)).toBe(2);
  });

  it('cardSortableId stays stable across reorder when ids are unique', () => {
    const cards: AdminModuleCard[] = [
      { id: 'c1', title: { bn: 'A' }, body: { bn: [] } },
      { id: 'c2', title: { bn: 'B' }, body: { bn: [] } },
    ];
    expect(cardSortableId(cards, cards[0], 0)).toBe('c1');
    const reordered = reorderCards(cards, 0, 1);
    expect(cardSortableId(reordered, reordered[1], 1)).toBe('c1');
  });

  it('cardSortableId suffixes index when base id repeats', () => {
    const cards: AdminModuleCard[] = [
      { id: 'dup', title: { bn: 'A' }, body: { bn: [] } },
      { id: 'dup', title: { bn: 'B' }, body: { bn: [] } },
    ];
    expect(cardSortableId(cards, cards[0], 0)).toBe('dup-0');
    expect(cardSortableId(cards, cards[1], 1)).toBe('dup-1');
  });
});
