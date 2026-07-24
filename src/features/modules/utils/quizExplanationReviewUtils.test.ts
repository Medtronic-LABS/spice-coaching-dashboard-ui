import { describe, expect, it } from 'vitest';
import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import {
  buildBaselinesFromQuiz,
  ensureQuizContentBaselines,
  quizContentMatches,
  quizContentSnapshot,
  resolveExplanationReviewsOnSave,
  syncPendingExplanationReviews,
} from './quizExplanationReviewUtils';

function quizItem(
  overrides: Partial<AdminModuleQuizItem> = {},
): AdminModuleQuizItem {
  return {
    id: 'q1',
    question_order: 1,
    question: { bn: 'Question' },
    case_setup: null,
    options: { bn: ['a', 'b'] },
    correct_indices: [0],
    explanation: { bn: 'Because' },
    difficulty: 'medium',
    ...overrides,
  };
}

describe('quizExplanationReviewUtils', () => {
  it('marks pending review when question text changes from baseline', () => {
    const item = quizItem();
    const baselines = buildBaselinesFromQuiz([item]);
    const edited = quizItem({ question: { bn: 'Updated question' } });

    const synced = syncPendingExplanationReviews([edited], baselines, [], []);

    expect(synced.pendingIds).toEqual(['q1']);
    expect(synced.acknowledgedIds).toEqual([]);
  });

  it('marks pending review when an option changes from baseline', () => {
    const item = quizItem();
    const baselines = buildBaselinesFromQuiz([item]);
    const edited = quizItem({ options: { bn: ['a', 'changed'] } });

    const synced = syncPendingExplanationReviews([edited], baselines, [], []);

    expect(synced.pendingIds).toEqual(['q1']);
  });

  it('marks pending review when correct option changes from baseline', () => {
    const item = quizItem({ correct_indices: [0] });
    const baselines = buildBaselinesFromQuiz([item]);
    const edited = quizItem({ correct_indices: [1] });

    const synced = syncPendingExplanationReviews([edited], baselines, [], []);

    expect(synced.pendingIds).toEqual(['q1']);
  });

  it('clears pending review when question and options match baseline again', () => {
    const item = quizItem();
    const baselines = buildBaselinesFromQuiz([item]);
    const edited = quizItem({ question: { bn: 'Updated question' } });
    const reverted = quizItem({ question: { bn: 'Question' } });

    const afterEdit = syncPendingExplanationReviews(
      [edited],
      baselines,
      [],
      [],
    );
    const afterRevert = syncPendingExplanationReviews(
      [reverted],
      baselines,
      afterEdit.pendingIds,
      afterEdit.acknowledgedIds,
    );

    expect(afterRevert.pendingIds).toEqual([]);
  });

  it('keeps reviewed edits out of pending until question content changes again', () => {
    const item = quizItem();
    const baselines = buildBaselinesFromQuiz([item]);
    const edited = quizItem({ question: { bn: 'Updated question' } });

    const afterEdit = syncPendingExplanationReviews(
      [edited],
      baselines,
      [],
      [],
    );
    expect(afterEdit.pendingIds).toEqual(['q1']);

    const afterReview = syncPendingExplanationReviews(
      [edited],
      baselines,
      [],
      ['q1'],
    );
    expect(afterReview.pendingIds).toEqual([]);
    expect(afterReview.acknowledgedIds).toEqual(['q1']);
  });

  it('returns edited question to pending after review acknowledgement is cleared', () => {
    const item = quizItem();
    const baselines = buildBaselinesFromQuiz([item]);
    const edited = quizItem({ question: { bn: 'Updated question' } });

    const afterReview = syncPendingExplanationReviews(
      [edited],
      baselines,
      [],
      ['q1'],
    );
    expect(afterReview.pendingIds).toEqual([]);

    const afterReEdit = syncPendingExplanationReviews(
      [edited],
      baselines,
      [],
      [],
    );
    expect(afterReEdit.pendingIds).toEqual(['q1']);
  });

  it('seeds missing baselines from saved quiz content before comparing', () => {
    const item = quizItem();
    const edited = quizItem({ question: { bn: 'Updated question' } });

    const baselines = ensureQuizContentBaselines([edited], [item], {});
    const synced = syncPendingExplanationReviews([edited], baselines, [], []);

    expect(synced.pendingIds).toEqual(['q1']);
  });

  it('clears pending review state and refreshes baselines on save', () => {
    const item = quizItem();
    const baselines = buildBaselinesFromQuiz([item]);
    const edited = quizItem({ question: { bn: 'Updated question' } });

    const resolved = resolveExplanationReviewsOnSave([edited]);

    expect(resolved.pendingIds).toEqual([]);
    expect(resolved.acknowledgedIds).toEqual([]);
    expect(
      quizContentMatches(resolved.baselines.q1, quizContentSnapshot(edited)),
    ).toBe(true);
    expect(quizContentMatches(resolved.baselines.q1, baselines.q1)).toBe(false);
  });

  it('orders pending reviews by question_order, not edit order', () => {
    const q1 = quizItem({ id: 'q1', question_order: 1 });
    const q2 = quizItem({ id: 'q2', question_order: 2 });
    const q3 = quizItem({ id: 'q3', question_order: 3 });
    const baselines = buildBaselinesFromQuiz([q1, q2, q3]);

    const editedLaterFirst = quizItem({
      id: 'q3',
      question_order: 3,
      question: { bn: 'Updated C' },
    });
    const afterEditQ3 = syncPendingExplanationReviews(
      [q1, q2, editedLaterFirst],
      baselines,
      [],
      [],
    );
    expect(afterEditQ3.pendingIds).toEqual(['q3']);

    const editedEarlierSecond = quizItem({
      id: 'q1',
      question_order: 1,
      question: { bn: 'Updated A' },
    });
    const afterEditQ1 = syncPendingExplanationReviews(
      [editedEarlierSecond, q2, editedLaterFirst],
      baselines,
      afterEditQ3.pendingIds,
      [],
    );

    expect(afterEditQ1.pendingIds).toEqual(['q1', 'q3']);
  });
});
