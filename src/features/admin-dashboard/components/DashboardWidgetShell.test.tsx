import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';

describe('DashboardWidgetShell', () => {
  it('renders consistent title and description chrome', () => {
    render(
      <DashboardWidgetShell
        title="Widget title"
        description="Widget description"
      >
        <div>Body content</div>
      </DashboardWidgetShell>,
    );

    expect(
      screen.getByRole('heading', { name: 'Widget title' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Widget description')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders right-aligned header actions', () => {
    render(
      <DashboardWidgetShell
        title="With actions"
        actions={<button type="button">Sort</button>}
      >
        Body
      </DashboardWidgetShell>,
    );

    expect(screen.getByRole('button', { name: 'Sort' })).toBeInTheDocument();
  });

  it('renders shared refresh control and calls onRefresh', async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <DashboardWidgetShell
        title="Refreshable"
        actions={<button type="button">Sort</button>}
        onRefresh={onRefresh}
      >
        Body
      </DashboardWidgetShell>,
    );

    const refresh = screen.getByRole('button', { name: 'Refresh' });
    expect(refresh).toBeEnabled();
    await user.click(refresh);
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('disables refresh while refreshing', () => {
    render(
      <DashboardWidgetShell
        title="Refreshing"
        onRefresh={() => undefined}
        isRefreshing
      >
        Body
      </DashboardWidgetShell>,
    );

    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  });

  it('applies size-based max height on the shell', () => {
    const { container, rerender } = render(
      <DashboardWidgetShell title="Sized" size="md">
        Body
      </DashboardWidgetShell>,
    );

    expect(container.firstChild).toHaveClass('max-h-[28rem]');

    rerender(
      <DashboardWidgetShell title="Sized" size="lg">
        Body
      </DashboardWidgetShell>,
    );

    expect(container.firstChild).toHaveClass('max-h-[32rem]');

    rerender(
      <DashboardWidgetShell title="Sized" size="xl">
        Body
      </DashboardWidgetShell>,
    );

    expect(container.firstChild).toHaveClass('max-h-[40rem]');
  });
});
