import { Card, StatCard } from '@/components/ui';
import type { DashboardSummaryKpi } from '@/types/supervisor.types';

export interface KPISectionProps {
  kpis: DashboardSummaryKpi[];
}

function formatKpiValue(kpi: DashboardSummaryKpi): string | number {
  const unit = kpi.unit ?? '';

  if (kpi.type === 'progress') {
    const pct = `${kpi.percentage}${unit || '%'}`;
    return `${pct} (${kpi.value}/${kpi.total})`;
  }

  if (kpi.type === 'number') {
    return unit ? `${kpi.value}${unit}` : kpi.value;
  }

  // alert
  return unit ? `${kpi.value}${unit}` : kpi.value;
}

export const KPISection = ({ kpis }: KPISectionProps) => {
  return (
    <Card variant="elevated" className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.id}
            label={kpi.title}
            value={formatKpiValue(kpi)}
          />
        ))}
      </div>
    </Card>
  );
};
