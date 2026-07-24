import { describe, expect, it } from 'vitest';
import { resolvePreviewAnswerCardState } from '@/features/modules/utils/previewAnswerCardState';

describe('resolvePreviewAnswerCardState', () => {
  const correctIndex = 1;

  it('returns unselected when nothing is selected and not revealed', () => {
    for (let i = 0; i < 4; i += 1) {
      expect(resolvePreviewAnswerCardState(i, null, correctIndex, false)).toBe(
        'unselected',
      );
    }
  });

  it('returns selected for the tapped option before reveal', () => {
    expect(resolvePreviewAnswerCardState(0, 0, correctIndex, false)).toBe(
      'selected',
    );
    expect(resolvePreviewAnswerCardState(1, 0, correctIndex, false)).toBe(
      'unselected',
    );
  });

  it('reveals the correct option after reveal', () => {
    expect(resolvePreviewAnswerCardState(1, 0, correctIndex, true)).toBe(
      'correct_revealed',
    );
  });

  it('reveals wrong selection and correct answer after reveal', () => {
    expect(resolvePreviewAnswerCardState(0, 0, correctIndex, true)).toBe(
      'wrong_revealed',
    );
    expect(resolvePreviewAnswerCardState(1, 0, correctIndex, true)).toBe(
      'correct_revealed',
    );
    expect(resolvePreviewAnswerCardState(2, 0, correctIndex, true)).toBe(
      'unselected',
    );
  });

  it('shows only correct_revealed when the correct option was selected', () => {
    expect(resolvePreviewAnswerCardState(1, 1, correctIndex, true)).toBe(
      'correct_revealed',
    );
    expect(resolvePreviewAnswerCardState(0, 1, correctIndex, true)).toBe(
      'unselected',
    );
  });
});
