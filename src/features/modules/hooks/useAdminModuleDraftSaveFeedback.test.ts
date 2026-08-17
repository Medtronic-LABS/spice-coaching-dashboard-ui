import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAdminModuleDraftSaveFeedback } from '@/features/modules/hooks/useAdminModuleDraftSaveFeedback';
import { AdminModuleDraftValidationError } from '@/features/modules/utils/validateAdminModuleDraftContent';

describe('useAdminModuleDraftSaveFeedback', () => {
  it('surfaces draft validation issues for the dialog', () => {
    const formatError = vi.fn(() => 'formatted');
    const { result } = renderHook(() =>
      useAdminModuleDraftSaveFeedback(formatError),
    );

    act(() => {
      result.current.captureSaveError(
        new AdminModuleDraftValidationError([
          {
            kind: 'card',
            index: 0,
            itemId: 'c1',
            field: 'title',
            message: 'Card 1 needs a title.',
          },
        ]),
      );
    });

    expect(result.current.draftValidationOpen).toBe(true);
    expect(result.current.actionError).toBe('');
    expect(result.current.draftIssues).toHaveLength(1);
    expect(formatError).not.toHaveBeenCalled();
  });

  it('surfaces non-validation errors as banner text', () => {
    const formatError = vi.fn(() => 'Save failed');
    const { result } = renderHook(() =>
      useAdminModuleDraftSaveFeedback(formatError),
    );

    act(() => {
      result.current.captureSaveError(new Error('boom'));
    });

    expect(result.current.draftValidationOpen).toBe(false);
    expect(result.current.draftIssues).toEqual([]);
    expect(result.current.actionError).toBe('Save failed');
    expect(formatError).toHaveBeenCalledTimes(1);
  });

  it('clears dialog issues on close and clear', () => {
    const { result } = renderHook(() =>
      useAdminModuleDraftSaveFeedback(() => 'x'),
    );

    act(() => {
      result.current.captureSaveError(
        new AdminModuleDraftValidationError([
          {
            kind: 'quiz',
            index: 0,
            itemId: 'q1',
            field: 'question',
            message: 'Quiz question 1 needs a question.',
          },
        ]),
      );
    });

    act(() => {
      result.current.closeDraftValidation();
    });
    expect(result.current.draftIssues).toEqual([]);
    expect(result.current.draftValidationOpen).toBe(false);

    act(() => {
      result.current.captureSaveError(new Error('x'));
    });
    act(() => {
      result.current.clearSaveFeedback();
    });
    expect(result.current.actionError).toBe('');
  });
});
