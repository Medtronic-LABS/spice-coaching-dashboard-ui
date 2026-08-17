import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { renderWithProviders } from '@/test-utils/render';
import { ModuleAssignedPage } from './ModuleAssignedPage';

function LibraryTabProbe() {
  const location = useLocation();
  const tab = (location.state as { tab?: string } | null)?.tab ?? '';
  return <div data-testid="library" data-tab={tab} />;
}

function renderAssignedPage(state?: Record<string, unknown>) {
  renderWithProviders(
    <Routes>
      <Route path={paths.moduleAssigned} element={<ModuleAssignedPage />} />
      <Route
        path={paths.moduleLibrary}
        element={<div data-testid="library" />}
      />
    </Routes>,
    {
      route: paths.moduleAssigned,
      routerState: state,
    },
  );
}

describe('ModuleAssignedPage', () => {
  it('renders and routes back to module library', async () => {
    const user = userEvent.setup();
    renderAssignedPage();

    expect(
      screen.getByRole('heading', { name: /module assigned successfully/i }),
    ).toBeInTheDocument();

    const backButtons = screen.getAllByRole('button', {
      name: /module library/i,
    });
    await user.click(backButtons.at(-1) ?? backButtons[0]);
    expect(screen.getByTestId('library')).toBeInTheDocument();
  });

  it('shows flat assigned users without mode-specific labels', () => {
    renderAssignedPage({
      assignedUsers: [
        {
          kind: 'individual',
          userId: 20,
          role: 'PO',
          name: 'Sobita Rani',
        },
        {
          kind: 'individual',
          userId: 21,
          role: 'SK',
          name: 'Md Abdus Salam',
        },
        {
          kind: 'individual',
          userId: 22,
          role: 'SK',
          name: 'Mst. Rabeya Khatun',
        },
      ],
      assignedCount: 3,
      removedUsers: [
        {
          kind: 'individual',
          userId: 30,
          role: 'SK',
          name: 'Independent SK',
        },
      ],
    });

    expect(screen.getByText(/^assigned to$/i)).toBeInTheDocument();
    expect(screen.getByText('Sobita Rani')).toBeInTheDocument();
    expect(screen.getByText('Md Abdus Salam')).toBeInTheDocument();
    expect(screen.getByText('Mst. Rabeya Khatun')).toBeInTheDocument();
    expect(screen.getByText(/revoked/i)).toBeInTheDocument();
    expect(screen.getByText('Independent SK')).toBeInTheDocument();
  });

  it('shows upazila assignment as a simple geographical card', () => {
    renderAssignedPage({
      assignmentType: 'geographical',
      assignedUsers: [{ kind: 'geographical', name: 'Hatibandha' }],
      assignedCount: 1,
    });

    expect(screen.getByText(/assigned to — upazila/i)).toBeInTheDocument();
    expect(screen.getByText('Hatibandha')).toBeInTheDocument();
  });

  it('shows organization assignment summary for group assignments', () => {
    renderAssignedPage({
      assignmentType: 'group',
      assignedUsers: [{ kind: 'geographical', name: 'Bo District' }],
      assignedCount: 1,
    });

    expect(screen.getByText(/assigned to — organization/i)).toBeInTheDocument();
    expect(screen.getByText('Bo District')).toBeInTheDocument();
  });

  it('navigates to published tab when assigning more users', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path={paths.moduleAssigned} element={<ModuleAssignedPage />} />
        <Route path={paths.moduleLibrary} element={<LibraryTabProbe />} />
      </Routes>,
      {
        route: paths.moduleAssigned,
        routerState: {
          moduleId: 'mod-1',
          moduleName: 'Sample module',
        },
      },
    );

    await user.click(
      screen.getByRole('button', { name: /assign to more users/i }),
    );

    expect(screen.getByTestId('library')).toHaveAttribute(
      'data-tab',
      'published',
    );
  });

  it('renders document assignment success copy', () => {
    renderAssignedPage({
      entityKind: 'document',
      entityId: 'doc-1',
      entityName: 'HTN Guide',
    });

    expect(
      screen.getByRole('heading', { name: /document assigned successfully/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('HTN Guide')).toBeInTheDocument();
    expect(
      screen.queryByText(/quiz reattempt allowed/i),
    ).not.toBeInTheDocument();
  });

  it('renders video assignment success copy', () => {
    renderAssignedPage({
      entityKind: 'video',
      entityId: 'vid-1',
      entityName: 'Counselling clip',
    });

    expect(
      screen.getByRole('heading', { name: /video assigned successfully/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Counselling clip')).toBeInTheDocument();
  });

  it('navigates to knowledge library for document assignments', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path={paths.moduleAssigned} element={<ModuleAssignedPage />} />
        <Route
          path={paths.uploadKnowledge}
          element={<div data-testid="knowledge-library" />}
        />
      </Routes>,
      {
        route: paths.moduleAssigned,
        routerState: {
          entityKind: 'document',
          entityId: 'doc-1',
          entityName: 'HTN Guide',
        },
      },
    );

    await user.click(
      screen.getByRole('button', { name: /knowledge library/i }),
    );

    expect(screen.getByTestId('knowledge-library')).toBeInTheDocument();
  });
});
