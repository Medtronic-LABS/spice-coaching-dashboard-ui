import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReorderableList } from '@/features/module-library/components/ReorderableList';

function renderStringList(
  items: string[],
  onReorder: (fromIndex: number, toIndex: number) => void,
  disabled = false,
) {
  render(
    <ReorderableList
      items={items}
      getItemId={(item) => item}
      onReorder={onReorder}
      disabled={disabled}
      renderItem={(item, _index, controls) => (
        <div className="flex items-center gap-2">
          <button type="button" {...controls.dragHandleProps}>
            Drag
          </button>
          <span>{item}</span>
        </div>
      )}
    />,
  );
}

describe('ReorderableList', () => {
  it('renders items in order', () => {
    renderStringList(['A', 'B', 'C'], vi.fn());
    const labels = screen.getAllByText(/^[ABC]$/).map((el) => el.textContent);
    expect(labels).toEqual(['A', 'B', 'C']);
  });

  it('Move Down button calls onReorder(0, 1)', async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    renderStringList(['A', 'B', 'C'], onReorder);

    const moveDownButtons = screen.getAllByRole('button', {
      name: 'Move down',
    });
    await user.click(moveDownButtons[0]);

    expect(onReorder).toHaveBeenCalledWith(0, 1);
  });

  it('disables Move Up on first item and Move Down on last item', () => {
    renderStringList(['A', 'B', 'C'], vi.fn());

    const moveUpButtons = screen.getAllByRole('button', { name: 'Move up' });
    const moveDownButtons = screen.getAllByRole('button', {
      name: 'Move down',
    });

    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveDownButtons[2]).toBeDisabled();
    expect(moveUpButtons[1]).not.toBeDisabled();
    expect(moveDownButtons[0]).not.toBeDisabled();
  });

  it('disables move buttons when list is disabled', () => {
    renderStringList(['A', 'B'], vi.fn(), true);

    for (const button of screen.getAllByRole('button', {
      name: /Move (up|down)/,
    })) {
      expect(button).toBeDisabled();
    }
  });

  it('hides move buttons when readOnly is true', () => {
    render(
      <ReorderableList
        items={['A', 'B']}
        getItemId={(item) => item}
        onReorder={vi.fn()}
        readOnly
        renderItem={(item) => <span>{item}</span>}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Move up' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Move down' }),
    ).not.toBeInTheDocument();
  });
});
