import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import type {
  ModuleReviewPublishLessonRow,
  ModuleReviewPublishQuizRow,
} from '@/features/modules/components/ModuleReviewPublishView';
import { DEPLOYMENT_PRIMARY_LOCALE } from '@/config/deploymentLocale';
import { sortQuizItems } from '@/features/modules/utils/adminModuleQuizUtils';
import { normalizeAdminModuleCard } from '@/features/modules/utils/cardBody';
import { readLocaleText } from '@/types/localized';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function adminCardTitle(card: unknown, index: number): string {
  const normalized = normalizeAdminModuleCard(card, index);
  const title = readLocaleText(
    normalized.title,
    DEPLOYMENT_PRIMARY_LOCALE,
    'en',
  );
  return title || `Lesson ${index + 1}`;
}

export function adminCardMediaTags(card: unknown): string[] {
  if (!isPlainObject(card)) return [];
  const tags: string[] = [];
  if (card.has_audio || card.audio_url) tags.push('Audio');
  if (card.has_image || card.image_url) tags.push('Image');
  if (card.has_video || card.video_url) tags.push('Video');
  return tags;
}

export function mapAdminCardsToLessonRows(
  cards: unknown[],
): ModuleReviewPublishLessonRow[] {
  return cards.map((card, index) => ({
    id: `card-${index}`,
    title: adminCardTitle(card, index),
    mediaTags: adminCardMediaTags(card),
  }));
}

export function mapAdminQuizToRows(
  quiz: AdminModuleQuizItem[],
): ModuleReviewPublishQuizRow[] {
  return sortQuizItems(quiz).map((item) => ({
    id: item.id,
    question: readLocaleText(item.question, DEPLOYMENT_PRIMARY_LOCALE, 'en'),
    answerSet:
      (item.correct_indices?.length ?? 0) > 0 &&
      Boolean(readLocaleText(item.question, DEPLOYMENT_PRIMARY_LOCALE, 'en')),
  }));
}

export function countMediaTagsFromCards(cards: unknown[]): number {
  return cards.reduce((sum, card) => sum + adminCardMediaTags(card).length, 0);
}
