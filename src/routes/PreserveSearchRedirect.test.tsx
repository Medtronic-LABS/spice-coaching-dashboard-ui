import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { legacyPaths, paths } from '@/constants/routes';
import { PreserveSearchRedirect } from '@/routes/PreserveSearchRedirect';

function LocationProbe() {
  const location = useLocation();
  return (
    <div
      data-testid="location"
      data-pathname={location.pathname}
      data-search={location.search}
      data-hash={location.hash}
    />
  );
}

describe('PreserveSearchRedirect', () => {
  it('redirects to the target path and keeps search + hash', () => {
    render(
      <MemoryRouter
        initialEntries={[`${legacyPaths.uploadKnowledge}?tab=active#row-1`]}
      >
        <Routes>
          <Route
            path={legacyPaths.uploadKnowledge}
            element={<PreserveSearchRedirect to={paths.uploadKnowledge} />}
          />
          <Route path={paths.uploadKnowledge} element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    const location = screen.getByTestId('location');
    expect(location).toHaveAttribute('data-pathname', paths.uploadKnowledge);
    expect(location).toHaveAttribute('data-search', '?tab=active');
    expect(location).toHaveAttribute('data-hash', '#row-1');
  });
});
