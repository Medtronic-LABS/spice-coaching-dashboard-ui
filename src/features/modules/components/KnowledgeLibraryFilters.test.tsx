import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KnowledgeLibraryFilters } from '@/features/modules/components/KnowledgeLibraryFilters';
import { KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS } from '@/features/modules/utils/knowledgeLibraryFilters';

describe('KnowledgeLibraryFilters', () => {
  it('disables Apply when a date range is invalid', () => {
    render(
      <KnowledgeLibraryFilters
        filters={{
          ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
          uploadedAtFrom: '2026-04-30',
          uploadedAtTo: '2026-04-01',
        }}
        uploaderOptions={[
          { label: 'Program Manager', value: 'Program Manager' },
        ]}
        onChange={vi.fn()}
        onClearAll={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    expect(
      screen.getByText('From date must be on or before to date.'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('forwards Clear All and Apply for valid filters', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    const onApply = vi.fn();

    render(
      <KnowledgeLibraryFilters
        filters={KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS}
        uploaderOptions={[
          { label: 'Program Manager', value: 'Program Manager' },
        ]}
        onChange={vi.fn()}
        onClearAll={onClearAll}
        onApply={onApply}
      />,
    );

    expect(screen.getByText('General')).toBeVisible();
    expect(screen.getByText('Date ranges')).toBeVisible();
    expect(screen.getByLabelText('Uploaded by')).toBeInTheDocument();
    expect(screen.getByLabelText('Assigned')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(onClearAll).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledTimes(1);
  });
});
