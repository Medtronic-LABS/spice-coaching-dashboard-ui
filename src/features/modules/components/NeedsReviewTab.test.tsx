import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithSnackbar } from '@/test-utils/render';
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
        if (id === 'merge-secondary-1') {
          return {
            data: {
              id,
              title: 'Merged Module Title',
              lifecycle_status: 'draft',
              card_count: 6,
              estimated_minutes: 20,
              created_at: '2026-08-02T00:00:00Z',
            },
            isLoading: false,
          };
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

const existingPublishedModule: AdminModulesListItem = {
  ...mockModules[0],
  id: 'existing-2',
  title: 'Existing Published Module',
  lifecycle_status: 'published',
  card_count: 4,
  quiz_count: 1,
  estimated_minutes: 12,
  created_at: '2026-01-01T00:00:00Z',
  created_by: { id: 1, name: 'test user' },
  published_by: { id: 1, name: 'test user' },
  merge_source_module_id: null,
  search_metadata: null,
};

const mockModulesWithActorRefs: AdminModulesListItem[] = [
  {
    ...mockModules[0],
    id: 'candidate-2',
    title: 'Candidate Module 2',
    created_by: { id: 1, name: 'test user' },
    published_by: { id: 1, name: 'test user' },
    merge_source_module_id: 'existing-2',
    merge_source_module: existingPublishedModule,
    search_metadata: null,
  },
];

describe('NeedsReviewTab', () => {
  it('renders modules in a tabular format', () => {
    renderWithSnackbar(
      <NeedsReviewTab
        modules={mockModules}
        onMerge={vi.fn()}
        onDiscardNew={vi.fn()}
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
    expect(screen.getByText('By Dr. Jane Smith')).toBeInTheDocument();
  });

  it('character-truncates long module titles and reveals the full title on hover', () => {
    const title = 'A'.repeat(TABLE_CELL_LABEL_MAX_LENGTH + 20);
    renderWithSnackbar(
      <NeedsReviewTab
        modules={[{ ...mockModules[0], title }]}
        onMerge={vi.fn()}
        onDiscardNew={vi.fn()}
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
    renderWithSnackbar(
      <NeedsReviewTab
        modules={mockModules}
        onMerge={vi.fn()}
        onDiscardNew={vi.fn()}
        onView={vi.fn()}
      />,
    );

    const expandButton = screen.getByLabelText('Expand comparison');
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Existing Module Title')).toBeInTheDocument();
    });
    expect(screen.getByText('New Module')).toBeInTheDocument();
    expect(screen.getByText('Existing Module')).toBeInTheDocument();
    expect(screen.getByText('Merge Preview')).toBeInTheDocument();
    expect(
      screen.getByText('No merge preview is available yet.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('About new module')).toBeInTheDocument();
    expect(screen.getByLabelText('About existing module')).toBeInTheDocument();
    expect(screen.getByLabelText('About merge preview')).toBeInTheDocument();
  });

  it('triggers keep new, discard new, and merge handlers when buttons are clicked', async () => {
    const handleMerge = vi.fn().mockResolvedValue(undefined);
    const handleDiscardNew = vi.fn().mockResolvedValue(undefined);
    const handleKeepNew = vi.fn().mockResolvedValue(undefined);

    renderWithSnackbar(
      <NeedsReviewTab
        modules={mockModules}
        onMerge={handleMerge}
        onDiscardNew={handleDiscardNew}
        onKeepNew={handleKeepNew}
        onView={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Keep New' })[0]);
    await waitFor(() => {
      expect(handleKeepNew).toHaveBeenCalledWith('candidate-1');
    });
    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: 'Keep New' })[0],
      ).toBeEnabled();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Discard New' })[0]);
    const discardDialog = screen.getByRole('dialog');
    expect(
      within(discardDialog).getByRole('heading', {
        name: 'Discard new module?',
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(discardDialog).getByRole('button', { name: 'Discard New' }),
    );
    await waitFor(() => {
      expect(handleDiscardNew).toHaveBeenCalledWith('candidate-1');
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Merge' })[0]);
    await waitFor(() => {
      expect(handleMerge).toHaveBeenCalledWith('candidate-1');
    });
  });

  it('shows created_by and published_by actor names from API objects', async () => {
    renderWithSnackbar(
      <NeedsReviewTab
        modules={mockModulesWithActorRefs}
        onMerge={vi.fn()}
        onDiscardNew={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText('By test user')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Expand comparison'));

    await waitFor(() => {
      expect(screen.getByText('Existing Published Module')).toBeInTheDocument();
    });

    expect(screen.getByText('Created By')).toBeInTheDocument();
    expect(screen.getByText('Published By')).toBeInTheDocument();
    expect(screen.getAllByText('test user').length).toBeGreaterThan(0);
  });

  it('loads the merge preview from merge_secondary_module_id', async () => {
    renderWithSnackbar(
      <NeedsReviewTab
        modules={[
          {
            ...mockModules[0],
            merge_secondary_module_id: 'merge-secondary-1',
          },
        ]}
        onMerge={vi.fn()}
        onDiscardNew={vi.fn()}
        onView={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText('Expand comparison'));

    await waitFor(() => {
      expect(screen.getByText('Merged Module Title')).toBeInTheDocument();
    });
    expect(screen.getByText('Merge Preview')).toBeInTheDocument();
    expect(screen.getAllByText('Candidate Module 1').length).toBeGreaterThan(0);
  });
});
