import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PageQueryErrorState } from '@/components/common/PageQueryErrorState';

describe('PageQueryErrorState', () => {
  it('renders centered page load error with refresh and dashboard actions', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PageQueryErrorState
          pageTitle="Configuration"
          pageSubtitle="Manage quiz reattempt validity and review configuration history."
          error={{ status: 503, data: {} }}
          errorTitle="Unable to load configuration"
          onRetry={onRetry}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Configuration', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Unable to load configuration',
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "We couldn't retrieve the data. Please check your connection or try refreshing the page.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('button', { name: 'Go to Dashboard' }),
    ).toBeInTheDocument();
  });

  it('shows API message when provided', () => {
    render(
      <MemoryRouter>
        <PageQueryErrorState
          pageTitle="Milestone Management"
          error={{
            status: 404,
            data: {
              detail: {
                code: 'not_found',
                message: 'Milestone list is unavailable right now.',
              },
            },
          }}
          errorTitle="Unable to load milestones"
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Milestone list is unavailable right now.'),
    ).toBeInTheDocument();
  });
});
