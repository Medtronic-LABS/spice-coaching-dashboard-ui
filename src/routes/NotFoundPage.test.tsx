import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { paths } from '@/constants/routes';
import { NotFoundPage } from '@/routes/NotFoundPage';

describe('NotFoundPage', () => {
  it('renders a 404 message and navigation links', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /the page you requested does not exist or may have moved/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /back to dashboard/i }),
    ).toHaveAttribute('href', paths.adminDashboard);
    expect(screen.getByRole('link', { name: /go to home/i })).toHaveAttribute(
      'href',
      paths.home,
    );
  });
});
