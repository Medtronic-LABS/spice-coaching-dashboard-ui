import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PerformanceMatrix } from './PerformanceMatrix';
import type { CHWPerformanceRow } from '@/types/supervisor.types';

describe('PerformanceMatrix', () => {
  it('renders rows and calls onRowClick from View action', () => {
    const rows: CHWPerformanceRow[] = [
      {
        chw_id: 'c1',
        name: 'CHW 1',
        modules_done: 1,
        modules_total: 3,
        deadline_status: 'on_track',
        quiz_passed: 2,
        quiz_failed: 0,
        overall_status: 'in_progress',
      },
    ];
    const onRowClick = vi.fn();

    render(<PerformanceMatrix rows={rows} onRowClick={onRowClick} />);
    expect(screen.getByText('CHW 1')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });
});
