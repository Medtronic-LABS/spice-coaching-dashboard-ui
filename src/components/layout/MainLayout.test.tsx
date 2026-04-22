import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from './MainLayout';

describe('MainLayout', () => {
  it('renders header, sidebar, and outlet content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route
              path="/"
              element={<div data-testid="outlet-content">Outlet Content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Verify Header and Sidebar content exists
    expect(screen.getByText('SPICE • AI COACHING')).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });
});
