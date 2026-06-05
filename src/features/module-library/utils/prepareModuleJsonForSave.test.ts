import { describe, expect, it } from 'vitest';
import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import { prepareModuleJsonForSave } from '@/features/module-library/utils/prepareModuleJsonForSave';

const cards: AdminModuleCard[] = [
  { id: 'c2', title_bn: 'Second', body_bn: null },
  { id: 'c1', title_bn: 'First', body_bn: null },
  { id: 'c3', title_bn: 'Third', body_bn: null },
];

const quiz: AdminModuleQuizItem[] = [
  {
    id: 'q2',
    question_order: 5,
    question_bn: 'B',
    question_en: null,
    case_setup_bn: null,
    case_setup_en: null,
    options_bn: ['a'],
    options_en: ['a'],
    correct_indices: [0],
    explanation_bn: null,
    explanation_en: null,
    difficulty: 'medium',
  },
  {
    id: 'q1',
    question_order: 2,
    question_bn: 'A',
    question_en: null,
    case_setup_bn: null,
    case_setup_en: null,
    options_bn: ['a'],
    options_en: ['a'],
    correct_indices: [0],
    explanation_bn: null,
    explanation_en: null,
    difficulty: 'medium',
  },
];

describe('prepareModuleJsonForSave', () => {
  it('preserves card array order without injecting card_order', () => {
    const result = prepareModuleJsonForSave(cards, []);
    expect(result.cards.map((c) => c.title_bn)).toEqual([
      'Second',
      'First',
      'Third',
    ]);
    expect(result.cards.every((c) => c.card_order === undefined)).toBe(true);
  });

  it('sorts quiz and renumbers question_order to 1..n', () => {
    const result = prepareModuleJsonForSave([], quiz);
    expect(result.quiz.map((q) => q.question_bn)).toEqual(['A', 'B']);
    expect(result.quiz.map((q) => q.question_order)).toEqual([1, 2]);
  });
});
