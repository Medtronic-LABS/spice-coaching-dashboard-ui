import { describe, expect, it } from 'vitest';
import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import {
  addQuizItem,
  createEmptyAdminModuleQuizItem,
  duplicateQuizItem,
  moveQuizDown,
  moveQuizUp,
  removeQuizItem,
  reorderQuizItems,
  renumberQuestionOrders,
  sortQuizItems,
} from '@/features/modules/utils/adminModuleQuizUtils';
import { DEPLOYMENT_PRIMARY_LOCALE } from '@/config/deploymentLocale';
import { readLocaleText } from '@/types/localized';

function quizItem(
  id: string,
  question_order: number,
  questionBn = id,
): AdminModuleQuizItem {
  return {
    id,
    question_order,
    question: { bn: questionBn },
    case_setup: null,
    options: { bn: ['a', 'b'], en: ['a', 'b'] },
    correct_indices: [0],
    explanation: null,
    difficulty: 'medium',
  };
}

function questionText(item: AdminModuleQuizItem): string {
  return readLocaleText(item.question, 'bn');
}

describe('adminModuleQuizUtils reorder helpers', () => {
  const quiz = [
    quizItem('q1', 1, 'A'),
    quizItem('q2', 2, 'B'),
    quizItem('q3', 3, 'C'),
  ];

  it('reorderQuizItems renumbers question_order to 1..n', () => {
    const result = reorderQuizItems(quiz, 2, 0);
    expect(result.map(questionText)).toEqual(['C', 'A', 'B']);
    expect(result.map((q) => q.question_order)).toEqual([1, 2, 3]);
  });

  it('moveQuizUp and moveQuizDown reorder within bounds', () => {
    expect(moveQuizUp(quiz, 1).map(questionText)).toEqual(['B', 'A', 'C']);
    expect(moveQuizDown(quiz, 0).map(questionText)).toEqual(['B', 'A', 'C']);
  });

  it('removeQuizItem leaves contiguous question_order values', () => {
    const result = removeQuizItem(quiz, 'q2');
    expect(result.map((q) => q.id)).toEqual(['q1', 'q3']);
    expect(result.map((q) => q.question_order)).toEqual([1, 2]);
  });

  it('sortQuizItems breaks ties on question_order by id', () => {
    const tied = [quizItem('q-b', 1, 'B'), quizItem('q-a', 1, 'A')];
    expect(sortQuizItems(tied).map((q) => q.id)).toEqual(['q-a', 'q-b']);
  });

  it('renumberQuestionOrders assigns contiguous orders in array order', () => {
    const shuffled = [quizItem('q3', 3), quizItem('q1', 1), quizItem('q2', 2)];
    const result = renumberQuestionOrders(shuffled);
    expect(result.map((q) => q.id)).toEqual(['q3', 'q1', 'q2']);
    expect(result.map((q) => q.question_order)).toEqual([1, 2, 3]);
  });
});

describe('adminModuleQuizUtils create helpers', () => {
  it('createEmptyAdminModuleQuizItem returns a blank question with four options', () => {
    const item = createEmptyAdminModuleQuizItem(1, 'quiz-empty');
    expect(item.id).toBe('quiz-empty');
    expect(item.question_order).toBe(1);
    expect(item.question[DEPLOYMENT_PRIMARY_LOCALE]).toBe('');
    expect(item.options[DEPLOYMENT_PRIMARY_LOCALE]).toEqual(['', '', '', '']);
    expect(item.correct_indices).toEqual([0]);
  });

  it('addQuizItem appends a question with four empty options', () => {
    const result = addQuizItem([]);
    expect(result).toHaveLength(1);
    expect(result[0]?.options[DEPLOYMENT_PRIMARY_LOCALE]).toEqual([
      '',
      '',
      '',
      '',
    ]);
    expect(result[0]?.correct_indices).toEqual([0]);
  });

  it('duplicateQuizItem inserts a deep copy after the source', () => {
    const source = quizItem('q1', 1, 'Blood pressure');
    source.options = { bn: ['a', 'b', 'c', 'd'] };
    source.correct_indices = [2];
    source.explanation = { bn: 'Because …' };

    const result = duplicateQuizItem(
      [source, quizItem('q2', 2, 'Other')],
      'q1',
    );
    expect(result).toHaveLength(3);
    expect(result.map((q) => q.id)).toEqual([
      'q1',
      expect.stringMatching(/^temp-/),
      'q2',
    ]);
    expect(result.map((q) => q.question_order)).toEqual([1, 2, 3]);
    expect(questionText(result[1]!)).toBe('Blood pressure');
    expect(result[1]?.options.bn).toEqual(['a', 'b', 'c', 'd']);
    expect(result[1]?.options.bn).not.toBe(source.options.bn);
    expect(result[1]?.correct_indices).toEqual([2]);
    expect(result[1]?.explanation).toEqual({ bn: 'Because …' });
    expect(result[1]?.id).not.toBe('q1');
  });
});
