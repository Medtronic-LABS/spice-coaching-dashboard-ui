import type { AdminModuleDetailResponse } from '@/features/modules/api/adminModulesApi';
import { createEmptyAdminModuleCard } from '@/features/modules/utils/adminModuleCardUtils';
import { createEmptyAdminModuleQuizItem } from '@/features/modules/utils/adminModuleQuizUtils';

export const DEFAULT_EMPTY_REVIEW_CARD_ID = 'default-empty-card';
export const DEFAULT_EMPTY_REVIEW_QUIZ_ID = 'default-empty-quiz';

/**
 * Drafts with no cards and no quiz questions get one blank card and one blank
 * question so review editors are ready to fill in.
 */
export function ensureDefaultAdminModuleReviewContent(
  data: AdminModuleDetailResponse,
): AdminModuleDetailResponse {
  if (data.lifecycle_status !== 'draft') {
    return data;
  }

  if (data.cards.length > 0 || data.quiz.length > 0) {
    return data;
  }

  const cards = [createEmptyAdminModuleCard(DEFAULT_EMPTY_REVIEW_CARD_ID)];
  const quiz = [
    createEmptyAdminModuleQuizItem(1, DEFAULT_EMPTY_REVIEW_QUIZ_ID),
  ];

  return {
    ...data,
    cards,
    quiz,
    card_count: cards.length,
    module_json: { ...data.module_json, cards, quiz },
  };
}
