import { useCallback, useState } from 'react';
import {
  isAdminModuleDraftValidationError,
  type AdminModuleDraftIssue,
} from '@/features/modules/utils/validateAdminModuleDraftContent';

export function useAdminModuleDraftSaveFeedback(
  formatError: (error: unknown) => string,
) {
  const [actionError, setActionError] = useState('');
  const [draftIssues, setDraftIssues] = useState<AdminModuleDraftIssue[]>([]);

  const clearSaveFeedback = useCallback(() => {
    setActionError('');
    setDraftIssues([]);
  }, []);

  const captureSaveError = useCallback(
    (error: unknown) => {
      if (isAdminModuleDraftValidationError(error)) {
        setDraftIssues(error.issues);
        setActionError('');
        return;
      }
      setDraftIssues([]);
      setActionError(formatError(error));
    },
    [formatError],
  );

  const closeDraftValidation = useCallback(() => {
    setDraftIssues([]);
  }, []);

  return {
    actionError,
    draftIssues,
    draftValidationOpen: draftIssues.length > 0,
    clearSaveFeedback,
    captureSaveError,
    closeDraftValidation,
  };
}
