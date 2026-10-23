import type {
  TeamMemberModuleActivity,
  TeamMemberQuestionItem,
} from '@/features/admin-dashboard/types/dashboard.types';

const MS_PER_DAY = 86_400_000;

export type RelativeActivity =
  | { kind: 'never' }
  | { kind: 'today' }
  | { kind: 'yesterday' }
  | { kind: 'days'; count: number };

export function latestModuleCompletedAt(
  modules: TeamMemberModuleActivity[],
): string | null {
  let latestMs = Number.NEGATIVE_INFINITY;
  let latest: string | null = null;

  for (const module of modules) {
    if (!module.completed_at) continue;
    const timestamp = Date.parse(module.completed_at);
    if (Number.isNaN(timestamp) || timestamp <= latestMs) continue;
    latestMs = timestamp;
    latest = module.completed_at;
  }

  return latest;
}

function startOfLocalDay(value: Date): number {
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
}

export function toRelativeActivity(
  iso: string | null | undefined,
  now = new Date(),
): RelativeActivity {
  if (!iso) return { kind: 'never' };
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { kind: 'never' };

  const days = Math.round(
    (startOfLocalDay(now) - startOfLocalDay(parsed)) / MS_PER_DAY,
  );
  if (days <= 0) return { kind: 'today' };
  if (days === 1) return { kind: 'yesterday' };
  return { kind: 'days', count: days };
}

export function rankTopQueries(
  questions: TeamMemberQuestionItem[],
): TeamMemberQuestionItem[] {
  return [...questions].sort((left, right) => {
    if (right.occurrence_count !== left.occurrence_count) {
      return right.occurrence_count - left.occurrence_count;
    }
    return right.last_asked_at.localeCompare(left.last_asked_at);
  });
}
