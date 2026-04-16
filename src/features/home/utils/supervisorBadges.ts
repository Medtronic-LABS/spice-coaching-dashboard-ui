import type {
  PerformanceAlertItem,
  SupervisorStatus,
} from '@/types/supervisor.types';

export type BadgeStatus =
  | 'success'
  | 'warning'
  | 'critical'
  | 'info'
  | 'neutral';

export function statusToBadge(status: SupervisorStatus | 'in_progress'): {
  badge: BadgeStatus;
  label: string;
} {
  switch (status) {
    case 'on_track':
      return { badge: 'success', label: 'On track' };
    case 'on_time':
      return { badge: 'success', label: 'On time' };
    case 'due_soon':
      return { badge: 'warning', label: 'Due soon' };
    case 'delayed':
      return { badge: 'critical', label: 'Delayed' };
    case 'inactive':
      return { badge: 'neutral', label: 'Inactive' };
    case 'in_progress':
      return { badge: 'info', label: 'In progress' };
    default:
      return { badge: 'neutral', label: 'Unknown' };
  }
}

export function severityToBadgeStatus(
  severity: PerformanceAlertItem['severity'],
): BadgeStatus {
  switch (severity) {
    case 'high':
      return 'critical';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'neutral';
  }
}
