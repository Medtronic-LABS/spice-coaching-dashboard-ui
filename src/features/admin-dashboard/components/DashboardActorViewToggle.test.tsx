import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardActorViewToggle } from '@/features/admin-dashboard/components/DashboardActorViewToggle';

describe('DashboardActorViewToggle', () => {
  it('renders SKs and POs options and reports selection changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DashboardActorViewToggle value="sk" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'SKs' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'POs' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'POs' }));
    expect(onChange).toHaveBeenCalledWith('po');
  });
});
