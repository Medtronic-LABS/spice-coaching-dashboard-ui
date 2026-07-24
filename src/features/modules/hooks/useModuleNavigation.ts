import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModuleEditor } from '@/features/modules/hooks/useModuleEditor';
import {
  discardModuleChanges,
  selectModuleIsDirty,
} from '@/features/modules/store/moduleEditSlice';
import { isModuleFlowPath } from '@/features/modules/utils/moduleFlowPaths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useModuleNavigation() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isDirty = useAppSelector(selectModuleIsDirty);
  const { saveAllForLeave, isSaving } = useModuleEditor();
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

  /** Navigate freely between creation steps; prompt only when leaving the flow. */
  const navigateTo = useCallback(
    (path: string) => {
      if (isDirty && !isModuleFlowPath(path)) {
        setPendingPath(path);
        return;
      }
      navigate(path);
    },
    [isDirty, navigate],
  );

  const confirmDiscard = useCallback(() => {
    dispatch(discardModuleChanges());
    const target = pendingPath;
    closeDialog();
    if (target) navigate(target);
  }, [closeDialog, dispatch, navigate, pendingPath]);

  const confirmSaveAndLeave = useCallback(async () => {
    const target = pendingPath;
    await saveAllForLeave();
    closeDialog();
    if (target) navigate(target);
  }, [closeDialog, navigate, pendingPath, saveAllForLeave]);

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
