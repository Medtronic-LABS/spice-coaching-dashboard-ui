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
});
