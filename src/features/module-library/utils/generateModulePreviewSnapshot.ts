import type {
  AdminModuleDetailResponse,
  AdminModuleQuizItem,
} from '@/features/module-library/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import type {
  ModulePreviewSnapshot,
  PreviewCard,
  PreviewQuizItem,
} from '@/features/module-library/types/modulePreview.types';
import {
  DEPLOYMENT_PRIMARY_LOCALE,
  resolveDisplayText,
} from '@/config/deploymentLocale';
import {
  clampCorrectIndex,
  sortQuizItems,
} from '@/features/module-library/utils/adminModuleQuizUtils';
import { normalizeAdminModuleCard } from '@/features/module-library/utils/cardBody';
import {
  readLocaleOptions,
  readLocaleRichBody,
  readLocaleText,
} from '@/types/localized';

function resolveCardTitle(card: AdminModuleCard): string {
  return readLocaleText(card.title, DEPLOYMENT_PRIMARY_LOCALE, 'en');
}

function mapPreviewCard(card: unknown, index: number): PreviewCard {
  const normalized = normalizeAdminModuleCard(card, index);
  return {
    index,
    title: resolveCardTitle(normalized),
    body: structuredClone(
      readLocaleRichBody(normalized.body, DEPLOYMENT_PRIMARY_LOCALE, 'en') ??
        [],
    ),
  };
}

function mapPreviewQuizItem(
  item: AdminModuleQuizItem,
  index: number,
): PreviewQuizItem {
  const rawOptions = readLocaleOptions(
    item.options,
    DEPLOYMENT_PRIMARY_LOCALE,
    'en',
  );
  const options: string[] = [];
  const originalToFiltered = new Map<number, number>();

  rawOptions.forEach((option, originalIndex) => {
    if (typeof option === 'string' && option.trim().length > 0) {
      originalToFiltered.set(originalIndex, options.length);
      options.push(option);
    }
  });

  const firstCorrectOriginal = (item.correct_indices ?? []).find(
    (value) => Number.isFinite(value) && value >= 0,
  );
  const correctIndex =
    typeof firstCorrectOriginal === 'number' &&
    originalToFiltered.has(firstCorrectOriginal)
      ? originalToFiltered.get(firstCorrectOriginal)!
      : clampCorrectIndex(options.length, item.correct_indices);

  return {
    index,
    id: item.id,
    question: readLocaleText(item.question, DEPLOYMENT_PRIMARY_LOCALE, 'en'),
    caseSetup: readLocaleText(item.case_setup, DEPLOYMENT_PRIMARY_LOCALE, 'en'),
    options,
    correctIndex,
    explanation: readLocaleText(
      item.explanation,
      DEPLOYMENT_PRIMARY_LOCALE,
      'en',
    ),
  };
}

export function generateModulePreviewSnapshot(
  module: Pick<AdminModuleDetailResponse, 'title' | 'cards' | 'quiz'>,
): ModulePreviewSnapshot {
  const cards = (module.cards ?? []).map(mapPreviewCard);
  const quiz = sortQuizItems(module.quiz ?? []).map(mapPreviewQuizItem);

  return {
    moduleTitle: resolveDisplayText(module.title),
    cards,
    quiz,
    syncedAt: Date.now(),
  };
}
