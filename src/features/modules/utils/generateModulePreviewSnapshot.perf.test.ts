import { describe, expect, it } from 'vitest';
import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/modules/types/adminModule.types';
import {
  androidLessonCardFixture,
  androidQuizFixture,
} from '@/features/modules/utils/fixtures/androidModuleFixtures';
import { generateModulePreviewSnapshot } from '@/features/modules/utils/generateModulePreviewSnapshot';

function buildLargeModule(cardCount: number, quizCount: number) {
  const cards: AdminModuleCard[] = Array.from(
    { length: cardCount },
    (_, index) => ({
      id: `card-${index}`,
      title: { bn: `Card ${index + 1}` },
      body: {
        bn: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: `Body ${index + 1}` }],
          },
        ],
      },
    }),
  );

  const quiz: AdminModuleQuizItem[] = Array.from(
    { length: quizCount },
    (_, index) => ({
      id: `q-${index}`,
      question_order: index + 1,
      question: { bn: `Question ${index + 1}` },
      case_setup: null,
      options: { bn: ['A', 'B', 'C', 'D'], en: ['A', 'B', 'C', 'D'] },
      correct_indices: [0],
      explanation: { bn: 'Explanation' },
      difficulty: 'medium',
    }),
  );

  return { cards, quiz };
}

describe('generateModulePreviewSnapshot performance', () => {
  it('generates large module snapshots within CI threshold', () => {
    const { cards, quiz } = buildLargeModule(200, 100);
    const started = performance.now();
    const snapshot = generateModulePreviewSnapshot({
      title: { bn: 'Large module' },
      cards,
      quiz,
    });
    const elapsed = performance.now() - started;

    expect(snapshot.cards).toHaveLength(200);
    expect(snapshot.quiz).toHaveLength(100);
    expect(elapsed).toBeLessThan(500);
  });

  it('maps Android contract fixtures with BN-primary titles and sorted quiz', () => {
    const snapshot = generateModulePreviewSnapshot({
      title: { bn: 'Android fixture module', en: 'English fallback' },
      cards: androidLessonCardFixture,
      quiz: androidQuizFixture,
    });

    expect(snapshot.cards.map((card) => card.title)).toEqual([
      'প্রথম কার্ড',
      'দ্বিতীয় কার্ড',
    ]);
    expect(snapshot.quiz.map((item) => item.question)).toEqual([
      'প্রথম প্রশ্ন',
      'দ্বিতীয় প্রশ্ন',
    ]);
  });
});
