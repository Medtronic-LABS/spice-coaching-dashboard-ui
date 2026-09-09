import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NotFoundPage } from '@/routes/NotFoundPage';

describe('NotFoundPage', () => {
  it('renders a 404 message and navigation actions', () => {
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
    expect(screen.getByText('HTTP 404 · not_found')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /back to dashboard/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /go to home/i }),
    ).toBeInTheDocument();
  });
});
