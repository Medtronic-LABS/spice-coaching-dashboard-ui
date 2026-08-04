import { StatusBadge } from '@/components/ui';
import type { AdminModuleLifecycleStatus } from '@/features/modules/api/adminModulesApi';
import type { ModuleStatus } from '@/features/modules/types/moduleLibrary.types';

export type UnifiedModuleStatus =
  | AdminModuleLifecycleStatus
  | ModuleStatus
  | string;

export interface ModuleStatusBadgeProps {
  status: UnifiedModuleStatus;
  className?: string;
  overrideLabel?: string;
}

export function getModuleStatusBadgeProps(status: UnifiedModuleStatus): {
  semanticStatus: 'success' | 'warning' | 'critical' | 'info' | 'neutral';
  label: string;
} {
  const normalized = String(status).trim().toLowerCase();

  switch (normalized) {
    case 'published':
      return { semanticStatus: 'success', label: 'Published' };
    case 'review_pending':
    case 'review pending':
      return { semanticStatus: 'warning', label: 'Review Pending' };
    case 'retired':
    case 'discarded':
      return { semanticStatus: 'neutral', label: 'Discarded' };
    case 'deactivated':
      return { semanticStatus: 'critical', label: 'Deactivated' };
    case 'draft':
    default:
      return { semanticStatus: 'neutral', label: 'Draft' };
  }
}

export const ModuleStatusBadge = ({
  status,
  overrideLabel,
}: ModuleStatusBadgeProps) => {
  const { semanticStatus, label } = getModuleStatusBadgeProps(status);
  return <StatusBadge status={semanticStatus} label={overrideLabel ?? label} />;
};
