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

  it('renders tabs and can navigate to assigned confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path={paths.moduleLibrary} element={<ModuleLibraryPage />} />
        <Route
          path={paths.moduleAssigned}
          element={<div data-testid="assigned" />}
        />
      </Routes>,
      { route: paths.moduleLibrary },
    );

    expect(
      screen.getByRole('heading', { name: /module library/i }),
    ).toBeInTheDocument();

    // Switch to published tab and click an Assign action.
    await user.click(screen.getByRole('tab', { name: /published/i }));
    const assignButtons = await screen.findAllByRole('button', {
      name: /^assign$/i,
    });
    await user.click(assignButtons[0]);
    expect(screen.getByTestId('assigned')).toBeInTheDocument();
  });
});
