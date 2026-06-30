import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { renderWithProviders } from '@/test-utils/render';
import { LeaderboardPage } from './LeaderboardPage';

describe('LeaderboardPage', () => {
  it('renders leaderboard and routes to profile', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path={paths.leaderboard} element={<LeaderboardPage />} />
        <Route
          path={paths.chwProfileDetail}
          element={<div data-testid="profile" />}
        />
      </Routes>,
      { route: paths.leaderboard },
    );

    expect(screen.getByRole('heading', { name: /leaderboard/i })).toBeVisible();

    const profileButtons = await screen.findAllByRole('button', {
      name: /profile/i,
    });
    await user.click(profileButtons[0]);
    expect(screen.getByTestId('profile')).toBeInTheDocument();
  });
});
