import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { QuizQuestionPreviewScreen } from '@/features/modules/components/module-preview/QuizQuestionPreviewScreen';
import type { PreviewQuizItem } from '@/features/modules/types/modulePreview.types';

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
  it('shows Question X/Y above the question and hides case setup', () => {
    render(
      <QuizQuestionPreviewScreen
        item={item}
        questionIndex={0}
        totalQuestions={4}
      />,
    );

    expect(screen.getByText('Question 1/4')).toBeInTheDocument();
    expect(screen.queryByTestId('quiz-case-setup')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'What is the correct answer?',
    );
  });

  it('reveals why-this-matters after tapping an option', async () => {
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
      'Why this matters',
    );
    expect(screen.getByTestId('quiz-explanation')).toHaveTextContent(
      'Option B is correct because of clinical guidelines.',
    );
    expect(
      screen.queryByText('Use Next below to continue.'),
    ).not.toBeInTheDocument();
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
