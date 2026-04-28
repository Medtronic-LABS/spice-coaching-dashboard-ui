import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KPISection } from './KPISection';
import type { DashboardSummaryKpi } from '@/types/supervisor.types';

describe('KPISection', () => {
  it('renders KPI cards with formatted values', () => {
    const kpis: DashboardSummaryKpi[] = [
      {
        id: 'n1',
        title: 'Users',
        type: 'number',
        status: 'good',
        value: 10,
        unit: null,
      },
      {
        id: 'p1',
        title: 'Completion',
        type: 'progress',
        status: 'info',
        value: 6,
        total: 10,
        percentage: 60,
        unit: null,
      },
      {
        id: 'a1',
        title: 'Flags',
        type: 'alert',
        status: 'warning',
        value: 2,
        unit: null,
        meta: { foo: 'bar' },
      },
    ];

    render(<KPISection kpis={kpis} />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Completion')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Flags')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('covers KPI formatting branches (unit, supporting text, critical badge, icon selection)', () => {
    const kpis: DashboardSummaryKpi[] = [
      {
        id: 'quiz-score',
        title: 'Quiz score',
        type: 'number',
        status: 'good',
        value: 90,
        unit: '%',
      },
      {
        id: 'progress-1',
        title: 'Completion',
        type: 'progress',
        status: 'info',
        value: 6,
        total: 10,
        percentage: 60,
        unit: null,
      },
      {
        id: 'alerts-1',
        title: 'Alerts',
        type: 'alert',
        status: 'critical',
        value: 2,
        unit: null,
        meta: { foo: 'bar' },
        supporting_text: 'Custom supporting text',
      },
    ];

    render(<KPISection kpis={kpis} />);

    // unit formatting
    expect(screen.getByText('90%')).toBeInTheDocument();
    // progress supporting text branch
    expect(screen.getByText(/of 10 assigned this cycle/i)).toBeInTheDocument();
    // critical badge label branch
    expect(screen.getByText('ALERT')).toBeInTheDocument();
    // supporting_text override branch
    expect(screen.getByText('Custom supporting text')).toBeInTheDocument();
  });
});
