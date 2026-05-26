import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';
import type {
  ModuleReviewPublishLessonRow,
  ModuleReviewPublishQuizRow,
} from '@/features/module-library/components/ModuleReviewPublishView';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function adminCardTitle(card: unknown, index: number): string {
  if (!isPlainObject(card)) return `Lesson ${index + 1}`;
  const title =
    (typeof card.title_en === 'string' && card.title_en) ||
    (typeof card.title_bn === 'string' && card.title_bn) ||
    (typeof card.title === 'string' && card.title) ||
    '';
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
  return quiz.map((item) => ({
    id: item.id,
    question: item.question_en ?? item.question_bn ?? '',
    answerSet:
      (item.correct_indices?.length ?? 0) > 0 &&
      Boolean(item.question_en ?? item.question_bn),
  }));
}

export function countMediaTagsFromCards(cards: unknown[]): number {
  return cards.reduce((sum, card) => sum + adminCardMediaTags(card).length, 0);
}
