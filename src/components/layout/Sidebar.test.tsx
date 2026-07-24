import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { Sidebar } from './Sidebar';

vi.mock('@/features/auth/services/authSession', () => ({
  getAuthSession: () => ({ role: 'SUPER_USER' }),
  getAuthDisplayName: () => 'Super User',
  getAuthInitials: () => 'SU',
}));

const defaultSidebarProps = {
  isMobileOpen: true,
  onMobileClose: vi.fn(),
};

describe('Sidebar', () => {
  it('renders brand, module library, and ingest navigation', () => {
    render(
      <MemoryRouter>
        <Sidebar {...defaultSidebarProps} />
      </MemoryRouter>,
    );

    expect(screen.getByText('SPICE • AI COACHING')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /^module library$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /upload document/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /upload video/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /ingestion history/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/super user/i)).toBeInTheDocument();
    expect(screen.getByText('SUPER_USER')).toBeInTheDocument();
    expect(screen.getByText('SU')).toBeInTheDocument();
    expect(screen.getByText('LEARNING')).toBeInTheDocument();
    expect(screen.getByText('ADMINISTRATION')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /configurations/i }),
    ).toBeInTheDocument();
  });

  it('applies active class to active link', () => {
    render(
      <MemoryRouter initialEntries={[paths.moduleLibrary]}>
        <Sidebar {...defaultSidebarProps} />
      </MemoryRouter>,
    );

    const activeLink = screen.getByRole('link', { name: /^module library$/i });
    expect(activeLink).toHaveClass(
      'bg-spice-brand-pm/20',
      'text-spice-text-onDark-hi',
    );
  });

  it.each([
    ['details', paths.adminModuleReviewDetails],
    ['lessons', paths.adminModuleReviewLessons],
    ['quiz', paths.adminModuleReviewQuiz],
    ['review', paths.adminModuleReviewPublish],
  ])('highlights Module Library during the %s step', (_step, routeTemplate) => {
    render(
      <MemoryRouter
        initialEntries={[routeTemplate.replace(':moduleId', 'module-1')]}
      >
        <Sidebar {...defaultSidebarProps} />
      </MemoryRouter>,
    );

    const modulesLink = screen.getByRole('link', { name: /^module library$/i });
    const ingestLink = screen.getByRole('link', { name: /upload document/i });
    const historyLink = screen.getByRole('link', {
      name: /ingestion history/i,
    });

    expect(modulesLink).toHaveClass(
      'bg-spice-brand-pm/20',
      'text-spice-text-onDark-hi',
    );
    expect(ingestLink).not.toHaveClass('bg-spice-brand-pm/20');
    expect(historyLink).not.toHaveClass('bg-spice-brand-pm/20');
  });

  it('highlights ingest history on the history route', () => {
    render(
      <MemoryRouter initialEntries={[paths.ingestHistory]}>
        <Sidebar {...defaultSidebarProps} />
      </MemoryRouter>,
    );

    const historyLink = screen.getByRole('link', {
      name: /ingestion history/i,
    });
    const ingestLink = screen.getByRole('link', { name: /upload document/i });

    expect(historyLink).toHaveClass(
      'bg-spice-brand-pm/20',
      'text-spice-text-onDark-hi',
    );
    expect(ingestLink).not.toHaveClass('bg-spice-brand-pm/20');
  });

  it('highlights upload document but not module library on the ingest route', () => {
    render(
      <MemoryRouter initialEntries={[paths.ingestDocument]}>
        <Sidebar {...defaultSidebarProps} />
      </MemoryRouter>,
    );

    const ingestLink = screen.getByRole('link', { name: /upload document/i });
    const modulesLink = screen.getByRole('link', { name: /^module library$/i });

    expect(ingestLink).toHaveClass(
      'bg-spice-brand-pm/20',
      'text-spice-text-onDark-hi',
    );
    expect(modulesLink).not.toHaveClass('bg-spice-brand-pm/20');
    expect(modulesLink).not.toHaveClass('text-spice-text-onDark-hi');
  });

  it('closes the mobile menu when a navigation link is clicked', async () => {
    const user = userEvent.setup();
    const onMobileClose = vi.fn();
    render(
      <MemoryRouter>
        <Sidebar isMobileOpen onMobileClose={onMobileClose} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('link', { name: /^module library$/i }));
    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });
});
