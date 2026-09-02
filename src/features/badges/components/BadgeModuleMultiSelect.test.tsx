import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TABLE_CELL_LABEL_MAX_LENGTH } from '@/constants/fieldLimits';
import { BadgeModuleMultiSelect } from '@/features/badges/components/BadgeModuleMultiSelect';
import { truncateDisplayText } from '@/utils/truncateDisplayText';

describe('BadgeModuleMultiSelect', () => {
  it('reveals the full published module name in a tooltip on hover', () => {
    const title =
      'Clinical module testing validates different areas of search and assignment';

    render(
      <BadgeModuleMultiSelect
        options={[{ id: 'm-clinic', title, domain: 'htn' }]}
        selectedIds={[]}
        onChange={vi.fn()}
        searchValue=""
        onSearchChange={vi.fn()}
      />,
    );

    const truncated = truncateDisplayText(title, TABLE_CELL_LABEL_MAX_LENGTH);
    const content = screen.getByText(truncated);
    const trigger = content.parentElement;
    expect(trigger).not.toBeNull();

    fireEvent.mouseEnter(trigger!);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent(title);
    expect(tooltip.className).toContain('z-[500]');
  });

  it('selects all currently loaded options', () => {
    const onChange = vi.fn();

    render(
      <BadgeModuleMultiSelect
        options={[
          { id: 'm-1', title: 'Module One', domain: 'htn' },
          { id: 'm-2', title: 'Module Two', domain: 'diabetes' },
        ]}
        selectedIds={['m-1']}
        onChange={onChange}
        searchValue=""
        onSearchChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select all loaded' }));
    expect(onChange).toHaveBeenCalledWith(['m-1', 'm-2']);
  });

  it('deselects all currently loaded options when all are selected', () => {
    const onChange = vi.fn();

    render(
      <BadgeModuleMultiSelect
        options={[
          { id: 'm-1', title: 'Module One', domain: 'htn' },
          { id: 'm-2', title: 'Module Two', domain: 'diabetes' },
        ]}
        selectedIds={['m-1', 'm-2', 'm-other']}
        onChange={onChange}
        searchValue=""
        onSearchChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Deselect all' }));
    expect(onChange).toHaveBeenCalledWith(['m-other']);
  });
});
