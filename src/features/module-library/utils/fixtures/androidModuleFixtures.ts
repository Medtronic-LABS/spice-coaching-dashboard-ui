import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';

/** Minimal card fixture aligned with Android LessonCardsJsonParserTest ordering. */
export const androidLessonCardFixture: AdminModuleCard[] = [
  {
    id: 'card-1',
    card_order: 1,
    title: { bn: 'প্রথম কার্ড', en: 'First card' },
    body: {
      bn: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'BN body paragraph' }],
        },
      ],
    },
  },
  {
    id: 'card-2',
    card_order: 2,
    title: { bn: 'দ্বিতীয় কার্ড', en: 'Second card' },
    body: {
      bn: [
        {
          type: 'heading',
          level: 2,
          content: [{ type: 'text', text: 'Heading' }],
        },
      ],
    },
  },
];

/** Minimal quiz fixture aligned with Android QuizJsonParserTest question_order sorting. */
export const androidQuizFixture: AdminModuleQuizItem[] = [
  {
    id: 'quiz-2',
    question_order: 2,
    question: { bn: 'দ্বিতীয় প্রশ্ন' },
    case_setup: { bn: 'রোগীর অবস্থা' },
    options: { bn: ['উত্তর A', 'উত্তর B'], en: ['A', 'B'] },
    correct_indices: [1],
    explanation: { bn: 'ব্যাখ্যা' },
    difficulty: 'medium',
  },
  {
    id: 'quiz-1',
    question_order: 1,
    question: { bn: 'প্রথম প্রশ্ন' },
    case_setup: null,
    options: { bn: ['উত্তর 1', 'উত্তর 2'], en: ['1', '2'] },
    correct_indices: [0],
    explanation: null,
    difficulty: 'easy',
  },
];
