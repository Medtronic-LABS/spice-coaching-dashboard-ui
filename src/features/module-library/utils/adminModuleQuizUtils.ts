import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';

export function sortQuizItems(
  quiz: AdminModuleQuizItem[],
): AdminModuleQuizItem[] {
  return [...quiz].sort((a, b) => {
    const orderDiff = a.question_order - b.question_order;
    if (orderDiff !== 0) return orderDiff;
    return a.id.localeCompare(b.id);
  });
}

export function clampCorrectIndex(
  optionsLength: number,
  indices: number[] | null | undefined,
): number {
  if (optionsLength <= 0) return 0;
  const first = (indices ?? []).find((n) => Number.isFinite(n) && n >= 0);
  const safe = typeof first === 'number' ? first : 0;
  return Math.min(Math.max(0, safe), optionsLength - 1);
}

export function updateQuizItem(
  quiz: AdminModuleQuizItem[],
  id: string,
  patch: Partial<AdminModuleQuizItem>,
): AdminModuleQuizItem[] {
  return quiz.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function reorderSortedItems<T>(
  items: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return [...items];
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function renumberQuestionOrders(
  quiz: AdminModuleQuizItem[],
): AdminModuleQuizItem[] {
  return quiz.map((item, index) => ({
    ...item,
    question_order: index + 1,
  }));
}

export function reorderQuizItems(
  quiz: AdminModuleQuizItem[],
  fromIndex: number,
  toIndex: number,
): AdminModuleQuizItem[] {
  const sorted = sortQuizItems(quiz);
  return renumberQuestionOrders(reorderSortedItems(sorted, fromIndex, toIndex));
}

export function moveQuizUp(
  quiz: AdminModuleQuizItem[],
  index: number,
): AdminModuleQuizItem[] {
  if (index <= 0 || index >= quiz.length) {
    return quiz;
  }
  return reorderQuizItems(quiz, index, index - 1);
}

export function moveQuizDown(
  quiz: AdminModuleQuizItem[],
  index: number,
): AdminModuleQuizItem[] {
  if (index < 0 || index >= quiz.length - 1) {
    return quiz;
  }
  return reorderQuizItems(quiz, index, index + 1);
}

export function removeQuizItem(
  quiz: AdminModuleQuizItem[],
  id: string,
): AdminModuleQuizItem[] {
  return renumberQuestionOrders(
    sortQuizItems(quiz).filter((item) => item.id !== id),
  );
}

export function addQuizItem(
  quiz: AdminModuleQuizItem[],
): AdminModuleQuizItem[] {
  const nextOrder = Math.max(0, ...quiz.map((q) => q.question_order ?? 0)) + 1;
  return [
    ...quiz,
    {
      id: `temp-${crypto.randomUUID()}`,
      question_order: nextOrder,
      question_bn: null,
      question_en: '',
      case_setup_bn: null,
      case_setup_en: null,
      options_bn: [''],
      options_en: ['Option 1', 'Option 2'],
      correct_indices: [0],
      explanation_bn: null,
      explanation_en: '',
      difficulty: 'medium',
    },
  ];
}

export function clearAllQuizItems(): AdminModuleQuizItem[] {
  return [];
}
