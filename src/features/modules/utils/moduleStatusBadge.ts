import type { StatusBadgeProps } from '@/components/ui/StatusBadge';
import type { AdminModuleLifecycleStatus } from '@/features/modules/api/adminModulesApi';
import type { ModuleStatus } from '@/features/modules/types/moduleLibrary.types';

export type UnifiedModuleStatus =
  | AdminModuleLifecycleStatus
  | ModuleStatus
  | string;

export function getModuleStatusBadgeProps(
  status: UnifiedModuleStatus,
): Pick<StatusBadgeProps, 'status' | 'label'> {
  const normalized = String(status).trim().toLowerCase();

  switch (normalized) {
    case 'published':
      return { status: 'success', label: 'Published' };
    case 'review_pending':
    case 'review pending':
      return { status: 'warning', label: 'Review' };
    case 'retired':
    case 'discarded':
      return { status: 'info', label: 'Discarded' };
    case 'deactivated':
      return { status: 'critical', label: 'Deactivated' };
    case 'draft':
    default:
      return { status: 'neutral', label: 'Draft' };
  }
}
