import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { buildPath, paths } from '@/constants/routes';
import { renderWithProviders } from '@/test-utils/render';
import { ChwProfileDetailPage } from '@/features/chw-profiles/pages/ChwProfileDetailPage';

describe('ChwProfileDetailPage', () => {
  it('renders profile data from mocked API', async () => {
    renderWithProviders(
      <Routes>
        <Route
          path={paths.chwProfileDetail}
          element={<ChwProfileDetailPage />}
        />
      </Routes>,
      {
        route: buildPath(paths.chwProfileDetail, { id: 'CHW001' }),
      },
    );

    expect(
      await screen.findByRole('heading', { name: /profile detail/i }),
    ).toBeInTheDocument();

    expect(await screen.findByText('Fatema Jannat')).toBeInTheDocument();
    expect(screen.getByText('CHW001')).toBeInTheDocument();

    // Module progress section
    expect(
      await screen.findByRole('heading', { name: /module progress/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('HTN Referral Thresholds')).toBeInTheDocument();

    // Quiz history section
    expect(
      await screen.findByRole('heading', { name: /quiz attempt history/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('HTN Referral Thresholds — Final Quiz'),
    ).toBeInTheDocument();
  });
});
