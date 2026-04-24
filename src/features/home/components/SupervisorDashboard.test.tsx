import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SupervisorDashboard } from './SupervisorDashboard';
import type { UseSupervisorDashboardResult } from '@/features/home/hooks/useSupervisorDashboard';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/features/home/hooks/useSupervisorDashboard', () => ({
  useSupervisorDashboard: vi.fn(),
}));

const { useSupervisorDashboard } =
  await import('@/features/home/hooks/useSupervisorDashboard');

function mockResult(
  overrides: Partial<UseSupervisorDashboardResult>,
): UseSupervisorDashboardResult {
  return {
    summary: undefined,
    leaderboard: [],
    alerts: [],
    performance: [],
    modules: [],
    isLoading: false,
    isError: false,
    summaryState: { isLoading: false, isError: false },
    leaderboardState: { isLoading: false, isError: false },
    alertsState: { isLoading: false, isError: false },
    performanceState: { isLoading: false, isError: false },
    modulesState: { isLoading: false, isError: false },
    ...overrides,
  };
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <SupervisorDashboard />
    </MemoryRouter>,
  );
}

describe('SupervisorDashboard', () => {
  it('shows initial loading state', () => {
    (
      useSupervisorDashboard as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(mockResult({ isLoading: true }));
    renderDashboard();
    expect(
      screen.getByText(/loading supervisor dashboard/i),
    ).toBeInTheDocument();
  });

  it('shows all-error state when no cached data exists', () => {
    (
      useSupervisorDashboard as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(mockResult({ isError: true }));
    renderDashboard();
    expect(
      screen.getByText(/supervisor dashboard unavailable/i),
    ).toBeInTheDocument();
  });

  it('shows empty state when all sections are empty', () => {
    (
      useSupervisorDashboard as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(mockResult({}));
    renderDashboard();
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    expect(screen.getByText(/add chws/i)).toBeInTheDocument();
    expect(screen.getByText(/create module/i)).toBeInTheDocument();
  });

  it('renders dashboard header when some data exists', () => {
    (
      useSupervisorDashboard as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(
      mockResult({
        leaderboard: [
          {
            chw_id: 'c1',
            name: 'A',
            score: 10,
            rank: 1,
            completion_rate: 70,
            trend: 'flat',
          },
        ],
      }),
    );
    renderDashboard();
    expect(screen.getByText(/^dashboard$/i)).toBeInTheDocument();
    expect(screen.getByText(/top performance/i)).toBeInTheDocument();
  });

  it('renders per-section loading and error cards', () => {
    (
      useSupervisorDashboard as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(
      mockResult({
        summaryState: { isLoading: true, isError: false },
        leaderboardState: { isLoading: false, isError: true },
        performanceState: { isLoading: true, isError: false },
        alertsState: { isLoading: true, isError: false },
        modulesState: { isLoading: false, isError: true },
        leaderboard: [
          {
            chw_id: 'cached',
            name: 'C',
            score: 1,
            rank: 1,
            completion_rate: 1,
            trend: 'up',
          },
        ],
      }),
    );
    renderDashboard();
    expect(screen.getByText(/loading summary/i)).toBeInTheDocument();
    expect(
      screen.getByText(/top performance unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/loading chw matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/loading flags/i)).toBeInTheDocument();
    expect(
      screen.getByText(/module progress unavailable/i),
    ).toBeInTheDocument();
  });

  it('covers remaining per-section state branches', () => {
    (
      useSupervisorDashboard as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(
      mockResult({
        summaryState: { isLoading: false, isError: true },
        leaderboardState: { isLoading: true, isError: false },
        performanceState: { isLoading: false, isError: true },
        alertsState: { isLoading: false, isError: true },
        modulesState: { isLoading: true, isError: false },
        leaderboard: [
          {
            chw_id: 'cached',
            name: 'C',
            score: 1,
            rank: 1,
            completion_rate: 1,
            trend: 'up',
          },
        ],
      }),
    );

    renderDashboard();
    expect(screen.getByText(/summary unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
    expect(
      screen.getByText(/chw performance matrix unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/flags unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/loading modules/i)).toBeInTheDocument();
  });

  it('renders summary KPI section when summary is present', () => {
    (
      useSupervisorDashboard as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(
      mockResult({
        summary: {
          kpis: [
            {
              id: 'k1',
              title: 'Users',
              type: 'number',
              status: 'good',
              value: 1,
              unit: null,
            },
          ],
          insight: {
            type: 'info',
            title: 'Insight',
            description: 'Desc',
            recommended_action: 'Action',
            peak_engagement_time: '10:00',
            affected_chw_count: 1,
          },
        },
      }),
    );
    renderDashboard();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Insight')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
