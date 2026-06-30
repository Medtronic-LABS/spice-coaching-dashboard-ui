import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { ModuleAssignedPage } from './ModuleAssignedPage';

describe('ModuleAssignedPage', () => {
  it('renders and routes back to module library', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[paths.moduleAssigned]}>
        <Routes>
          <Route path={paths.moduleAssigned} element={<ModuleAssignedPage />} />
          <Route
            path={paths.moduleLibrary}
            element={<div data-testid="library" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /module assigned successfully/i }),
    ).toBeInTheDocument();

    const backButtons = screen.getAllByRole('button', {
      name: /back to module library/i,
    });
    await user.click(backButtons.at(-1) ?? backButtons[0]);
    expect(screen.getByTestId('library')).toBeInTheDocument();
  });
});
