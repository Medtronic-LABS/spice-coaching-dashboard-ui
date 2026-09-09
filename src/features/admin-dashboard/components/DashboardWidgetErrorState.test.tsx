import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';

describe('DashboardWidgetErrorState', () => {
  it('renders default widget error copy and retry action', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(<DashboardWidgetErrorState onRetry={onRetry} />);

    expect(
      screen.getByRole('heading', { name: "Couldn't load this section" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This data is temporarily unavailable. Check your connection or try again in a moment.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('supports compact layout for nested widget sections', () => {
    render(<DashboardWidgetErrorState compact onRetry={() => undefined} />);

    expect(screen.getByText("Couldn't load this section")).toBeInTheDocument();
    expect(
      screen.getByText('Try again to reload this section.'),
    ).toBeInTheDocument();
  });

  it('renders catalog-backed copy when an API error is provided', () => {
    render(
      <DashboardWidgetErrorState
        error={{
          status: 503,
          data: { detail: { code: 'service_unavailable' } },
        }}
        onRetry={() => undefined}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Service Unavailable' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('HTTP 503 · service_unavailable'),
    ).toBeInTheDocument();
  });
});
