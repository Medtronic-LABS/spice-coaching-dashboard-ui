import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils/render';
import { ReportsPage } from './ReportsPage';

describe('ReportsPage', () => {
  it('renders report cards', async () => {
    renderWithProviders(<ReportsPage />);

    expect(
      screen.getByRole('heading', { name: /reports/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/available reports/i)).toBeInTheDocument();

    expect(
      await screen.findByText(/chw performance summary/i),
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByRole('button', { name: /download/i })).length,
    ).toBeGreaterThan(0);
  });
});
