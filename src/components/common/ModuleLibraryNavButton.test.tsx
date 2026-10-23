import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ModuleLibraryNavButton } from '@/components/common/ModuleLibraryNavButton';
import { paths } from '@/constants/routes';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

describe('ModuleLibraryNavButton', () => {
  it('navigates to the module library route', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/start']}>
        <Routes>
          <Route
            path="/start"
            element={
              <>
                <ModuleLibraryNavButton />
                <LocationProbe />
              </>
            }
          />
          <Route path={paths.moduleLibrary} element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /^module library$/i }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      paths.moduleLibrary,
    );
  });
});
