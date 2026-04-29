import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders the sidebar title and navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('SPICE • AI COACHING')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /dashboard/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /chw profiles/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /module library/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /quiz performance/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /leaderboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument();
    expect(screen.getByText(/rashida khanam/i)).toBeInTheDocument();
    expect(screen.getByText(/supervisor/i)).toBeInTheDocument();
    expect(screen.getByText('RK')).toBeInTheDocument();
    expect(screen.getByText('Bangladesh Pilot')).toBeInTheDocument();
    expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
    expect(screen.getByText('LEARNING')).toBeInTheDocument();
    expect(screen.getByText('MONITORING')).toBeInTheDocument();
  });

  it('applies active class to active link', () => {
    render(
      <MemoryRouter initialEntries={[paths.chwProfiles]}>
        <Sidebar />
      </MemoryRouter>,
    );

    const activeLink = screen.getByRole('link', { name: /chw profiles/i });
    expect(activeLink).toHaveClass(
      'bg-spice-bg-tint',
      'text-spice-brand-primary',
    );

    const inactiveLink = screen.getByRole('link', { name: /dashboard/i });
    expect(inactiveLink).toHaveClass('text-spice-text-medium');
  });
});
