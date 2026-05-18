import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModuleProgressCard } from './ModuleProgressCard';
import type { ModuleProgressItem } from '@/types/supervisor.types';

describe('ModuleProgressCard', () => {
  it('renders module rows with progress', () => {
    const items: ModuleProgressItem[] = [
      {
        module_id: 'm1',
        name: 'Module 1',
        progress: 40,
        status: 'due_soon',
        completed: 2,
        total: 5,
      },
    ];

    render(<ModuleProgressCard items={items} />);
    expect(screen.getByText('Module progress')).toBeInTheDocument();
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ new/i })).toBeInTheDocument();
  });

  it('supports custom title/subtitle and row click', () => {
    const items: ModuleProgressItem[] = [
      {
        module_id: 'm1',
        name: 'Module 1',
        progress: 40,
        status: 'due_soon',
        completed: 2,
        total: 5,
      },
    ];
    const onRowClick = vi.fn();

    render(
      <ModuleProgressCard
        title="My modules"
        subtitle="Subtitle"
        items={items}
        onRowClick={onRowClick}
      />,
    );

    expect(screen.getByText('My modules')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /module: module 1/i }));
    expect(onRowClick).toHaveBeenCalledWith(items[0]);
  });
});
