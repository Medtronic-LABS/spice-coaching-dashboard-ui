import { getCurrentRole } from '@/constants/role';
import { selectAdminModuleWorking } from '@/features/modules/store/adminModuleReviewSlice';
import { useAppSelector } from '@/store/hooks';

/** Only program managers reviewing a draft may edit or publish. */
export function useAdminModuleReviewReadonly(): boolean {
  const working = useAppSelector(selectAdminModuleWorking);
  return (
    getCurrentRole() !== 'programManager' ||
    working?.lifecycle_status !== 'draft'
  );
}
