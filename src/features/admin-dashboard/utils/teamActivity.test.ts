import { describe, expect, it } from 'vitest';
import type { TeamActivityMember } from '@/features/admin-dashboard/types/dashboard.types';
import {
  hierarchyTabDepth,
  isMemberAtRisk,
  resolveMemberDescendantInactiveCount,
  resolveMemberDescendantSkCount,
  toTeamActivitySortParams,
} from '@/features/admin-dashboard/utils/teamActivity';

function member(partial: Partial<TeamActivityMember>): TeamActivityMember {
  return {
    user_id: 1,
    name: 'Test User',
    role: 'AREA_MANAGER',
    can_drill_down: true,
    is_active: true,
    is_chatbot_engaged: false,
    last_chat_at: null,
    last_active_at: null,
    has_completed_module_in_range: false,
    assigned_modules: [],
    chatbot_query_count: 0,
    chatbot_unattributed_query_count: 0,
    chatbot_modules: [],
    refreshers_generated: 0,
    refreshers_completed: 0,
    performance_status: 'on_track',
    ...partial,
  };
}

describe('toTeamActivitySortParams', () => {
  it('maps dropdown keys to backend sort_by / sort_dir', () => {
    expect(toTeamActivitySortParams('default')).toEqual({
      sort_by: 'name',
      sort_dir: 'asc',
    });
    expect(toTeamActivitySortParams('name')).toEqual({
      sort_by: 'name',
      sort_dir: 'asc',
    });
    expect(toTeamActivitySortParams('at_risk_first')).toEqual({
      sort_by: 'performance_status',
      sort_dir: 'asc',
    });
    expect(toTeamActivitySortParams('lowest_completion')).toEqual({
      sort_by: 'module_completion',
      sort_dir: 'asc',
    });
    expect(toTeamActivitySortParams('lowest_chatbot')).toEqual({
      sort_by: 'chatbot_engagement',
      sort_dir: 'asc',
    });
  });
});

describe('isMemberAtRisk', () => {
  it('uses server performance_status', () => {
    expect(isMemberAtRisk(member({ performance_status: 'at_risk' }))).toBe(
      true,
    );
    expect(isMemberAtRisk(member({ performance_status: 'on_track' }))).toBe(
      false,
    );
  });
});

describe('hierarchyTabDepth', () => {
  it('uses admin-relative depths by default', () => {
    expect(hierarchyTabDepth('am')).toBeUndefined();
    expect(hierarchyTabDepth('po')).toBe(1);
    expect(hierarchyTabDepth('sk')).toBe(2);
  });

  it('shifts depths for area manager viewers so PO is direct reports', () => {
    expect(
      hierarchyTabDepth('po', { viewerIsAreaManager: true }),
    ).toBeUndefined();
    expect(hierarchyTabDepth('sk', { viewerIsAreaManager: true })).toBe(1);
  });
});

describe('resolveMemberDescendantSkCount', () => {
  it('prefers embedded member summary without requiring expand fetch', () => {
    expect(
      resolveMemberDescendantSkCount(
        member({
          summary: {
            total_users: 2,
            active_users: 2,
            non_active_users: 0,
            users_completed_module: 1,
            users_chatbot_engaged: 1,
          },
        }),
        undefined,
        0,
      ),
    ).toBe(2);
  });
});

describe('resolveMemberDescendantInactiveCount', () => {
  it('prefers embedded member summary for inactive SK count', () => {
    expect(
      resolveMemberDescendantInactiveCount(
        member({
          summary: {
            total_users: 2,
            active_users: 1,
            non_active_users: 1,
            users_completed_module: 1,
            users_chatbot_engaged: 0,
          },
        }),
        undefined,
        0,
      ),
    ).toBe(1);
  });
});
