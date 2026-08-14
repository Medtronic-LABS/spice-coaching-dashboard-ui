import { describe, expect, it } from 'vitest';
import type { TeamActivityMember } from '@/features/admin-dashboard/types/dashboard.types';
import {
  resolveMemberDescendantInactiveCount,
  resolveMemberDescendantSkCount,
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
    ...partial,
  };
}

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

  it('falls back to descendant response when embedded summary is absent', () => {
    expect(
      resolveMemberDescendantSkCount(
        member({}),
        {
          total_users: 5,
          summary: {
            total_users: 5,
            active_users: 4,
            non_active_users: 1,
            users_completed_module: 3,
            users_chatbot_engaged: 2,
          },
        },
        3,
      ),
    ).toBe(5);
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
