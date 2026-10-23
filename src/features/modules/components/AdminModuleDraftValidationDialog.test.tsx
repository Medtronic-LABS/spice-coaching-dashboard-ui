import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdminModuleDraftValidationDialog } from '@/features/modules/components/AdminModuleDraftValidationDialog';
import type { AdminModuleDraftIssue } from '@/features/modules/utils/validateAdminModuleDraftContent';

const issues: AdminModuleDraftIssue[] = [
  {
    kind: 'card',
    index: 1,
    itemId: 'c2',
    field: 'title',
    message: 'Card 2 needs a title.',
  },
  {
    kind: 'card',
    index: 1,
    itemId: 'c2',
    field: 'body',
    message: 'Card 2 needs body content.',
  },
  {
    kind: 'quiz',
    index: 2,
    itemId: 'q3',
    field: 'question',
    message: 'Quiz question 3 needs a question.',
  },
];

describe('AdminModuleDraftValidationDialog', () => {
  it('groups cards and quiz with bullet issues', () => {
    render(
      <AdminModuleDraftValidationDialog
        open
        issues={issues}
        onClose={vi.fn()}
        onReviewIssue={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: "Can't save yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cards' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Quiz' })).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    expect(screen.getByText('Quiz question 3')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Needs a title.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Needs body content.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Needs a question.' }),
    ).toBeInTheDocument();
  });

  it('reviews the first issue from the primary action', async () => {
    const user = userEvent.setup();
    const onReviewIssue = vi.fn();

    render(
      <AdminModuleDraftValidationDialog
        open
        issues={issues}
        onClose={vi.fn()}
        onReviewIssue={onReviewIssue}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Review first issue' }),
    );
    expect(onReviewIssue).toHaveBeenCalledWith(issues[0]);
  });
});
