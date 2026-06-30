import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LeaderboardCard } from './LeaderboardCard';
import type { LeaderboardItem } from '@/types/supervisor.types';

describe('LeaderboardCard', () => {
  it('renders items and calls onRowClick', () => {
    const items: LeaderboardItem[] = [
      {
        chw_id: 'c1',
        name: 'A',
        score: 10,
        rank: 1,
        completion_rate: 70,
        trend: 'up',
      },
    ];
    const onRowClick = vi.fn();

    render(<LeaderboardCard items={items} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByRole('button', { name: /leaderboard row/i }));
    expect(onRowClick).toHaveBeenCalledWith(items[0]);
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });
});
