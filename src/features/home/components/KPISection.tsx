import { StatCard } from '@/components/ui';
import type { DashboardSummaryKpi } from '@/types/supervisor.types';

export interface KPISectionProps {
  kpis: DashboardSummaryKpi[];
}

function kpiValue(kpi: DashboardSummaryKpi): string | number {
  const unit = kpi.unit ?? '';
  if (kpi.type === 'progress') return kpi.value;
  return unit ? `${kpi.value}${unit}` : kpi.value;
}

function kpiSupportingText(kpi: DashboardSummaryKpi): string | undefined {
  if (kpi.supporting_text) return kpi.supporting_text;
  if (kpi.type === 'progress') return `of ${kpi.total} assigned this cycle`;
  return undefined;
}

function kpiBadgeLabel(kpi: DashboardSummaryKpi): string | undefined {
  if (kpi.type !== 'alert') return undefined;
  return kpi.status === 'critical' ? 'ALERT' : undefined;
}

function kpiValueClassName(kpi: DashboardSummaryKpi): string | undefined {
  // Matches design system examples: highlight some KPIs in brand blue,
  // escalations/critical alerts in red, otherwise default text.
  if (kpi.status === 'critical') return 'text-spice-semantic-error';
  if (kpi.type === 'alert' && kpi.status === 'warning')
    return 'text-spice-semantic-error';
  if (kpi.status === 'good') return 'text-spice-semantic-success';
  if (kpi.status === 'info') return 'text-spice-brand-primary';
  return undefined;
}

export const KPISection = ({ kpis }: KPISectionProps) => {
  const visibleKpis = kpis.slice(0, 3);
  return (
    <div className="flex flex-wrap gap-3">
      {visibleKpis.map((kpi) => (
        <StatCard
          key={kpi.id}
          label={kpi.title}
          value={kpiValue(kpi)}
          supportingText={kpiSupportingText(kpi)}
          badgeLabel={kpiBadgeLabel(kpi)}
          valueClassName={kpiValueClassName(kpi)}
        />
      ))}
    </div>
  );
};
