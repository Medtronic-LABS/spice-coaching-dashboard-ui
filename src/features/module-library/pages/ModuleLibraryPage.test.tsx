import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { renderWithProviders } from '@/test-utils/render';
import { ModuleLibraryPage } from './ModuleLibraryPage';
import type { AppRole } from '@/constants/role';

const roleState = vi.hoisted(() => ({ role: 'supervisor' as AppRole }));

vi.mock('@/constants/role', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants/role')>();
  return {
    ...actual,
    getCurrentRole: () => roleState.role,
  };
});

describe('ModuleLibraryPage', () => {
  beforeEach(() => {
    roleState.role = 'supervisor';
  });

  it('shows Edit on published tab and no Assign action', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path={paths.moduleLibrary} element={<ModuleLibraryPage />} />
        <Route
          path={paths.adminModuleReviewDetails}
          element={<div data-testid="module-review" />}
        />
      </Routes>,
      { route: paths.moduleLibrary },
    );

    await user.click(screen.getByRole('tab', { name: /published/i }));
    const editButtons = await screen.findAllByRole('button', {
      name: /^edit$/i,
    });
    expect(editButtons.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /^assign$/i }),
    ).not.toBeInTheDocument();

    await user.click(editButtons[0]);
    expect(screen.getByTestId('module-review')).toBeInTheDocument();
  });

  it('shows Review on drafts tab', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path={paths.moduleLibrary} element={<ModuleLibraryPage />} />
      </Routes>,
      { route: paths.moduleLibrary },
    );

    await user.click(screen.getByRole('tab', { name: /drafts/i }));
    const reviewButtons = await screen.findAllByRole('button', {
      name: /^review$/i,
    });
    expect(reviewButtons.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /^edit$/i }),
    ).not.toBeInTheDocument();
  });
});
