import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { ModuleAssignedPage } from './ModuleAssignedPage';

function renderAssignedPage(state?: Record<string, unknown>) {
  render(
    <MemoryRouter initialEntries={[{ pathname: paths.moduleAssigned, state }]}>
      <Routes>
        <Route path={paths.moduleAssigned} element={<ModuleAssignedPage />} />
        <Route
          path={paths.moduleLibrary}
          element={<div data-testid="library" />}
        />
      </Routes>
    </MemoryRouter>,
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
      assignedNames: ['Md Abdus Salam', 'Mst. Rabeya Khatun'],
      assignedCount: 2,
    });

    expect(screen.getByText(/assigned to — individual/i)).toBeInTheDocument();
    expect(screen.getByText('Md Abdus Salam')).toBeInTheDocument();
    expect(screen.getByText('Mst. Rabeya Khatun')).toBeInTheDocument();
  });

  it('shows PO + SK assignment summary', () => {
    renderAssignedPage({
      assignmentType: 'po_sk',
      assignedNames: ['PO + SKs - Sobita Rani'],
      assignedCount: 1,
    });

    expect(screen.getByText(/assigned to — po \+ sks/i)).toBeInTheDocument();
    expect(screen.getByText('PO + SKs - Sobita Rani')).toBeInTheDocument();
  });

  it('shows upazila assignment summary for geographical assignments', () => {
    renderAssignedPage({
      assignmentType: 'geographical',
      assignedNames: ['Hatibandha'],
      assignedCount: 42,
    });

    expect(screen.getByText(/assigned to — upazila/i)).toBeInTheDocument();
    expect(screen.getByText('Hatibandha')).toBeInTheDocument();
    expect(screen.queryByText(/\+.*more/i)).not.toBeInTheDocument();
  });

  it('shows organization assignment summary for group assignments', () => {
    renderAssignedPage({
      assignmentType: 'group',
      assignedNames: ['Bo District'],
      assignedCount: 1,
    });

    expect(screen.getByText(/assigned to — organization/i)).toBeInTheDocument();
    expect(screen.getByText('Bo District')).toBeInTheDocument();
    expect(screen.queryByText(/\+.*more/i)).not.toBeInTheDocument();
  });
});
