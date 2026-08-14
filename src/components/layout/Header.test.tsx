import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { Header } from './Header';

const logoutMock = vi.fn();

vi.mock('@/config/authConfig', () => ({
  isLoginEnabled: () => true,
}));

vi.mock('@/features/auth/services/authSession', () => ({
  getAuthSession: () => ({
    tenantId: '2',
    userId: '1',
    email: 'superuser@test.com',
    firstName: 'Subhodeep',
    lastName: 'User',
    role: 'SUPER_USER',
  }),
  getAuthDisplayName: () => 'Subhodeep User',
  getAuthInitials: () => 'SU',
  logout: () => logoutMock(),
}));

const defaultHeaderProps = {
  isSidebarOpen: false,
  onMenuToggle: vi.fn(),
};

describe('Header', () => {
  it('renders the UHIS logo and Coaching label in the header', () => {
    renderWithProviders(<Header {...defaultHeaderProps} />);
    const logo = screen.getByRole('img', { name: 'UHIS' });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('draggable', 'false');
    expect(screen.getByText('AI Coaching')).toBeInTheDocument();
  });

  it('renders a logout control when login is enabled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header {...defaultHeaderProps} />);
    await user.click(screen.getByRole('button', { name: /log out/i }));
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('does not render a language selector', () => {
    renderWithProviders(<Header {...defaultHeaderProps} />);
    expect(screen.queryByRole('combobox', { name: /language/i })).toBeNull();
  });

  it('toggles the mobile navigation menu', async () => {
    const user = userEvent.setup();
    const onMenuToggle = vi.fn();
    renderWithProviders(
      <Header isSidebarOpen={false} onMenuToggle={onMenuToggle} />,
    );

    await user.click(
      screen.getByRole('button', {
        name: (accessibleName) =>
          /open navigation menu/i.test(accessibleName) ||
          accessibleName.includes('নেভিগেশন মেনু খুলুন'),
      }),
    );
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });
});
