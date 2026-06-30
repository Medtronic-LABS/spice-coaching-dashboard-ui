import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FlagsCard } from './FlagsCard';
import type { PerformanceAlertItem } from '@/types/supervisor.types';

describe('FlagsCard', () => {
  it('renders flags and calls primary action', () => {
    const items: PerformanceAlertItem[] = [
      {
        chw_id: 'c1',
        name: 'CHW 1',
        flag_type: 'inactive',
        severity: 'high',
        message: 'Inactive',
        last_active_days: 0,
      },
    ];
    const onPrimaryAction = vi.fn();
    const onAssignModule = vi.fn();
    const onViewProfile = vi.fn();

    render(
      <FlagsCard
        items={items}
        primaryActionLabel="View all"
        onPrimaryAction={onPrimaryAction}
        onAssignModule={onAssignModule}
        onViewProfile={onViewProfile}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    expect(onPrimaryAction).toHaveBeenCalled();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText('CHW 1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /assign module/i }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: /view profile/i })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /assign module/i }));
    expect(onAssignModule).toHaveBeenCalledWith(items[0]);
    fireEvent.click(screen.getByRole('button', { name: /view profile/i }));
    expect(onViewProfile).toHaveBeenCalledWith(items[0]);

    // due label branch (<=0)
    expect(screen.getByText(/due today/i)).toBeInTheDocument();
  });

  it('renders fallback subtitle and non-clickable rows when onRowClick is missing', () => {
    const items: PerformanceAlertItem[] = [
      {
        chw_id: 'c1',
        name: 'CHW 1',
        flag_type: 'inactive',
        severity: 'low',
        message: 'Inactive',
        details: '3 days',
        last_active_days: 3,
      },
      {
        chw_id: 'c2',
        name: 'CHW 2',
        flag_type: 'late',
        severity: 'medium',
      },
    ];
    const onPrimaryAction = vi.fn();

    render(
      <FlagsCard
        items={items}
        primaryActionLabel="View all"
        onPrimaryAction={onPrimaryAction}
      />,
    );

    // message + details branch
    expect(screen.getByText(/inactive • 3 days/i)).toBeInTheDocument();
    // fallback to flag_type branch
    expect(screen.getByText('late')).toBeInTheDocument();

    // due label branch (>0)
    expect(screen.getByText(/3d overdue/i)).toBeInTheDocument();
  });

  it('does not show due label when last_active_days is missing', () => {
    const items: PerformanceAlertItem[] = [
      {
        chw_id: 'c1',
        name: 'CHW 1',
        flag_type: 'inactive',
        severity: 'medium',
      },
    ];
    render(
      <FlagsCard
        items={items}
        primaryActionLabel="View all"
        onPrimaryAction={vi.fn()}
      />,
    );

    expect(screen.queryByText(/due today/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });
});
