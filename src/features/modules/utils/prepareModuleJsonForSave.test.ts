import { describe, expect, it } from 'vitest';
import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/modules/types/adminModule.types';
import { prepareModuleJsonForSave } from '@/features/modules/utils/prepareModuleJsonForSave';

const cards: AdminModuleCard[] = [
  { id: 'c2', title: { bn: 'Second' }, body: { bn: [] } },
  { id: 'c1', title: { bn: 'First' }, body: { bn: [] } },
  { id: 'c3', title: { bn: 'Third' }, body: { bn: [] } },
];

const quiz: AdminModuleQuizItem[] = [
  {
    id: 'q2',
    question_order: 5,
    question: { bn: 'B' },
    case_setup: null,
    options: { bn: ['a'] },
    correct_indices: [0],
    explanation: null,
    difficulty: 'medium',
  },
  {
    id: 'q1',
    question_order: 2,
    question: { bn: 'A' },
    case_setup: null,
    options: { bn: ['a'] },
    correct_indices: [0],
    explanation: null,
    difficulty: 'medium',
  },
];

describe('prepareModuleJsonForSave', () => {
  it('preserves card array order without injecting card_order', () => {
    const result = prepareModuleJsonForSave(cards, []);
    expect(result.cards.map((c) => (c.title as { bn: string }).bn)).toEqual([
      'Second',
      'First',
      'Third',
    ]);
    expect(result.cards.every((c) => c.card_order === undefined)).toBe(true);
  });

  it('sorts quiz and renumbers question_order to 1..n', () => {
    const result = prepareModuleJsonForSave([], quiz);
    expect(result.quiz.map((q) => (q.question as { bn: string }).bn)).toEqual([
      'A',
      'B',
    ]);
    expect(result.quiz.map((q) => q.question_order)).toEqual([1, 2]);
  });
});
