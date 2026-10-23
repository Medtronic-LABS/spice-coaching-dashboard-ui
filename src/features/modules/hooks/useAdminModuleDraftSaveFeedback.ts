import { useCallback, useState } from 'react';
import { useSnackbar } from '@/components/ui/Snackbar/SnackbarProvider';
import {
  isAdminModuleDraftValidationError,
  type AdminModuleDraftIssue,
} from '@/features/modules/utils/validateAdminModuleDraftContent';

export function useAdminModuleDraftSaveFeedback(
  formatError: (error: unknown) => string,
) {
  const snackbar = useSnackbar();
  const [draftIssues, setDraftIssues] = useState<AdminModuleDraftIssue[]>([]);

  const clearSaveFeedback = useCallback(() => {
    setDraftIssues([]);
  }, []);

  const captureSaveError = useCallback(
    (error: unknown) => {
      if (isAdminModuleDraftValidationError(error)) {
        setDraftIssues(error.issues);
        return;
      }
      setDraftIssues([]);
      snackbar.showError(formatError(error));
    },
    [formatError, snackbar],
  );

  const closeDraftValidation = useCallback(() => {
    setDraftIssues([]);
  }, []);

  return {
    draftIssues,
    draftValidationOpen: draftIssues.length > 0,
    clearSaveFeedback,
    captureSaveError,
    closeDraftValidation,
  };
}
