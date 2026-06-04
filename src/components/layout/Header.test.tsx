import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  it('renders the welcome message', () => {
    render(<Header />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/subhodeep/i)).toBeInTheDocument();
  });

  it('renders the user menu control', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /user menu/i })).toBeVisible();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('renders language selector for supervisor role', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const select = screen.getByRole('combobox', { name: /language/i });
    expect(select).toHaveValue('en');

    await user.selectOptions(select, 'bn');
    expect(select).toHaveValue('bn');
  });
});
