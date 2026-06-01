import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseModuleEditor } from '@/features/program-manager/hooks/useCourseModuleEditor';
import {
  discardCourseChanges,
  selectCourseModuleIsDirty,
} from '@/features/program-manager/store/courseModuleEditSlice';
import { isCourseModuleFlowPath } from '@/features/program-manager/utils/courseModuleFlowPaths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useCourseModuleNavigation() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isDirty = useAppSelector(selectCourseModuleIsDirty);
  const { saveAllForLeave, isSaving } = useCourseModuleEditor();
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
      if (isDirty && !isCourseModuleFlowPath(path)) {
        setPendingPath(path);
        return;
      }
      navigate(path);
    },
    [isDirty, navigate],
  );

  const confirmDiscard = useCallback(() => {
    dispatch(discardCourseChanges());
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
