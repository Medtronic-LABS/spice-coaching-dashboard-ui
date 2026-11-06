import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AssignToModeField } from './AssignToModeField';

describe('AssignToModeField', () => {
  it('checks All SKs when assignToAll is true', () => {
    render(<AssignToModeField assignToAll onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /all sks/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /specific/i })).not.toBeChecked();
  });

  it('checks Specific when assignToAll is false', () => {
    render(<AssignToModeField assignToAll={false} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /specific/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /all sks/i })).not.toBeChecked();
  });

  it('reports the new mode through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssignToModeField assignToAll onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /specific/i }));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('shows a custom hint under Specific', () => {
    render(
      <AssignToModeField
        assignToAll
        onChange={vi.fn()}
        specificHint="Pick people after upload."
      />,
    );

    expect(screen.getByText('Pick people after upload.')).toBeInTheDocument();
  });

  it('disables both options when disabled', () => {
    render(<AssignToModeField assignToAll onChange={vi.fn()} disabled />);

    expect(screen.getByRole('radio', { name: /all sks/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /specific/i })).toBeDisabled();
  });
});
