import { describe, expect, it } from 'vitest';
import { DEPLOYMENT_PRIMARY_LOCALE } from '@/config/deploymentLocale';
import {
  DEFAULT_EMPTY_REVIEW_CARD_ID,
  DEFAULT_EMPTY_REVIEW_QUIZ_ID,
  ensureDefaultAdminModuleReviewContent,
} from '@/features/modules/utils/ensureDefaultAdminModuleReviewContent';
import {
  baseAdminModuleDetail,
  emptyCard,
} from '@/features/modules/utils/fixtures/adminModuleTestFixtures';

describe('ensureDefaultAdminModuleReviewContent', () => {
  it('adds one blank card and one blank question when a draft has none', () => {
    const result = ensureDefaultAdminModuleReviewContent(
      baseAdminModuleDetail({ lifecycle_status: 'draft' }),
    );

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]?.id).toBe(DEFAULT_EMPTY_REVIEW_CARD_ID);
    expect(result.cards[0]?.title).toEqual({});
    expect(result.quiz).toHaveLength(1);
    expect(result.quiz[0]?.id).toBe(DEFAULT_EMPTY_REVIEW_QUIZ_ID);
    expect(result.quiz[0]?.question[DEPLOYMENT_PRIMARY_LOCALE]).toBe('');
    expect(result.quiz[0]?.options[DEPLOYMENT_PRIMARY_LOCALE]).toEqual([
      '',
      '',
      '',
      '',
    ]);
    expect(result.module_json.cards).toHaveLength(1);
    expect(result.module_json.quiz).toHaveLength(1);
  });

  it('does not replace existing cards or questions', () => {
    const card = emptyCard('c1', 'Existing');
    const source = baseAdminModuleDetail({
      lifecycle_status: 'draft',
      cards: [card],
      quiz: [
        {
          id: 'q1',
          question_order: 1,
          question: { bn: 'Existing question' },
          case_setup: null,
          options: { bn: ['a', 'b'] },
          correct_indices: [0],
          explanation: null,
          difficulty: 'medium',
        },
      ],
    });

    expect(ensureDefaultAdminModuleReviewContent(source)).toBe(source);
  });

  it('does not add a blank question when the draft already has cards', () => {
    const card = emptyCard('c1', 'Existing');
    const source = baseAdminModuleDetail({
      lifecycle_status: 'draft',
      cards: [card],
      quiz: [],
    });

    expect(ensureDefaultAdminModuleReviewContent(source)).toBe(source);
  });

  it('leaves published modules empty', () => {
    const source = baseAdminModuleDetail({ lifecycle_status: 'published' });
    expect(ensureDefaultAdminModuleReviewContent(source)).toBe(source);
  });
});
