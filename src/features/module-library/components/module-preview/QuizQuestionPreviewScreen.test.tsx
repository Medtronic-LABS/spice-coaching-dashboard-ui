import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { QuizQuestionPreviewScreen } from '@/features/module-library/components/module-preview/QuizQuestionPreviewScreen';
import type { PreviewQuizItem } from '@/features/module-library/types/modulePreview.types';

const item: PreviewQuizItem = {
  index: 0,
  id: 'q1',
  question: 'What is the correct answer?',
  caseSetup: 'A patient arrives with symptoms.',
  options: ['Wrong answer', 'Correct answer'],
  correctIndex: 1,
  explanation: 'Option B is correct because of clinical guidelines.',
};

describe('QuizQuestionPreviewScreen', () => {
  it('renders case setup when present', () => {
    render(
      <QuizQuestionPreviewScreen
        item={item}
        questionIndex={0}
        totalQuestions={1}
      />,
    );

    expect(screen.getByTestId('quiz-case-setup')).toHaveTextContent(
      'A patient arrives with symptoms.',
    );
  });

  it('reveals explanation after tapping an option', async () => {
    const user = userEvent.setup();
    render(
      <QuizQuestionPreviewScreen
        item={item}
        questionIndex={0}
        totalQuestions={1}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Wrong answer/i }));

    expect(screen.getByTestId('quiz-explanation')).toHaveTextContent(
      'Option B is correct because of clinical guidelines.',
    );
  });

  it('disables answer options after reveal', async () => {
    const user = userEvent.setup();
    render(
      <QuizQuestionPreviewScreen
        item={item}
        questionIndex={0}
        totalQuestions={1}
      />,
    );

    const options = screen.getAllByRole('button');
    await user.click(options[0]!);

    options.forEach((option) => {
      expect(option).toBeDisabled();
    });
  });
});
