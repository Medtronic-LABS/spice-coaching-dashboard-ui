import { describe, expect, it } from 'vitest';
import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';
import {
  adminCardMediaTags,
  adminCardTitle,
  countMediaTagsFromCards,
  mapAdminCardsToLessonRows,
  mapAdminQuizToRows,
} from '@/features/module-library/utils/moduleReviewPublishMappers';

describe('moduleReviewPublishMappers', () => {
  it('derives card title from bn, en, or fallback label', () => {
    expect(adminCardTitle({ title: { bn: 'BN title' } }, 0)).toBe('BN title');
    expect(adminCardTitle({ title: { en: 'EN title' } }, 1)).toBe('EN title');
    expect(adminCardTitle({}, 2)).toBe('Lesson 3');
  });

  it('collects media tags from card fields', () => {
    expect(
      adminCardMediaTags({
        has_audio: true,
        has_image: true,
        has_video: false,
      }),
    ).toEqual(['Audio', 'Image']);
    expect(
      countMediaTagsFromCards([{ has_video: true }, { has_audio: true }]),
    ).toBe(2);
  });

  it('maps cards and quiz rows for publish summary', () => {
    const cards = [{ title: { bn: 'Lesson 1' }, has_image: true }];
    const quiz: AdminModuleQuizItem[] = [
      {
        id: 'q1',
        question_order: 1,
        question: { bn: 'Question?' },
        case_setup: null,
        options: { bn: ['a'] },
        correct_indices: [0],
        explanation: null,
        difficulty: 'medium',
      },
    ];

    expect(mapAdminCardsToLessonRows(cards)).toEqual([
      {
        id: 'card-0',
        title: 'Lesson 1',
        mediaTags: ['Image'],
      },
    ]);
    expect(mapAdminQuizToRows(quiz)).toEqual([
      {
        id: 'q1',
        question: 'Question?',
        answerSet: true,
      },
    ]);
  });
});
