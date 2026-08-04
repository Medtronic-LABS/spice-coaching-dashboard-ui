import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    render(
      <Drawer open={false} labelledBy="drawer-title">
        <h2 id="drawer-title">Filters</h2>
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a dialog and closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Drawer open labelledBy="drawer-title" onClose={onClose}>
        <h2 id="drawer-title">Filters</h2>
        <p>Body</p>
      </Drawer>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays mounted briefly while closing for exit animation', async () => {
    const user = userEvent.setup();

    const Example = () => {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
          <Drawer open={open} labelledBy="drawer-title">
            <h2 id="drawer-title">Filters</h2>
            <p>Body</p>
          </Drawer>
        </>
      );
    };

    render(<Example />);
    const dialog = screen.getByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass('translate-x-full');
  });
});
