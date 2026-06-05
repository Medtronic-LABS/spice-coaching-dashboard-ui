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

function renderModuleLibraryPage() {
  return renderWithProviders(
    <Routes>
      <Route path={paths.moduleLibrary} element={<ModuleLibraryPage />} />
      <Route
        path={paths.adminModuleReviewDetails}
        element={<div data-testid="module-review" />}
      />
      <Route
        path={paths.moduleAssigned}
        element={<div data-testid="module-assigned" />}
      />
    </Routes>,
    { route: paths.moduleLibrary },
  );
}

describe('ModuleLibraryPage', () => {
  beforeEach(() => {
    roleState.role = 'supervisor';
  });

  it('shows Review and Assign for supervisor on published modules', async () => {
    renderModuleLibraryPage();

    const assignButtons = await screen.findAllByRole('button', {
      name: /^assign$/i,
    });
    const reviewButtons = await screen.findAllByRole('button', {
      name: /^review$/i,
    });
    expect(assignButtons.length).toBeGreaterThan(0);
    expect(reviewButtons.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /^edit$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /drafts/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /all/i })).not.toBeInTheDocument();
  });

  it('navigates to read-only review for supervisor', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    const reviewButtons = await screen.findAllByRole('button', {
      name: /^review$/i,
    });
    await user.click(reviewButtons[0]);
    expect(screen.getByTestId('module-review')).toBeInTheDocument();
  });

  it('navigates to assign flow for supervisor', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    const assignButtons = await screen.findAllByRole('button', {
      name: /^assign$/i,
    });
    await user.click(assignButtons[0]);
    expect(screen.getByTestId('module-assigned')).toBeInTheDocument();
  });

  it('shows Edit and Assign on published tab for program manager', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

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

  it('shows Review on drafts tab for program manager', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

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
