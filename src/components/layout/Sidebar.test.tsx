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

    expect(
      screen.getByText('Micro Learning Analytics Dashboard'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /chw profiles/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /ui preview/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /chart preview/i }),
    ).toBeInTheDocument();
  });

  it('applies active class to active link', () => {
    render(
      <MemoryRouter initialEntries={[paths.chwProfiles]}>
        <Sidebar />
      </MemoryRouter>,
    );

    const activeLink = screen.getByRole('link', { name: /chw profiles/i });
    expect(activeLink).toHaveClass('bg-blue-600', 'text-white');

    const inactiveLink = screen.getByRole('link', { name: /home/i });
    expect(inactiveLink).toHaveClass('text-slate-700');
  });
});
