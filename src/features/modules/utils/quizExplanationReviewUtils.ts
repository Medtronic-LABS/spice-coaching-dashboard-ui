import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import { DEPLOYMENT_PRIMARY_LOCALE } from '@/config/deploymentLocale';
import { sortQuizItems } from '@/features/modules/utils/adminModuleQuizUtils';
import { readLocaleOptions, readLocaleText } from '@/types/localized';

export interface QuizContentBaseline {
  question_bn: string;
  options_bn: string[];
  correct_indices: number[];
}

export function quizContentSnapshot(
  item: AdminModuleQuizItem,
): QuizContentBaseline {
  return {
    question_bn: readLocaleText(item.question, DEPLOYMENT_PRIMARY_LOCALE, 'en'),
    options_bn: [
      ...readLocaleOptions(item.options, DEPLOYMENT_PRIMARY_LOCALE, 'en'),
    ],
    correct_indices: [...item.correct_indices].filter((n) =>
      Number.isFinite(n),
    ),
  };
}

export function quizContentMatches(
  a: QuizContentBaseline,
  b: QuizContentBaseline,
): boolean {
  return (
    a.question_bn === b.question_bn &&
    JSON.stringify(a.options_bn) === JSON.stringify(b.options_bn) &&
    JSON.stringify(a.correct_indices) === JSON.stringify(b.correct_indices)
  );
}

export function buildBaselinesFromQuiz(
  quiz: AdminModuleQuizItem[],
): Record<string, QuizContentBaseline> {
  const result: Record<string, QuizContentBaseline> = {};
  for (const item of quiz) {
    result[item.id] = quizContentSnapshot(item);
  }
  return result;
}

export function ensureQuizContentBaselines(
  workingQuiz: AdminModuleQuizItem[],
  savedQuiz: AdminModuleQuizItem[],
  baselines: Record<string, QuizContentBaseline>,
): Record<string, QuizContentBaseline> {
  const nextBaselines = { ...baselines };
  const savedById = new Map(savedQuiz.map((item) => [item.id, item]));

  for (const item of workingQuiz) {
    if (item.id in nextBaselines) {
      continue;
    }
    const savedItem = savedById.get(item.id);
    nextBaselines[item.id] = quizContentSnapshot(savedItem ?? item);
  }

  return nextBaselines;
}

export function syncPendingExplanationReviews(
  quiz: AdminModuleQuizItem[],
  baselines: Record<string, QuizContentBaseline>,
  pendingIds: string[],
  acknowledgedIds: string[],
): { pendingIds: string[]; acknowledgedIds: string[] } {
  const pendingSet = new Set(pendingIds);
  const acknowledgedSet = new Set(acknowledgedIds);
  const quizIds = new Set(quiz.map((item) => item.id));

  for (const id of pendingIds) {
    if (!quizIds.has(id)) {
      pendingSet.delete(id);
    }
  }
  for (const id of acknowledgedIds) {
    if (!quizIds.has(id)) {
      acknowledgedSet.delete(id);
    }
  }

  for (const item of quiz) {
    const baseline = baselines[item.id];
    if (!baseline) {
      continue;
    }
    const current = quizContentSnapshot(item);
    if (quizContentMatches(current, baseline)) {
      pendingSet.delete(item.id);
      acknowledgedSet.delete(item.id);
    } else if (acknowledgedSet.has(item.id)) {
      pendingSet.delete(item.id);
    } else {
      pendingSet.add(item.id);
    }
  }

  // Top-to-bottom display order (question_order), not edit/insertion order.
  const pendingIdsInDisplayOrder = sortQuizItems(quiz)
    .map((item) => item.id)
    .filter((id) => pendingSet.has(id));

  return {
    pendingIds: pendingIdsInDisplayOrder,
    acknowledgedIds: [...acknowledgedSet],
  };
}

export function resolveExplanationReviewsOnSave(quiz: AdminModuleQuizItem[]): {
  baselines: Record<string, QuizContentBaseline>;
  pendingIds: string[];
  acknowledgedIds: string[];
} {
  return {
    baselines: buildBaselinesFromQuiz(quiz),
    pendingIds: [],
    acknowledgedIds: [],
  };
}
