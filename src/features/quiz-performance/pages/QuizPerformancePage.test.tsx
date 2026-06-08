import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render';
import { QuizPerformancePage } from './QuizPerformancePage';

describe('QuizPerformancePage', () => {
  it('switches tabs and shows question cards', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizPerformancePage />);

    expect(
      screen.getByRole('heading', { name: /quiz performance/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /by question/i }));
    expect(screen.getByText(/most failed module/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/at what bp reading should a chw refer/i),
    ).toBeInTheDocument();
  });
});
