import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';
import {
  parseLocalizedOptionsField,
  parseLocalizedStringField,
  serializeLocalizedOptions,
  serializeLocalizedString,
} from '@/features/module-library/utils/localizedWire';
import { DEPLOYMENT_PRIMARY_LOCALE } from '@/config/deploymentLocale';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeAdminModuleQuizItem(
  item: unknown,
  index = 0,
): AdminModuleQuizItem {
  if (!isPlainObject(item)) {
    return {
      id: `quiz-${index}`,
      question_order: index + 1,
      question: { [DEPLOYMENT_PRIMARY_LOCALE]: '' },
      case_setup: null,
      options: { [DEPLOYMENT_PRIMARY_LOCALE]: [''] },
      correct_indices: [0],
      explanation: null,
      difficulty: 'medium',
    };
  }

  const question = parseLocalizedStringField(
    item,
    'question',
    'question_bn',
    'question_en',
  );
  const caseSetupRaw = parseLocalizedStringField(
    item,
    'case_setup',
    'case_setup_bn',
    'case_setup_en',
  );
  const explanationRaw = parseLocalizedStringField(
    item,
    'explanation',
    'explanation_bn',
    'explanation_en',
  );

  return {
    id: typeof item.id === 'string' ? item.id : `quiz-${index}`,
    question_order:
      typeof item.question_order === 'number' ? item.question_order : index + 1,
    question,
    case_setup: Object.keys(caseSetupRaw).length ? caseSetupRaw : null,
    options: parseLocalizedOptionsField(
      item,
      'options',
      'options_bn',
      'options_en',
    ),
    correct_indices: Array.isArray(item.correct_indices)
      ? item.correct_indices.filter((n): n is number => typeof n === 'number')
      : [0],
    explanation: Object.keys(explanationRaw).length ? explanationRaw : null,
    difficulty:
      typeof item.difficulty === 'string' ? item.difficulty : 'medium',
  };
}

export function serializeQuizItem(
  item: AdminModuleQuizItem,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: item.id,
    question_order: item.question_order,
    question: serializeLocalizedString(item.question),
    options: serializeLocalizedOptions(item.options),
    correct_indices: item.correct_indices,
    difficulty: item.difficulty,
  };
  if (item.case_setup) {
    payload.case_setup = serializeLocalizedString(item.case_setup);
  }
  if (item.explanation) {
    payload.explanation = serializeLocalizedString(item.explanation);
  }
  return payload;
}

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
      question: { [DEPLOYMENT_PRIMARY_LOCALE]: '' },
      case_setup: null,
      options: { [DEPLOYMENT_PRIMARY_LOCALE]: [''] },
      correct_indices: [0],
      explanation: null,
      difficulty: 'medium',
    },
  ];
}

export function clearAllQuizItems(): AdminModuleQuizItem[] {
  return [];
}
