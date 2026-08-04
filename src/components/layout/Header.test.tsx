import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { Header } from './Header';

vi.mock('@/features/auth/services/authSession', () => ({
  getAuthSession: () => ({ role: 'SUPER_USER' }),
  getAuthDisplayName: () => 'Subhodeep User',
  getAuthInitials: () => 'SU',
}));

const defaultHeaderProps = {
  isSidebarOpen: false,
  onMenuToggle: vi.fn(),
};

describe('Header', () => {
  it('renders the UHIS logo and Coaching label in the header', () => {
    renderWithProviders(<Header {...defaultHeaderProps} />);
    expect(screen.getByRole('img', { name: 'UHIS' })).toBeInTheDocument();
    expect(screen.getByText('AI Coaching')).toBeInTheDocument();
  });

  it('renders the disabled profile control with user initials and hover name', () => {
    renderWithProviders(<Header {...defaultHeaderProps} />);
    const profileButton = screen.getByRole('button', {
      name: (accessibleName) =>
        /subhodeep user user menu/i.test(accessibleName) ||
        accessibleName.includes('সুভোদীপ'),
    });
    expect(profileButton).toBeDisabled();
    expect(profileButton).toHaveAttribute('title', 'Subhodeep User');
    expect(screen.getByText('SU')).toBeInTheDocument();
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
