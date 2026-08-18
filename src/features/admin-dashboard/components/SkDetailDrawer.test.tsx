import { skipToken } from '@reduxjs/toolkit/query/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkDetailDrawer } from '@/features/admin-dashboard/components/SkDetailDrawer';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import type { TeamActivityMember } from '@/features/admin-dashboard/types/dashboard.types';
import { renderWithProviders } from '@/test-utils/render';

const useFetchTeamMemberQuestionsQuery = vi.hoisted(() => vi.fn());

vi.mock('@/features/admin-dashboard/api/dashboardApi', () => ({
  useFetchTeamMemberQuestionsQuery: (
    ...args: Parameters<typeof useFetchTeamMemberQuestionsQuery>
  ) => useFetchTeamMemberQuestionsQuery(...args),
}));

const sk: TeamActivityMember = {
  user_id: 42,
  name: 'Rokeya Akter',
  role: 'SK',
  can_drill_down: false,
  is_active: true,
  is_chatbot_engaged: true,
  last_chat_at: '2026-08-07T09:00:00.000Z',
  last_active_at: null,
  has_completed_module_in_range: false,
  assigned_modules: [
    {
      module_id: 'm1',
      title: { en: 'Pregnancy Danger Signs' },
      completed_in_range: false,
      completed_at: null,
    },
    {
      module_id: 'm2',
      title: { en: 'ANC Visit Protocols' },
      completed_in_range: true,
      completed_at: '2026-08-01T00:00:00.000Z',
    },
  ],
  chatbot_query_count: 1,
  chatbot_unattributed_query_count: 0,
  chatbot_modules: [],
  refreshers_generated: 0,
  refreshers_completed: 0,
};

function questionsQuery(
  partial: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    data: {
      questions: [
        {
          question: 'Danger Signs in Pregnancy',
          occurrence_count: 1,
          last_asked_at: '2026-08-07T09:00:00.000Z',
        },
      ],
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
    ...partial,
  };
}

function renderDrawer(member: TeamActivityMember | null, onClose = vi.fn()) {
  return renderWithProviders(
    <SkDetailDrawer
      member={member}
      fromDate="2026-01-01"
      toDate="2026-08-15"
      geography={{
        ...EMPTY_DASHBOARD_GEOGRAPHY,
        divisionId: '1',
      }}
      onClose={onClose}
    />,
  );
}

describe('SkDetailDrawer', () => {
  beforeEach(() => {
    useFetchTeamMemberQuestionsQuery.mockReturnValue(questionsQuery());
  });

  it('skips questions fetch while closed', () => {
    renderDrawer(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useFetchTeamMemberQuestionsQuery).toHaveBeenCalledWith(skipToken);
  });

  it('renders SK profile, module states, and top queries', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderDrawer(sk, onClose);

    expect(screen.getByRole('dialog', { name: 'My SK' })).toBeInTheDocument();
    expect(screen.getByText('Rokeya Akter')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('Pregnancy Danger Signs')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Modules' })).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('ANC Visit Protocols')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Last chatbot use')).toBeInTheDocument();
    expect(screen.getByText('Last module')).toBeInTheDocument();
    expect(screen.getByText('Danger Signs in Pregnancy')).toBeInTheDocument();
    expect(useFetchTeamMemberQuestionsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        from_date: '2026-01-01',
        to_date: '2026-08-15',
        division_id: 1,
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Close SK detail' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an empty modules message when none are assigned', () => {
    renderDrawer({ ...sk, assigned_modules: [] });

    expect(
      screen.getByText('No assigned modules in this range.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Modules' }),
    ).not.toBeInTheDocument();
  });

  it('shows an empty queries state when the API returns none', () => {
    useFetchTeamMemberQuestionsQuery.mockReturnValue(
      questionsQuery({ data: { questions: [] } }),
    );

    renderDrawer(sk);

    expect(screen.getByText('No queries')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This SK has no chatbot questions in the selected date range.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a compact error and retries the questions query', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    useFetchTeamMemberQuestionsQuery.mockReturnValue(
      questionsQuery({
        data: undefined,
        isError: true,
        refetch,
      }),
    );

    renderDrawer(sk);

    expect(screen.getByText("Couldn't load this section")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
