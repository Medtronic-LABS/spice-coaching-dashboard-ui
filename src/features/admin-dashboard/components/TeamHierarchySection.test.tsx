import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamHierarchySection } from '@/features/admin-dashboard/components/TeamHierarchySection';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import type { TeamActivityMember } from '@/features/admin-dashboard/types/dashboard.types';
import type { AuthUser } from '@/features/auth/types/auth.types';
import { renderWithProviders } from '@/test-utils/render';

const useFetchTeamActivityQuery = vi.hoisted(() => vi.fn());
const getAuthSession = vi.hoisted(() =>
  vi.fn<() => Pick<AuthUser, 'role'> | null>(() => null),
);

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
  const data = {
    members,
    total_members: members.length,
    offset: 0,
  };
  return {
    data,
    currentData: data,
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
    performance_status: 'on_track',
    ...partial,
  };
}

function metricText(
  expected: string,
): (_: string, el: Element | null) => boolean {
  return (_content, el) =>
    Boolean(
      el?.classList.contains('tabular-nums') &&
      el.textContent?.replace(/\s+/g, ' ').trim() === expected,
    );
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
    useFetchTeamActivityQuery.mockReset();
    useFetchTeamActivityQuery.mockImplementation(
      (args: { depth?: number; user_id?: number }) => {
        if (args.user_id != null) return idleQuery([sk]);
        if (args.depth === 2) return idleQuery([sk]);
        return idleQuery([areaManager]);
      },
    );
  });

  it('refetches team activity with date and geography params', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={{
          ...EMPTY_DASHBOARD_GEOGRAPHY,
          divisionId: '1',
          districtId: '10',
        }}
        sortKey="name"
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
        sort_by: 'name',
        sort_dir: 'asc',
      }),
    );
    expect(screen.getByText('Non-Responsive')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Name (A–Z)' }));
    expect(
      screen.getByRole('option', { name: 'Needs Most Attention' }),
    ).toBeInTheDocument();
  });

  it('hides Area Managers tab when logged in as Area Manager', () => {
    getAuthSession.mockReturnValue({ role: 'AREA_MANAGER' });

    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        sortKey="name"
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
        sortKey="name"
        onSortChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /Rina Area Manager/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/SK drawer/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View POs' }));

    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 1,
        sort_by: 'name',
        sort_dir: 'asc',
      }),
      expect.objectContaining({ skip: false }),
    );
    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.not.objectContaining({ q: expect.anything() }),
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
        sortKey="name"
        onSortChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'SKs' }));
    await user.click(screen.getByRole('button', { name: /Rokeya Akter/i }));

    expect(screen.getByText('SK drawer Rokeya Akter')).toBeInTheDocument();
  });

  it('sends name search q after debounce', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        sortKey="name"
        onSortChange={vi.fn()}
      />,
    );

    await user.type(
      screen.getByPlaceholderText(/search area managers/i),
      'Rina',
    );

    await waitFor(
      () => {
        expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
          expect.objectContaining({ q: 'Rina' }),
        );
      },
      { timeout: 1500 },
    );
  });

  it('sends backend sort params for lowest completion', () => {
    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        sortKey="lowest_completion"
        onSortChange={vi.fn()}
      />,
    );

    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sort_by: 'module_completion',
        sort_dir: 'asc',
      }),
    );
  });

  it('sends backend sort params for lowest chatbot', () => {
    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        sortKey="lowest_chatbot"
        onSortChange={vi.fn()}
      />,
    );

    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sort_by: 'chatbot_engagement',
        sort_dir: 'asc',
      }),
    );
  });

  it('sends backend sort params for at-risk first', () => {
    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        sortKey="at_risk_first"
        onSortChange={vi.fn()}
      />,
    );

    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sort_by: 'performance_status',
        sort_dir: 'asc',
      }),
    );
  });

  it('shows at-risk badge from performance_status even when the member is active', async () => {
    const user = userEvent.setup();
    const atRiskSk = member({
      user_id: 42,
      name: 'Rokeya Akter',
      role: 'SK',
      can_drill_down: false,
      is_active: true,
      performance_status: 'at_risk',
    });
    useFetchTeamActivityQuery.mockImplementation(
      (args: { depth?: number; user_id?: number }) => {
        if (args.depth === 2) {
          return idleQuery([atRiskSk]);
        }
        return idleQuery([areaManager]);
      },
    );

    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        sortKey="name"
        onSortChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'SKs' }));
    expect(screen.getByText('At risk')).toBeInTheDocument();
  });

  it('shows on-track badge from performance_status even when the member is inactive', () => {
    const inactiveOnTrackAm = member({
      user_id: 1,
      name: 'Rina Area Manager',
      role: 'AREA_MANAGER',
      can_drill_down: true,
      is_active: false,
      performance_status: 'on_track',
    });
    useFetchTeamActivityQuery.mockImplementation(() =>
      idleQuery([inactiveOnTrackAm]),
    );

    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        sortKey="name"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByText('On track')).toBeInTheDocument();
  });

  it('omits q for whitespace-only search', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        sortKey="name"
        onSortChange={vi.fn()}
      />,
    );

    await user.type(
      screen.getByPlaceholderText(/search area managers/i),
      '   ',
    );

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
    });
    expect(useFetchTeamActivityQuery).not.toHaveBeenCalledWith(
      expect.objectContaining({ q: expect.anything() }),
    );
  });

  it('refreshes SK metrics when the same user_ids return updated activity after a date change', async () => {
    const user = userEvent.setup();
    const engagedSk = member({
      user_id: 427,
      name: 'Zulfikur Rehman',
      role: 'SK',
      can_drill_down: false,
      is_chatbot_engaged: true,
      chatbot_query_count: 3,
      assigned_modules: [
        {
          module_id: 'm1',
          title: { en: 'Module A' },
          completed_in_range: false,
          completed_at: null,
        },
      ],
    });
    const idleSk = member({
      user_id: 427,
      name: 'Zulfikur Rehman',
      role: 'SK',
      can_drill_down: false,
      is_chatbot_engaged: false,
      chatbot_query_count: 0,
      assigned_modules: [],
    });

    useFetchTeamActivityQuery.mockImplementation(
      (args: { from_date?: string; depth?: number; user_id?: number }) => {
        const skForRange = args.from_date === '2026-08-01' ? idleSk : engagedSk;
        if (args.user_id != null) return idleQuery([skForRange]);
        if (args.depth === 2) return idleQuery([skForRange]);
        return idleQuery([areaManager]);
      },
    );

    function DateRangeHarness() {
      const [fromDate, setFromDate] = useState('2026-08-21');
      const [toDate, setToDate] = useState('2026-08-21');
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setFromDate('2026-08-01');
              setToDate('2026-08-01');
            }}
          >
            Apply Aug 1
          </button>
          <TeamHierarchySection
            fromDate={fromDate}
            toDate={toDate}
            geography={EMPTY_DASHBOARD_GEOGRAPHY}
            sortKey="name"
            onSortChange={vi.fn()}
          />
        </>
      );
    }

    renderWithProviders(<DateRangeHarness />);

    await user.click(screen.getByRole('tab', { name: 'SKs' }));
    expect(screen.getByText('Zulfikur Rehman')).toBeInTheDocument();
    expect(screen.getByText(metricText('3 Queries'))).toBeInTheDocument();
    expect(screen.getByText(/0\/1/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply Aug 1' }));

    await waitFor(() => {
      expect(screen.getByText(metricText('0 Queries'))).toBeInTheDocument();
    });
    expect(screen.getByText(/0\/0/)).toBeInTheDocument();
    expect(screen.queryByText(metricText('3 Queries'))).not.toBeInTheDocument();
  });

  it('refreshes nested descendant SK metrics after a date change', async () => {
    const user = userEvent.setup();
    const engagedSk = member({
      user_id: 427,
      name: 'Zulfikur Rehman',
      role: 'SK',
      can_drill_down: false,
      chatbot_query_count: 3,
    });
    const idleSk = member({
      user_id: 427,
      name: 'Zulfikur Rehman',
      role: 'SK',
      can_drill_down: false,
      chatbot_query_count: 0,
    });

    useFetchTeamActivityQuery.mockImplementation(
      (args: { from_date?: string; depth?: number; user_id?: number }) => {
        const skForRange = args.from_date === '2026-08-01' ? idleSk : engagedSk;
        if (args.user_id != null) return idleQuery([skForRange]);
        if (args.depth === 2) return idleQuery([skForRange]);
        return idleQuery([areaManager]);
      },
    );

    function DateRangeHarness() {
      const [fromDate, setFromDate] = useState('2026-08-21');
      const [toDate, setToDate] = useState('2026-08-21');
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setFromDate('2026-08-01');
              setToDate('2026-08-01');
            }}
          >
            Apply Aug 1
          </button>
          <TeamHierarchySection
            fromDate={fromDate}
            toDate={toDate}
            geography={EMPTY_DASHBOARD_GEOGRAPHY}
            sortKey="name"
            onSortChange={vi.fn()}
          />
        </>
      );
    }

    renderWithProviders(<DateRangeHarness />);

    await user.click(screen.getByRole('button', { name: 'View POs' }));
    expect(screen.getByText('Zulfikur Rehman')).toBeInTheDocument();
    expect(screen.getByText(metricText('3 Queries'))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply Aug 1' }));

    await waitFor(() => {
      expect(screen.getByText(metricText('0 Queries'))).toBeInTheDocument();
    });
    expect(screen.queryByText(metricText('3 Queries'))).not.toBeInTheDocument();
  });
});
