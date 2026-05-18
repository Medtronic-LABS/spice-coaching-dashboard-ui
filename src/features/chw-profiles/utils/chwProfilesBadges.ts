import { i18n } from '@/i18n/i18n';
import type {
  ChwDeadlineStatus,
  ChwOverallStatus,
  ChwModuleStatus,
  ChwQuizStatus,
} from '@/features/chw-profiles/types/chwProfiles.types';
import type { StatusBadgeProps } from '@/components/ui/StatusBadge';

type BadgeTone = StatusBadgeProps['status'];

export function overallStatusToTone(status: ChwOverallStatus): {
  tone: BadgeTone;
  label: string;
  outlined?: boolean;
} {
  switch (status) {
    case 'on_track':
      return { tone: 'success', label: i18n.t('status.onTrack') };
    case 'in_progress':
      return { tone: 'info', label: i18n.t('status.inProgress') };
    case 'overdue':
      return { tone: 'critical', label: i18n.t('chwProfiles.status.overdue') };
    case 'flagged':
      return {
        tone: 'critical',
        label: i18n.t('chwProfiles.status.flagged'),
        outlined: true,
      };
    default:
      return { tone: 'neutral', label: i18n.t('status.unknown') };
  }
}

export function deadlineStatusToTone(status: ChwDeadlineStatus): {
  tone: BadgeTone;
  label: string;
} {
  switch (status) {
    case 'on_time':
      return { tone: 'neutral', label: i18n.t('status.onTime') };
    case 'due_soon':
      return { tone: 'warning', label: i18n.t('status.dueSoon') };
    case 'overdue':
      return {
        tone: 'critical',
        label: i18n.t('chwProfiles.deadline.overdue'),
      };
    default:
      return { tone: 'neutral', label: i18n.t('status.unknown') };
  }
}

export function moduleStatusToTone(status: ChwModuleStatus): {
  tone: BadgeTone;
  label: string;
} {
  switch (status) {
    case 'completed':
      return { tone: 'success', label: i18n.t('chwProfiles.module.completed') };
    case 'in_progress':
      return { tone: 'info', label: i18n.t('chwProfiles.module.inProgress') };
    default:
      return { tone: 'neutral', label: i18n.t('status.unknown') };
  }
}

export function quizStatusToTone(status: ChwQuizStatus): {
  tone: BadgeTone;
  label: string;
} {
  switch (status) {
    case 'pass':
      return { tone: 'success', label: i18n.t('chwProfiles.quiz.pass') };
    case 'fail':
      return { tone: 'critical', label: i18n.t('chwProfiles.quiz.fail') };
    default:
      return { tone: 'neutral', label: i18n.t('status.unknown') };
  }
}
