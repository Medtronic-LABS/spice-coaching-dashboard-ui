import { StatusBadge } from '@/components/ui';
import type { AdminModuleLifecycleStatus } from '@/features/modules/api/adminModulesApi';
import type { ModuleStatus } from '@/features/modules/types/moduleLibrary.types';
import { cn } from '@/utils';

export type UnifiedModuleStatus =
  | AdminModuleLifecycleStatus
  | ModuleStatus
  | string;

export const MODULE_STATUS_BADGE_CLASSNAME =
  'h-6 min-w-[7rem] whitespace-nowrap px-2.5 py-0 text-xs font-semibold leading-none tracking-wide';

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
      return { semanticStatus: 'warning', label: 'Review' };
    case 'retired':
    case 'discarded':
      return { semanticStatus: 'info', label: 'Discarded' };
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
  className,
}: ModuleStatusBadgeProps) => {
  const { semanticStatus, label } = getModuleStatusBadgeProps(status);
  return (
    <StatusBadge
      status={semanticStatus}
      label={overrideLabel ?? label}
      className={cn(MODULE_STATUS_BADGE_CLASSNAME, className)}
    />
  );
};
