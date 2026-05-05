import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useResetCourseDraftMutation } from '@/features/program-manager/api/programManagerApi';

export const CourseFlowLayout = () => {
  const [resetCourseDraft] = useResetCourseDraftMutation();

  useEffect(() => {
    return () => {
      // Clear the in-memory draft when exiting the course flow.
      void resetCourseDraft();
    };
  }, [resetCourseDraft]);

  return <Outlet />;
};
