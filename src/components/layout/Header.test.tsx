import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { Header } from './Header';

describe('Header', () => {
  it('renders the welcome message', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/subhodeep/i)).toBeInTheDocument();
  });

  it('renders the user menu control', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('button', { name: /user menu/i })).toBeVisible();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('renders language selector for supervisor role', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    const select = screen.getByRole('combobox', { name: /language/i });
    expect(select).toHaveValue('en');

    await user.selectOptions(select, 'bn');
    expect(select).toHaveValue('bn');
  });

  it('switches role in session storage and reloads home when the role button is clicked', async () => {
    const user = userEvent.setup();
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    window.sessionStorage.setItem('appRole', 'supervisor');
    renderWithProviders(<Header />);

    const roleSwitchButton = screen.getByRole('button', {
      name: (accessibleName) =>
        /program manager/i.test(accessibleName) ||
        accessibleName.includes('প্রোগ্রাম ম্যানেজার'),
    });
    await user.click(roleSwitchButton);

    expect(window.sessionStorage.getItem('appRole')).toBe('programManager');
    expect(assign).toHaveBeenCalledWith('/medtronics-ui/');
    vi.unstubAllGlobals();
  });
});
