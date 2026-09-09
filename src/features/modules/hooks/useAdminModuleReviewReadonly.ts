import { selectAdminModuleWorking } from '@/features/modules/store/adminModuleReviewSlice';
import { useAppSelector } from '@/store/hooks';

/**
 * Module review is editable only while the working copy is a draft.
 * Published / deactivated (and missing) modules are read-only for everyone.
 */
export function useAdminModuleReviewReadonly(): boolean {
  const working = useAppSelector(selectAdminModuleWorking);
  return working?.lifecycle_status !== 'draft';
}
