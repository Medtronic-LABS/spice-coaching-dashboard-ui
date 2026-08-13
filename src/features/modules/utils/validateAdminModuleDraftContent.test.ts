import { describe, expect, it } from 'vitest';
import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/modules/types/adminModule.types';
import {
  AdminModuleDraftValidationError,
  validateAdminModuleDraftContent,
} from '@/features/modules/utils/validateAdminModuleDraftContent';

const filledCard: AdminModuleCard = {
  id: 'c1',
  title: { bn: 'Card title' },
  body: {
    bn: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Card body' }],
      },
    ],
  },
};

const filledQuiz: AdminModuleQuizItem = {
  id: 'q1',
  question_order: 1,
  question: { bn: 'What should you do?' },
  case_setup: null,
  options: { bn: ['A', 'B', 'C', 'D'] },
  correct_indices: [1],
  explanation: { bn: 'Because B is correct.' },
  difficulty: 'moderate',
};

describe('validateAdminModuleDraftContent', () => {
  it('allows empty cards and quiz lists', () => {
    expect(() =>
      validateAdminModuleDraftContent({ cards: [], quiz: [] }),
    ).not.toThrow();
  });

  it('allows complete cards and quiz questions', () => {
    expect(() =>
      validateAdminModuleDraftContent({
        cards: [filledCard],
        quiz: [filledQuiz],
      }),
    ).not.toThrow();
  });

  it('rejects blank card title and body with structured issues', () => {
    try {
      validateAdminModuleDraftContent({
        cards: [{ id: 'c1', title: { bn: '  ' }, body: { bn: [] } }],
        quiz: [],
      });
      expect.unreachable('expected validation to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(AdminModuleDraftValidationError);
      if (!(error instanceof AdminModuleDraftValidationError)) return;
      expect(error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: 'card',
            itemId: 'c1',
            field: 'title',
          }),
          expect.objectContaining({
            kind: 'card',
            itemId: 'c1',
            field: 'body',
          }),
        ]),
      );
      expect(error.message).toMatch(/Card 1.*title/i);
    }
  });

  it('rejects blank quiz question, options, and explanation with structured issues', () => {
    try {
      validateAdminModuleDraftContent({
        cards: [],
        quiz: [
          {
            id: 'temp-1',
            question_order: 1,
            question: { bn: '' },
            case_setup: null,
            options: { bn: ['', '', '', ''] },
            correct_indices: [0],
            explanation: null,
            difficulty: 'medium',
          },
        ],
      });
      expect.unreachable('expected validation to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(AdminModuleDraftValidationError);
      if (!(error instanceof AdminModuleDraftValidationError)) return;
      expect(error.issues.map((issue) => issue.field)).toEqual(
        expect.arrayContaining(['question', 'options', 'explanation']),
      );
      expect(error.message).toMatch(/Quiz question 1 needs a question/);
    }

    expect(() =>
      validateAdminModuleDraftContent({
        cards: [],
        quiz: [
          {
            ...filledQuiz,
            options: { bn: ['A', '', 'C', 'D'] },
          },
        ],
      }),
    ).toThrow(/blank option.*2/i);

    expect(() =>
      validateAdminModuleDraftContent({
        cards: [],
        quiz: [
          {
            ...filledQuiz,
            explanation: { bn: '   ' },
          },
        ],
      }),
    ).toThrow(/needs an explanation/i);
  });
});
