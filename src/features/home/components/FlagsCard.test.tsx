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

    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    expect(onPrimaryAction).toHaveBeenCalled();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText('CHW 1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /assign module/i }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: /view profile/i })).toBeVisible();
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
  });
});
