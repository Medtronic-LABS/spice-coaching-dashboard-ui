import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TABLE_CELL_LABEL_MAX_LENGTH } from '@/constants/fieldLimits';
import type { AdminModulesListItem } from '@/features/modules/api/adminModulesApi';
import { truncateDisplayText } from '@/utils/truncateDisplayText';
import { NeedsReviewTab } from './NeedsReviewTab';

vi.mock('@/features/modules/api/adminModulesApi', async () => {
  const actual = await vi.importActual(
    '@/features/modules/api/adminModulesApi',
  );
  return {
    ...actual,
    useGetModuleDetailQuery: vi
      .fn()
      .mockImplementation((id: string, options?: { skip?: boolean }) => {
        if (options?.skip) {
          return { data: undefined, isLoading: false };
        }
        return {
          data: {
            id,
            title: 'Existing Module Title',
            lifecycle_status: 'published',
            card_count: 5,
            estimated_minutes: 10,
            created_at: '2026-01-01T00:00:00Z',
          },
          isLoading: false,
        };
      }),
  };
});

const mockModules: AdminModulesListItem[] = [
  {
    id: 'candidate-1',
    title: 'Candidate Module 1',
    category: 'Cardiology',
    lifecycle_status: 'review_pending',
    card_count: 3,
    quiz_count: 2,
    estimated_minutes: 15,
    created_at: '2026-08-01T10:00:00Z',
    merge_source_module_id: 'existing-1',
    search_metadata: { created_by: 'Dr. Jane Smith' },
  },
];

describe('NeedsReviewTab', () => {
  it('renders modules in a tabular format', () => {
    render(
      <NeedsReviewTab
        modules={mockModules}
        onMerge={vi.fn()}
        onSkip={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Module')).toBeInTheDocument();
    const titleButton = screen.getByRole('button', {
      name: 'Candidate Module 1',
    });
    expect(titleButton).toHaveClass('truncate');
    expect(titleButton.parentElement?.parentElement).not.toHaveAttribute(
      'tabIndex',
    );
    expect(screen.getAllByText('Review').length).toBeGreaterThan(0);
  });

  it('character-truncates long module titles and reveals the full title on hover', () => {
    const title = 'A'.repeat(TABLE_CELL_LABEL_MAX_LENGTH + 20);
    render(
      <NeedsReviewTab
        modules={[{ ...mockModules[0], title }]}
        onMerge={vi.fn()}
        onSkip={vi.fn()}
        onView={vi.fn()}
      />,
    );

    const displayTitle = truncateDisplayText(
      title,
      TABLE_CELL_LABEL_MAX_LENGTH,
    );
    const titleButton = screen.getByRole('button', { name: displayTitle });
    const trigger = titleButton.parentElement?.parentElement;
    expect(trigger).not.toBeNull();

    fireEvent.mouseEnter(trigger!);
    expect(screen.getByRole('tooltip')).toHaveTextContent(title);
  });

  it('toggles accordion row and shows comparison cards on click', async () => {
    render(
      <NeedsReviewTab
        modules={mockModules}
        onMerge={vi.fn()}
        onSkip={vi.fn()}
        onView={vi.fn()}
      />,
    );

    const expandButton = screen.getByLabelText('Expand comparison');
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Existing Module Title')).toBeInTheDocument();
    });
  });

  it('triggers merge and skip handlers when buttons are clicked', async () => {
    const handleMerge = vi.fn().mockResolvedValue(undefined);
    const handleSkip = vi.fn().mockResolvedValue(undefined);

    render(
      <NeedsReviewTab
        modules={mockModules}
        onMerge={handleMerge}
        onSkip={handleSkip}
        onView={vi.fn()}
      />,
    );

    const mergeButtons = screen.getAllByRole('button', { name: 'Merge' });
    fireEvent.click(mergeButtons[0]);

    await waitFor(() => {
      expect(handleMerge).toHaveBeenCalledWith('candidate-1');
    });

    const skipButtons = screen.getAllByRole('button', { name: 'Skip' });
    fireEvent.click(skipButtons[0]);

    await waitFor(() => {
      expect(handleSkip).toHaveBeenCalledWith('candidate-1');
    });
  });
});
