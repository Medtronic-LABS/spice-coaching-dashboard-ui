import type { NavigateFunction } from 'react-router-dom';
import type { AdminModuleDetailResponse } from '@/features/modules/api/adminModulesApi';
import { buildAdminModuleReviewPath } from '@/features/modules/utils/applyEditModuleAndSyncRoute';

function isAdminModuleDetailResponse(
  value: unknown,
): value is AdminModuleDetailResponse {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' && typeof record.module_family_id === 'string'
  );
}

export function readRefetchedModuleDetail(
  value: unknown,
): AdminModuleDetailResponse | null {
  if (!value || typeof value !== 'object' || !('data' in value)) return null;
  const data = (value as { data: unknown }).data;
  return isAdminModuleDetailResponse(data) ? data : null;
}

/**
 * Force-replace editor state from the tip and navigate when the tip id differs.
 * Returns true when tip detail was loaded successfully.
 */
export async function applyModuleVersionConflictReload(options: {
  tipId: string;
  currentModuleId: string;
  pathname: string;
  navigate: NavigateFunction;
  refetchModule: (moduleId: string) => Promise<unknown>;
  onLoaded: (data: AdminModuleDetailResponse) => void;
}): Promise<boolean> {
  const refreshed = await options.refetchModule(options.tipId);
  const tip = readRefetchedModuleDetail(refreshed);
  if (!tip) return false;

  options.onLoaded(tip);

  if (options.tipId !== options.currentModuleId) {
    const nextPath = buildAdminModuleReviewPath(
      options.pathname,
      options.tipId,
    );
    if (nextPath) {
      options.navigate(nextPath, { replace: true });
    }
  }

  return true;
}
