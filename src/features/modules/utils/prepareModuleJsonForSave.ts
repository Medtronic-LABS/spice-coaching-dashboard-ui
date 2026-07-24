import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/modules/types/adminModule.types';
import {
  renumberQuestionOrders,
  serializeQuizItem,
  sortQuizItems,
} from '@/features/modules/utils/adminModuleQuizUtils';
import { serializeAdminModuleCard } from '@/features/modules/utils/cardBody';

export function prepareModuleJsonForSave(
  cards: AdminModuleCard[],
  quiz: AdminModuleQuizItem[],
): {
  cards: Record<string, unknown>[];
  quiz: Record<string, unknown>[];
} {
  return {
    cards: cards.map((card) => serializeAdminModuleCard(card)),
    quiz: renumberQuestionOrders(sortQuizItems(quiz)).map((item) =>
      serializeQuizItem(item),
    ),
  };
}
