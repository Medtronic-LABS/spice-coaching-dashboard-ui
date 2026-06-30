import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SupervisorDashboard } from './SupervisorDashboard';
import type { UseSupervisorDashboardResult } from '@/features/home/hooks/useSupervisorDashboard';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/home/components/LeaderboardCard', () => ({
  LeaderboardCard: (props: {
    items: Array<{ chw_id: string; name: string }>;
    onViewAll?: () => void;
    onRowClick?: (item: { chw_id: string; name: string }) => void;
  }) => (
    <div>
      <button type="button" onClick={props.onViewAll}>
        Leaderboard view all
      </button>
      <button type="button" onClick={() => props.onRowClick?.(props.items[0])}>
        Leaderboard row
      </button>
    </div>
  ),
}));

vi.mock('@/features/home/components/PerformanceMatrix', () => ({
  PerformanceMatrix: (props: {
    rows: Array<{ chw_id: string }>;
    onRowClick?: (row: { chw_id: string }) => void;
  }) => (
    <div>
      <button type="button" onClick={() => props.onRowClick?.(props.rows[0])}>
        Performance row
      </button>
    </div>
  ),
}));

vi.mock('@/features/home/components/FlagsCard', () => ({
  FlagsCard: (props: {
    items: Array<{ chw_id: string }>;
    onPrimaryAction: () => void;
    onAssignModule?: (item: { chw_id: string }) => void;
    onViewProfile?: (item: { chw_id: string }) => void;
  }) => (
    <div>
      <button type="button" onClick={props.onPrimaryAction}>
        Flags view all
      </button>
      <button
        type="button"
        onClick={() => props.onAssignModule?.(props.items[0])}
      >
        Flags assign
      </button>
      <button
        type="button"
        onClick={() => props.onViewProfile?.(props.items[0])}
      >
        Flags profile
      </button>
    </div>
  ),
}));

vi.mock('@/features/home/components/ModuleProgressCard', () => ({
  ModuleProgressCard: (props: { onNew?: () => void }) => (
    <div>
      <button type="button" onClick={props.onNew}>
        Modules new
      </button>
    </div>
  ),
}));

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
  mockNavigate.mockReset();
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
    expect(
      screen.getByRole('button', { name: /leaderboard view all/i }),
    ).toBeInTheDocument();
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

  it('invokes navigation handlers from action buttons and rows', () => {
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
        performance: [
          {
            chw_id: 'p1',
            name: 'P',
            assigned: 1,
            completed: 1,
            completion_rate: 100,
            status: 'good',
          },
        ],
        alerts: [
          {
            chw_id: 'f1',
            name: 'F',
            flag_type: 'inactive',
            severity: 'high',
          },
        ],
        modules: [
          {
            module_id: 'm1',
            title: 'Module',
            assigned: 1,
            completed: 0,
            completion_rate: 0,
          },
        ],
      }),
    );

    renderDashboard();

    // Header buttons
    screen.getByRole('button', { name: /export/i }).click();
    screen.getByRole('button', { name: /assign module/i }).click();

    // Section callbacks (via mocked child components)
    screen.getByRole('button', { name: /leaderboard view all/i }).click();
    screen.getByRole('button', { name: /leaderboard row/i }).click();
    screen.getByRole('button', { name: /performance row/i }).click();
    screen.getByRole('button', { name: /flags view all/i }).click();
    screen.getByRole('button', { name: /flags assign/i }).click();
    screen.getByRole('button', { name: /flags profile/i }).click();
    screen.getByRole('button', { name: /modules new/i }).click();

    expect(mockNavigate).toHaveBeenCalled();
  });
});
