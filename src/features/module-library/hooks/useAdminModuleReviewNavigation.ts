import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  discardChanges,
  selectAdminModuleReviewIsDirty,
} from '@/features/module-library/store/adminModuleReviewSlice';
import { isAdminModuleReviewFlowPath } from '@/features/module-library/utils/adminModuleReviewFlowPaths';
import { useAdminModuleReviewEditor } from '@/features/module-library/hooks/useAdminModuleReviewEditor';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useAdminModuleReviewNavigation(moduleId: string) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isDirty = useAppSelector(selectAdminModuleReviewIsDirty);
  const { save, isSaving } = useAdminModuleReviewEditor(moduleId);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const closeDialog = useCallback(() => {
    setPendingPath(null);
  }, []);

  /** Navigate freely between review steps; prompt only when leaving the flow. */
  const navigateTo = useCallback(
    (path: string) => {
      if (isDirty && !isAdminModuleReviewFlowPath(path)) {
        setPendingPath(path);
        return;
      }
      navigate(path);
    },
    [isDirty, navigate],
  );

  const confirmDiscard = useCallback(() => {
    dispatch(discardChanges());
    const target = pendingPath;
    closeDialog();
    if (target) navigate(target);
  }, [closeDialog, dispatch, navigate, pendingPath]);

  const confirmSaveAndLeave = useCallback(async () => {
    const target = pendingPath;
    await save();
    closeDialog();
    if (target) navigate(target);
  }, [closeDialog, navigate, pendingPath, save]);

  return {
    isDirty,
    isSaving,
    dialogOpen: pendingPath !== null,
    navigateTo,
    closeDialog,
    confirmDiscard,
    confirmSaveAndLeave,
  };
}
