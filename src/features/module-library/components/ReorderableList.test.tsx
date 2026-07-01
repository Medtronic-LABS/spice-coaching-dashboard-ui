import { render, screen } from '@testing-library/react';
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

  it('renders a drag handle for each item', () => {
    renderStringList(['A', 'B', 'C'], vi.fn());

    expect(
      screen.getAllByRole('button', { name: 'Drag to reorder' }),
    ).toHaveLength(3);
  });

  it('disables drag handles when list is disabled', () => {
    renderStringList(['A', 'B'], vi.fn(), true);

    for (const button of screen.getAllByRole('button', {
      name: 'Drag to reorder',
    })) {
      expect(button).toHaveClass('pointer-events-none');
    }
  });

  it('hides drag handles when readOnly is true', () => {
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
      screen.queryByRole('button', { name: 'Drag to reorder' }),
    ).not.toBeInTheDocument();
  });
});
