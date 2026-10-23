import { act, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SnackbarProvider } from '@/components/ui/Snackbar/SnackbarProvider';
import { useAdminModuleDraftSaveFeedback } from '@/features/modules/hooks/useAdminModuleDraftSaveFeedback';
import { AdminModuleDraftValidationError } from '@/features/modules/utils/validateAdminModuleDraftContent';

function renderSaveFeedbackHook(formatError: (error: unknown) => string) {
  return renderHook(() => useAdminModuleDraftSaveFeedback(formatError), {
    wrapper: SnackbarProvider,
  });
}

describe('useAdminModuleDraftSaveFeedback', () => {
  it('surfaces draft validation issues for the dialog', () => {
    const formatError = vi.fn(() => 'formatted');
    const { result } = renderSaveFeedbackHook(formatError);

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
    expect(result.current.draftIssues).toHaveLength(1);
    expect(formatError).not.toHaveBeenCalled();
  });

  it('surfaces non-validation errors in a snackbar', () => {
    const formatError = vi.fn(() => 'Save failed');
    const { result } = renderSaveFeedbackHook(formatError);

    act(() => {
      result.current.captureSaveError(new Error('boom'));
    });

    expect(result.current.draftValidationOpen).toBe(false);
    expect(result.current.draftIssues).toEqual([]);
    expect(formatError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Save failed');
  });

  it('clears dialog issues on close and clear', () => {
    const { result } = renderSaveFeedbackHook(() => 'x');

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
    expect(result.current.draftIssues).toEqual([]);
  });
});
