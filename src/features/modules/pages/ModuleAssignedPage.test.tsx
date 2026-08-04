import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { renderWithProviders } from '@/test-utils/render';
import { ModuleAssignedPage } from './ModuleAssignedPage';

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
      initialState: { locationState: state },
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

  it('shows individual assignment summary', () => {
    renderAssignedPage({
      assignmentType: 'individual',
      assignedUsers: [
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
      assignedCount: 2,
    });

    expect(screen.getByText(/assigned to — individual/i)).toBeInTheDocument();
    expect(screen.getByText('Md Abdus Salam')).toBeInTheDocument();
    expect(screen.getByText('Mst. Rabeya Khatun')).toBeInTheDocument();
  });

  it('shows PO card and expandable SK users for po_sk assignments', async () => {
    const user = userEvent.setup();
    renderAssignedPage({
      assignmentType: 'po_sk',
      assignedUsers: [
        {
          kind: 'po_sk',
          poId: 20,
          poName: 'Sobita Rani',
          skUsers: [
            { userId: 21, name: 'Md Abdus Salam' },
            { userId: 22, name: 'Mst. Rabeya Khatun' },
          ],
        },
      ],
      assignedCount: 3,
    });

    expect(screen.getByText(/assigned to — po \+ sks/i)).toBeInTheDocument();
    expect(screen.getByText('Sobita Rani')).toBeInTheDocument();
    expect(screen.queryByText('Md Abdus Salam')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /show sk users for sobita rani/i }),
    );

    expect(screen.getByText('Md Abdus Salam')).toBeInTheDocument();
    expect(screen.getByText('Mst. Rabeya Khatun')).toBeInTheDocument();
  });

  it('shows upazila card and expandable SK users for geographical assignments', async () => {
    const user = userEvent.setup();
    renderAssignedPage({
      assignmentType: 'geographical',
      assignedUsers: [
        {
          kind: 'upazila',
          upazilaName: 'Hatibandha',
          skUsers: [
            { userId: 21, name: 'Md Abdus Salam' },
            { userId: 22, name: 'Mst. Rabeya Khatun' },
          ],
        },
      ],
      assignedCount: 3,
    });

    expect(screen.getByText('Hatibandha')).toBeInTheDocument();
    expect(screen.queryByText('Md Abdus Salam')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /show sk users for hatibandha/i }),
    );

    expect(screen.getByText('Md Abdus Salam')).toBeInTheDocument();
    expect(screen.getByText('Mst. Rabeya Khatun')).toBeInTheDocument();
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
});
