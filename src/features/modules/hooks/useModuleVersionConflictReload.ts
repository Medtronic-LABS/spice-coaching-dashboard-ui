import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminModulesApi } from '@/features/modules/api/adminModulesApi';
import {
  clearVersionConflict,
  markSaved,
  selectModuleVersionConflict,
} from '@/features/modules/store/adminModuleReviewSlice';
import { applyModuleVersionConflictReload } from '@/features/modules/utils/applyModuleVersionConflictReload';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/**
 * Layout-level handler for OCC 409 conflicts: reload tip and force-replace
 * working/baseline (discards local dirty edits).
 */
export function useModuleVersionConflictReload(moduleId: string) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const versionConflict = useAppSelector(selectModuleVersionConflict);
  const [isReloading, setIsReloading] = useState(false);

  const dismissConflict = useCallback(() => {
    dispatch(clearVersionConflict());
  }, [dispatch]);

  const reloadLatestTip = useCallback(async () => {
    if (!versionConflict) return;
    const tipId = versionConflict.latest_module_id;
    setIsReloading(true);
    try {
      await applyModuleVersionConflictReload({
        tipId,
        currentModuleId: moduleId,
        pathname,
        navigate,
        refetchModule: async (targetModuleId) => {
          const subscription = dispatch(
            adminModulesApi.endpoints.getModuleDetail.initiate(targetModuleId, {
              forceRefetch: true,
            }),
          );
          try {
            return await subscription;
          } finally {
            subscription.unsubscribe();
          }
        },
        onLoaded: (data) => dispatch(markSaved(data)),
      });
    } finally {
      setIsReloading(false);
    }
  }, [dispatch, moduleId, navigate, pathname, versionConflict]);

  return {
    versionConflict,
    isReloading,
    dismissConflict,
    reloadLatestTip,
  };
}
