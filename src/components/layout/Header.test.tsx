import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { setCurrentRole } from '@/constants/role';
import { renderWithProviders } from '@/test-utils/render';
import { Header } from './Header';

const defaultHeaderProps = {
  isSidebarOpen: false,
  onMenuToggle: vi.fn(),
};

describe('Header', () => {
  it('renders the welcome message from the auth session', () => {
    renderWithProviders(<Header {...defaultHeaderProps} />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/subhodeep user/i)).toBeInTheDocument();
  });

  it('renders the disabled profile control with user initials', () => {
    renderWithProviders(<Header {...defaultHeaderProps} />);
    expect(
      screen.getByRole('button', {
        name: (accessibleName) =>
          /user menu/i.test(accessibleName) ||
          accessibleName.includes('ইউজার মেনু'),
      }),
    ).toBeDisabled();
    expect(screen.getByText('SU')).toBeInTheDocument();
  });

  it('renders language selector for supervisor role', async () => {
    setCurrentRole('supervisor');
    const user = userEvent.setup();
    renderWithProviders(<Header {...defaultHeaderProps} />);

    const select = screen.getByRole('combobox', { name: /language/i });
    expect(select).toHaveValue('en');

    await user.selectOptions(select, 'bn');
    expect(select).toHaveValue('bn');
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
