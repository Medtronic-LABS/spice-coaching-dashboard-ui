import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import {
  renumberQuestionOrders,
  serializeQuizItem,
  sortQuizItems,
} from '@/features/module-library/utils/adminModuleQuizUtils';
import { serializeAdminModuleCard } from '@/features/module-library/utils/cardBody';

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
