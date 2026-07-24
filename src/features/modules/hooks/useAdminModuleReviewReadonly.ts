import { selectAdminModuleWorking } from '@/features/modules/store/adminModuleReviewSlice';
import { useAppSelector } from '@/store/hooks';

/** Draft modules are editable; published/deactivated are read-only. */
export function useAdminModuleReviewReadonly(): boolean {
  const working = useAppSelector(selectAdminModuleWorking);
  return working?.lifecycle_status !== 'draft';
}
