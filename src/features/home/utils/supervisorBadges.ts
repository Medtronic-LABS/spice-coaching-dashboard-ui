import type {
  PerformanceAlertItem,
  SupervisorStatus,
} from '@/types/supervisor.types';
import { i18n } from '@/i18n/i18n';

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
      return { badge: 'success', label: i18n.t('status.onTrack') };
    case 'on_time':
      return { badge: 'success', label: i18n.t('status.onTime') };
    case 'due_soon':
      return { badge: 'warning', label: i18n.t('status.dueSoon') };
    case 'delayed':
      return { badge: 'critical', label: i18n.t('status.delayed') };
    case 'inactive':
      return { badge: 'neutral', label: i18n.t('status.inactive') };
    case 'in_progress':
      return { badge: 'info', label: i18n.t('status.inProgress') };
    default:
      return { badge: 'neutral', label: i18n.t('status.unknown') };
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
