import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamHierarchySection } from '@/features/admin-dashboard/components/TeamHierarchySection';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import type { TeamActivityMember } from '@/features/admin-dashboard/types/dashboard.types';
import { renderWithProviders } from '@/test-utils/render';

const useFetchTeamActivityQuery = vi.hoisted(() => vi.fn());
const getAuthSession = vi.hoisted(() => vi.fn(() => null));

vi.mock('@/features/admin-dashboard/api/dashboardApi', () => ({
  useFetchTeamActivityQuery: (
    ...args: Parameters<typeof useFetchTeamActivityQuery>
  ) => useFetchTeamActivityQuery(...args),
}));

vi.mock('@/features/admin-dashboard/components/SkDetailDrawer', () => ({
  SkDetailDrawer: ({ member }: { member: { name: string } | null }) =>
    member ? <div>{`SK drawer ${member.name}`}</div> : null,
}));

vi.mock('@/features/auth/services/authSession', () => ({
  getAuthSession: () => getAuthSession(),
}));

function idleQuery(members: TeamActivityMember[]) {
  return {
    data: { members },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  };
}

function member(
  partial: Partial<TeamActivityMember> &
    Pick<TeamActivityMember, 'user_id' | 'name' | 'role'>,
): TeamActivityMember {
  return {
    can_drill_down: partial.role !== 'SK',
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

const areaManager = member({
  user_id: 1,
  name: 'Rina Area Manager',
  role: 'AREA_MANAGER',
  can_drill_down: true,
});

const sk = member({
  user_id: 42,
  name: 'Rokeya Akter',
  role: 'SK',
  can_drill_down: false,
  assigned_modules: [
    {
      module_id: 'm1',
      title: { en: 'Pregnancy Danger Signs' },
      completed_in_range: false,
      completed_at: null,
    },
  ],
  chatbot_query_count: 1,
});

describe('TeamHierarchySection', () => {
  beforeEach(() => {
    getAuthSession.mockReturnValue(null);
    useFetchTeamActivityQuery.mockImplementation(
      (args: { depth?: number; user_id?: number }) => {
        if (args.user_id != null) return idleQuery([sk]);
        if (args.depth === 2) return idleQuery([sk]);
        return idleQuery([areaManager]);
      },
    );
  });

  it('refetches team activity with date and geography params', () => {
    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={{
          ...EMPTY_DASHBOARD_GEOGRAPHY,
          divisionId: '1',
          districtId: '10',
        }}
        status="all"
        sortKey="default"
        onSortChange={vi.fn()}
      />,
    );

    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.not.objectContaining({ depth: undefined }),
    );
    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        from_date: '2026-01-01',
        to_date: '2026-01-31',
        division_id: 1,
        district_id: 10,
        limit: 20,
        offset: 0,
      }),
    );
    expect(screen.getByText('Non-Responsive')).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Most Non-Responsive SKs' }),
    ).toBeInTheDocument();
  });

  it('hides Area Managers tab when logged in as Area Manager', () => {
    getAuthSession.mockReturnValue({ role: 'AREA_MANAGER' });

    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        status="all"
        sortKey="default"
        onSortChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('tab', { name: 'Area Managers' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Program Organizers' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'SKs' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Program Organizers' }),
    ).toHaveAttribute('aria-selected', 'true');
    // AM viewers: PO tab is direct reports (no depth). depth=1 would be SKs.
    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.not.objectContaining({ depth: expect.any(Number) }),
    );
  });

  it('keeps AM names non-clickable and opens the SK drawer from a nested child', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        status="all"
        sortKey="default"
        onSortChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /Rina Area Manager/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/SK drawer/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View POs' }));

    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 1 }),
      expect.objectContaining({ skip: false }),
    );
    expect(screen.getByText('Rokeya Akter')).toBeInTheDocument();
    expect(screen.queryByText(/SK drawer/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Rokeya Akter/i }));
    expect(screen.getByText('SK drawer Rokeya Akter')).toBeInTheDocument();
  });

  it('opens the SK drawer when an SK row is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        status="all"
        sortKey="default"
        onSortChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'SKs' }));
    await user.click(screen.getByRole('button', { name: /Rokeya Akter/i }));

    expect(screen.getByText('SK drawer Rokeya Akter')).toBeInTheDocument();
  });
});
