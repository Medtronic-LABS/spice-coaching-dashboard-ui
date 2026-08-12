import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
  });
});
