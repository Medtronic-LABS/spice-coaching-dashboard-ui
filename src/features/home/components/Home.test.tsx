import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Home } from '@/features/home/components/Home';

type HomeStatusResult = { data: unknown; isLoading: boolean; isError: boolean };

const mockUseGetHomeStatusQuery = vi.hoisted(() => {
  return vi.fn(
    () =>
      ({ data: null, isLoading: false, isError: false }) as HomeStatusResult,
  );
});

vi.mock('@/components/common/charts', async () => {
  return {
    BarChart: ({ ariaLabel }: { ariaLabel: string }) => (
      <div aria-label={ariaLabel}>BarChart</div>
    ),
    LineChart: ({ ariaLabel }: { ariaLabel: string }) => (
      <div aria-label={ariaLabel}>LineChart</div>
    ),
    PieChart: ({ ariaLabel }: { ariaLabel: string }) => (
      <div aria-label={ariaLabel}>PieChart</div>
    ),
  };
});

vi.mock('@/features/home/api/homeApi', () => ({
  useGetHomeStatusQuery: () => mockUseGetHomeStatusQuery(),
}));

describe('Home', () => {
  it('renders dashboard heading and default content', () => {
    mockUseGetHomeStatusQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    render(<Home />);

    expect(
      screen.getByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Micro Learning Analytics Dashboard/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'API Connection Status:' }),
    ).toBeInTheDocument();
  });

  it('shows loading state when API is loading', () => {
    mockUseGetHomeStatusQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(<Home />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when API fails', () => {
    mockUseGetHomeStatusQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(<Home />);
    expect(screen.getByText('Request failed')).toBeInTheDocument();
  });

  it('renders API data when available', () => {
    mockUseGetHomeStatusQuery.mockReturnValue({
      data: { ok: true },
      isLoading: false,
      isError: false,
    });

    render(<Home />);
    expect(screen.getByText(/"ok": true/)).toBeInTheDocument();
  });
});
