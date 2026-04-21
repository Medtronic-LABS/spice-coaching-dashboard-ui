import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { ChwProfilesListPage } from '@/features/chw-profiles/pages/ChwProfilesListPage';
import { ChwProfileDetailPage } from '@/features/chw-profiles/pages/ChwProfileDetailPage';

describe('ChwProfilesListPage', () => {
  it('renders table rows from mocked API', async () => {
    renderWithProviders(<ChwProfilesListPage />, { route: '/chw-profiles' });

    expect(
      await screen.findByRole('heading', { name: /chw profiles/i, level: 2 }),
    ).toBeInTheDocument();

    expect(await screen.findByText('Fatema Jannat')).toBeInTheDocument();
    expect(screen.getByText('CHW001')).toBeInTheDocument();

    // Status badge should be present for on_track mock row.
    expect(screen.getAllByText(/on track/i).length).toBeGreaterThan(0);
  });

  it('filters rows by search query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChwProfilesListPage />, { route: '/chw-profiles' });

    await screen.findByText('Fatema Jannat');

    const search = screen.getByRole('searchbox');
    await user.type(search, 'Emma');

    expect(screen.queryByText('Fatema Jannat')).not.toBeInTheDocument();
    expect(await screen.findByText('Emma Chen')).toBeInTheDocument();
  });

  it('navigates to detail page when clicking View', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/chw-profiles" element={<ChwProfilesListPage />} />
        <Route path="/chw-profiles/:id" element={<ChwProfileDetailPage />} />
      </Routes>,
      { route: '/chw-profiles' },
    );

    await screen.findByText('Fatema Jannat');

    const row = screen.getByText('Fatema Jannat').closest('tr');
    expect(row).not.toBeNull();

    const viewButton = within(row as HTMLElement).getByRole('button', {
      name: /view/i,
    });
    await user.click(viewButton);

    expect(
      await screen.findByRole('heading', { name: /profile detail/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('CHW001')).toBeInTheDocument();
  });
});
