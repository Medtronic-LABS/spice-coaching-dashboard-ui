import { describe, expect, it } from 'vitest';
import type {
  TeamMemberModuleActivity,
  TeamMemberQuestionItem,
} from '@/features/admin-dashboard/types/dashboard.types';
import {
  latestModuleCompletedAt,
  rankTopQueries,
  toRelativeActivity,
} from '@/features/admin-dashboard/utils/skDetailDrawer';

function module(
  partial: Partial<TeamMemberModuleActivity>,
): TeamMemberModuleActivity {
  return {
    module_id: 'm1',
    title: { en: 'Module' },
    completed_in_range: false,
    completed_at: null,
    ...partial,
  };
}

describe('latestModuleCompletedAt', () => {
  it('returns null when no module has a completion timestamp', () => {
    expect(
      latestModuleCompletedAt([
        module({}),
        module({ module_id: 'm2', completed_in_range: false }),
      ]),
    ).toBeNull();
  });

  it('returns the most recent completed_at', () => {
    expect(
      latestModuleCompletedAt([
        module({ completed_at: '2026-08-01T10:00:00Z' }),
        module({
          module_id: 'm2',
          completed_at: '2026-08-10T10:00:00Z',
        }),
        module({
          module_id: 'm3',
          completed_at: '2026-08-05T10:00:00Z',
        }),
      ]),
    ).toBe('2026-08-10T10:00:00Z');
  });
});

describe('toRelativeActivity', () => {
  const now = new Date('2026-08-15T12:00:00');

  it('returns never for missing or invalid timestamps', () => {
    expect(toRelativeActivity(null, now)).toEqual({ kind: 'never' });
    expect(toRelativeActivity('not-a-date', now)).toEqual({ kind: 'never' });
  });

  it('returns today, yesterday, and day counts from calendar dates', () => {
    expect(toRelativeActivity('2026-08-15T01:00:00', now)).toEqual({
      kind: 'today',
    });
    expect(toRelativeActivity('2026-08-14T23:00:00', now)).toEqual({
      kind: 'yesterday',
    });
    expect(toRelativeActivity('2026-08-07T09:00:00', now)).toEqual({
      kind: 'days',
      count: 8,
    });
  });
});

describe('rankTopQueries', () => {
  it('orders by occurrence then recency', () => {
    const questions: TeamMemberQuestionItem[] = [
      {
        question: 'Older high',
        occurrence_count: 2,
        last_asked_at: '2026-08-01T00:00:00Z',
      },
      {
        question: 'Newer high',
        occurrence_count: 2,
        last_asked_at: '2026-08-10T00:00:00Z',
      },
      {
        question: 'Low',
        occurrence_count: 1,
        last_asked_at: '2026-08-12T00:00:00Z',
      },
    ];

    expect(rankTopQueries(questions).map((item) => item.question)).toEqual([
      'Newer high',
      'Older high',
      'Low',
    ]);
  });
});
