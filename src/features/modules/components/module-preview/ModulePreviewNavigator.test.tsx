import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ModulePreviewNavigator } from '@/features/modules/components/module-preview/ModulePreviewNavigator';
import type {
  ModulePreviewPosition,
  ModulePreviewSnapshot,
} from '@/features/modules/types/modulePreview.types';

vi.mock('@/features/modules/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: () => ({
    url: null,
    isLoading: false,
    isError: false,
  }),
}));

function buildSnapshot(
  cardCount: number,
  quizCount: number,
): ModulePreviewSnapshot {
  return {
    moduleTitle: 'Preview Module',
    cards: Array.from({ length: cardCount }, (_, index) => ({
      index,
      title: `Card ${index + 1}`,
      body: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: `Body ${index + 1}` }],
        },
      ],
    })),
    quiz: Array.from({ length: quizCount }, (_, index) => ({
      index,
      id: `q${index + 1}`,
      question: `Question ${index + 1}`,
      caseSetup: '',
      options: ['A', 'B'],
      correctIndex: 0,
      explanation: 'Because',
    })),
    syncedAt: Date.now(),
  };
}

function NavigatorHarness({
  snapshot,
  initialPosition = { phase: 'card', index: 0 },
}: {
  snapshot: ModulePreviewSnapshot;
  initialPosition?: ModulePreviewPosition;
}) {
  const [position, setPosition] = useState(initialPosition);
  return (
    <ModulePreviewNavigator
      snapshot={snapshot}
      position={position}
      onPositionChange={setPosition}
    />
  );
}

describe('ModulePreviewNavigator', () => {
  it('starts on the first lesson card', () => {
    render(<NavigatorHarness snapshot={buildSnapshot(2, 1)} />);

    expect(
      screen.getByTestId('lesson-card-preview-screen'),
    ).toBeInTheDocument();
    expect(screen.getByText('Card 1')).toBeInTheDocument();
  });

  it('shows progress only in the header and full-width nav buttons', () => {
    render(<NavigatorHarness snapshot={buildSnapshot(2, 1)} />);

    expect(screen.getAllByText('Learning 1 of 2')).toHaveLength(1);
    expect(screen.queryByText('Preview Module')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toHaveClass(
      'flex-1',
    );
    expect(screen.getByRole('button', { name: 'Next' })).toHaveClass('flex-1');
  });

  it('walks through all cards and reaches the quiz phase', async () => {
    const user = userEvent.setup();
    render(<NavigatorHarness snapshot={buildSnapshot(2, 1)} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Card 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start Quiz' }));
    expect(
      screen.getByTestId('quiz-question-preview-screen'),
    ).toBeInTheDocument();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getAllByText('Question 1/1')).toHaveLength(2);
    expect(screen.queryByText('Explanation')).not.toBeInTheDocument();
  });

  it('returns to the last card when going previous from quiz 0', async () => {
    const user = userEvent.setup();
    render(
      <NavigatorHarness
        snapshot={buildSnapshot(2, 1)}
        initialPosition={{ phase: 'quiz', index: 0 }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(
      screen.getByTestId('lesson-card-preview-screen'),
    ).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  it('stays in card phase at the last card when there is no quiz', async () => {
    const user = userEvent.setup();
    render(<NavigatorHarness snapshot={buildSnapshot(2, 0)} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(
      screen.queryByTestId('quiz-question-preview-screen'),
    ).not.toBeInTheDocument();
  });
});
