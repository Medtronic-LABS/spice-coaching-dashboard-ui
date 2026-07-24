import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { UnsavedChangesDialog } from '@/components/ui';
import { useModuleNavigation } from '@/features/modules/hooks/useModuleNavigation';
import { useResetModuleDraftMutation } from '@/features/modules/api/moduleDraftApi';
import { clearModuleEdit } from '@/features/modules/store/moduleEditSlice';
import { useAppDispatch } from '@/store/hooks';

export const ModuleFlowLayout = () => {
  const dispatch = useAppDispatch();
  const [resetModuleDraft] = useResetModuleDraftMutation();
  const {
    dialogOpen,
    closeDialog,
    confirmDiscard,
    confirmSaveAndLeave,
    isSaving,
  } = useModuleNavigation();

  useEffect(() => {
    return () => {
      void resetModuleDraft();
      dispatch(clearModuleEdit());
    };
  }, [dispatch, resetModuleDraft]);

  return (
    <>
      <UnsavedChangesDialog
        open={dialogOpen}
        onStay={closeDialog}
        onDiscard={confirmDiscard}
        onSaveAndLeave={() => void confirmSaveAndLeave()}
        isSaving={isSaving}
      />
      <Outlet />
    </>
  );
};
