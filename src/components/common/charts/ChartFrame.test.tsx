import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChartFrame } from './ChartFrame';

describe('ChartFrame', () => {
  it('renders loading skeleton when loading', () => {
    render(<ChartFrame ariaLabel="chart" loading />);
    expect(screen.getByLabelText('chart')).toBeInTheDocument();
    expect(screen.getByLabelText('chart')).toHaveAttribute('role', 'img');
  });

  it('renders error state when error is provided', () => {
    render(<ChartFrame ariaLabel="chart" error="Boom" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('renders empty state when isEmpty', () => {
    render(
      <ChartFrame
        ariaLabel="chart"
        isEmpty
        emptyTitle="Nothing here"
        emptyDescription="Try later"
      />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Try later')).toBeInTheDocument();
  });

  it('renders children and legend in non-empty state and wires events', () => {
    const onClick = vi.fn();
    const onMouseMove = vi.fn();

    render(
      <ChartFrame
        ariaLabel="chart"
        isEmpty={false}
        onClick={onClick}
        onMouseMove={onMouseMove}
        legend={<div>Legend</div>}
      >
        <div>Body</div>
      </ChartFrame>,
    );

    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();

    const root = screen.getByLabelText('chart');
    fireEvent.click(root);
    fireEvent.mouseMove(root);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onMouseMove).toHaveBeenCalledTimes(1);
  });
});
