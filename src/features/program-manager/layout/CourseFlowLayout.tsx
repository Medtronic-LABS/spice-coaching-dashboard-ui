import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { UnsavedChangesDialog } from '@/components/ui';
import { useCourseModuleNavigation } from '@/features/program-manager/hooks/useCourseModuleNavigation';
import { useResetCourseDraftMutation } from '@/features/program-manager/api/programManagerApi';
import { clearCourseModuleEdit } from '@/features/program-manager/store/courseModuleEditSlice';
import { useAppDispatch } from '@/store/hooks';

export const CourseFlowLayout = () => {
  const dispatch = useAppDispatch();
  const [resetCourseDraft] = useResetCourseDraftMutation();
  const {
    dialogOpen,
    closeDialog,
    confirmDiscard,
    confirmSaveAndLeave,
    isSaving,
  } = useCourseModuleNavigation();

  useEffect(() => {
    return () => {
      void resetCourseDraft();
      dispatch(clearCourseModuleEdit());
    };
  }, [dispatch, resetCourseDraft]);

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
