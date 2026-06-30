import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import {
  renumberQuestionOrders,
  sortQuizItems,
} from '@/features/module-library/utils/adminModuleQuizUtils';

export function prepareModuleJsonForSave(
  cards: AdminModuleCard[],
  quiz: AdminModuleQuizItem[],
): { cards: AdminModuleCard[]; quiz: AdminModuleQuizItem[] } {
  return {
    cards: [...cards],
    quiz: renumberQuestionOrders(sortQuizItems(quiz)),
  };
}
