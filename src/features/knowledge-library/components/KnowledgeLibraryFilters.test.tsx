import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KnowledgeLibraryFilters } from '@/features/knowledge-library/components/KnowledgeLibraryFilters';
import { KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS } from '@/features/knowledge-library/utils/knowledgeLibraryFilters';

const defaultFilterProps = {
  uploaderOptions: [{ value: 'alice', label: 'alice' }],
  uploaderSearch: '',
  onUploaderSearchChange: vi.fn(),
};

describe('KnowledgeLibraryFilters', () => {
  it('disables Apply when a date range is invalid', () => {
    render(
      <KnowledgeLibraryFilters
        filters={{
          ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
          uploadedAtFrom: '2026-04-30',
          uploadedAtTo: '2026-04-01',
        }}
        onChange={vi.fn()}
        onClearAll={vi.fn()}
        onApply={vi.fn()}
        {...defaultFilterProps}
      />,
    );

    expect(
      screen.getByText('From date must be on or before to date.'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('disables Apply when the To date is in the future', () => {
    render(
      <KnowledgeLibraryFilters
        filters={{
          ...KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS,
          uploadedAtFrom: '2026-04-01',
          uploadedAtTo: '2099-01-01',
        }}
        onChange={vi.fn()}
        onClearAll={vi.fn()}
        onApply={vi.fn()}
        {...defaultFilterProps}
      />,
    );

    expect(screen.getByText('To date cannot be in the future.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('forwards Clear All and Apply for valid filters', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    const onApply = vi.fn();

    render(
      <KnowledgeLibraryFilters
        filters={KNOWLEDGE_LIBRARY_DRAWER_FILTER_DEFAULTS}
        onChange={vi.fn()}
        onClearAll={onClearAll}
        onApply={onApply}
        {...defaultFilterProps}
      />,
    );

    expect(screen.getByText('Date ranges')).toBeVisible();
    expect(screen.getByLabelText('Uploaded by')).toBeInTheDocument();
    expect(screen.getByLabelText('Assigned')).toBeInTheDocument();
    expect(screen.getByLabelText('Ingested')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(onClearAll).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledTimes(1);
  });
});
