import type {
  ModulePreviewPosition,
  ModulePreviewSnapshot,
} from '@/features/module-library/types/modulePreview.types';

export function getTotalSteps(snapshot: ModulePreviewSnapshot): number {
  return snapshot.cards.length + snapshot.quiz.length;
}

export function getStepLabel(
  position: ModulePreviewPosition,
  snapshot: ModulePreviewSnapshot,
): string {
  if (position.phase === 'card') {
    return `Learning ${position.index + 1} of ${snapshot.cards.length}`;
  }
  return `Question ${position.index + 1} of ${snapshot.quiz.length}`;
}

export function canGoPrevious(
  position: ModulePreviewPosition,
  snapshot: ModulePreviewSnapshot,
): boolean {
  if (position.phase === 'card') {
    return position.index > 0;
  }
  if (position.index > 0) return true;
  return snapshot.cards.length > 0;
}

export function canGoNext(
  position: ModulePreviewPosition,
  snapshot: ModulePreviewSnapshot,
): boolean {
  if (position.phase === 'card') {
    if (position.index < snapshot.cards.length - 1) return true;
    return snapshot.quiz.length > 0;
  }
  return position.index < snapshot.quiz.length - 1;
}

export function goPrevious(
  position: ModulePreviewPosition,
  snapshot: ModulePreviewSnapshot,
): ModulePreviewPosition {
  if (position.phase === 'card') {
    if (position.index > 0) {
      return { phase: 'card', index: position.index - 1 };
    }
    return position;
  }

  if (position.index > 0) {
    return { phase: 'quiz', index: position.index - 1 };
  }

  if (snapshot.cards.length > 0) {
    return { phase: 'card', index: snapshot.cards.length - 1 };
  }

  return position;
}

export function goNext(
  position: ModulePreviewPosition,
  snapshot: ModulePreviewSnapshot,
): ModulePreviewPosition {
  if (position.phase === 'card') {
    if (position.index < snapshot.cards.length - 1) {
      return { phase: 'card', index: position.index + 1 };
    }
    if (snapshot.quiz.length > 0) {
      return { phase: 'quiz', index: 0 };
    }
    return position;
  }

  if (position.index < snapshot.quiz.length - 1) {
    return { phase: 'quiz', index: position.index + 1 };
  }

  return position;
}

export function clampPosition(
  position: ModulePreviewPosition,
  snapshot: ModulePreviewSnapshot,
): ModulePreviewPosition {
  const safeIndex = Math.max(0, position.index);

  if (position.phase === 'card') {
    if (snapshot.cards.length === 0) {
      if (snapshot.quiz.length > 0) {
        return { phase: 'quiz', index: 0 };
      }
      return { phase: 'card', index: 0 };
    }
    if (safeIndex >= snapshot.cards.length) {
      return { phase: 'card', index: snapshot.cards.length - 1 };
    }
    return { phase: 'card', index: safeIndex };
  }

  if (snapshot.quiz.length === 0) {
    if (snapshot.cards.length > 0) {
      return { phase: 'card', index: snapshot.cards.length - 1 };
    }
    return { phase: 'card', index: 0 };
  }
  if (safeIndex >= snapshot.quiz.length) {
    return { phase: 'quiz', index: snapshot.quiz.length - 1 };
  }
  return { phase: 'quiz', index: safeIndex };
}

export function getInitialPosition(
  snapshot: ModulePreviewSnapshot,
  context?: Partial<ModulePreviewPosition>,
): ModulePreviewPosition {
  const phase = context?.phase ?? 'card';
  const index = context?.index ?? 0;
  return clampPosition({ phase, index }, snapshot);
}
