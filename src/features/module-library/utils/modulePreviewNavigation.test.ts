import { describe, expect, it } from 'vitest';
import type {
  ModulePreviewPosition,
  ModulePreviewSnapshot,
} from '@/features/module-library/types/modulePreview.types';
import {
  canGoNext,
  canGoPrevious,
  clampPosition,
  getInitialPosition,
  getStepLabel,
  getTotalSteps,
  goNext,
  goPrevious,
} from '@/features/module-library/utils/modulePreviewNavigation';

function snapshot(cardCount: number, quizCount: number): ModulePreviewSnapshot {
  return {
    moduleTitle: 'Test',
    cards: Array.from({ length: cardCount }, (_, index) => ({
      index,
      title: `Card ${index + 1}`,
      body: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body' }] }],
    })),
    quiz: Array.from({ length: quizCount }, (_, index) => ({
      index,
      id: `q${index + 1}`,
      question: `Question ${index + 1}`,
      caseSetup: '',
      options: ['A', 'B'],
      correctIndex: 0,
      explanation: '',
    })),
    syncedAt: Date.now(),
  };
}

describe('modulePreviewNavigation', () => {
  it('reports total steps as cards plus quiz', () => {
    expect(getTotalSteps(snapshot(3, 2))).toBe(5);
  });

  it('formats step labels for cards and quiz', () => {
    const snap = snapshot(5, 10);
    expect(getStepLabel({ phase: 'card', index: 1 }, snap)).toBe(
      'Learning 2 of 5',
    );
    expect(getStepLabel({ phase: 'quiz', index: 2 }, snap)).toBe(
      'Question 3 of 10',
    );
  });

  it('disables previous on first card', () => {
    const snap = snapshot(3, 2);
    const position: ModulePreviewPosition = { phase: 'card', index: 0 };
    expect(canGoPrevious(position, snap)).toBe(false);
  });

  it('moves from last card to first quiz when quiz exists', () => {
    const snap = snapshot(3, 2);
    const lastCard: ModulePreviewPosition = { phase: 'card', index: 2 };

    expect(canGoNext(lastCard, snap)).toBe(true);
    expect(goNext(lastCard, snap)).toEqual({ phase: 'quiz', index: 0 });
  });

  it('stays on last card when no quiz exists', () => {
    const snap = snapshot(3, 0);
    const lastCard: ModulePreviewPosition = { phase: 'card', index: 2 };

    expect(canGoNext(lastCard, snap)).toBe(false);
    expect(goNext(lastCard, snap)).toEqual(lastCard);
  });

  it('moves from first quiz to last card when cards exist', () => {
    const snap = snapshot(3, 2);
    const firstQuiz: ModulePreviewPosition = { phase: 'quiz', index: 0 };

    expect(canGoPrevious(firstQuiz, snap)).toBe(true);
    expect(goPrevious(firstQuiz, snap)).toEqual({ phase: 'card', index: 2 });
  });

  it('walks forward through all cards then all quiz items', () => {
    const snap = snapshot(2, 2);
    let position: ModulePreviewPosition = { phase: 'card', index: 0 };
    const visited: ModulePreviewPosition[] = [position];

    while (canGoNext(position, snap)) {
      position = goNext(position, snap);
      visited.push(position);
    }

    expect(visited).toEqual([
      { phase: 'card', index: 0 },
      { phase: 'card', index: 1 },
      { phase: 'quiz', index: 0 },
      { phase: 'quiz', index: 1 },
    ]);
  });

  it('clamps card index when cards were removed', () => {
    const snap = snapshot(2, 1);
    expect(clampPosition({ phase: 'card', index: 5 }, snap)).toEqual({
      phase: 'card',
      index: 1,
    });
  });

  it('clamps quiz index when quiz items were removed', () => {
    const snap = snapshot(2, 1);
    expect(clampPosition({ phase: 'quiz', index: 4 }, snap)).toEqual({
      phase: 'quiz',
      index: 0,
    });
  });

  it('moves to first quiz when card phase has no cards', () => {
    const snap = snapshot(0, 2);
    expect(clampPosition({ phase: 'card', index: 0 }, snap)).toEqual({
      phase: 'quiz',
      index: 0,
    });
  });

  it('moves to last card when quiz phase has no quiz items', () => {
    const snap = snapshot(3, 0);
    expect(clampPosition({ phase: 'quiz', index: 0 }, snap)).toEqual({
      phase: 'card',
      index: 2,
    });
  });

  it('honors valid context in getInitialPosition', () => {
    const snap = snapshot(5, 3);
    expect(getInitialPosition(snap, { phase: 'quiz', index: 2 })).toEqual({
      phase: 'quiz',
      index: 2,
    });
  });

  it('defaults to first card when no context is provided', () => {
    const snap = snapshot(3, 2);
    expect(getInitialPosition(snap)).toEqual({ phase: 'card', index: 0 });
  });
});
