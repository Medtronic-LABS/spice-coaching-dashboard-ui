import { StatCard } from '@/components/ui';
import type { DashboardSummaryKpi } from '@/types/supervisor.types';

export interface KPISectionProps {
  kpis: DashboardSummaryKpi[];
}

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CapIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3 2 8l10 5 10-5-10-5Z" />
    <path d="M6 10v6c0 2 3 4 6 4s6-2 6-4v-6" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.3 3.6 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
  </svg>
);

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

function kpiIcon(kpi: DashboardSummaryKpi) {
  if (kpi.type === 'alert') return <AlertIcon />;
  if (kpi.id.toLowerCase().includes('quiz')) return <CapIcon />;
  return <CheckIcon />;
}

export const KPISection = ({ kpis }: KPISectionProps) => {
  const visibleKpis = kpis.slice(0, 3);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visibleKpis.map((kpi) => (
        <StatCard
          key={kpi.id}
          icon={kpiIcon(kpi)}
          label={kpi.title}
          value={kpiValue(kpi)}
          change={kpi.change}
          supportingText={kpiSupportingText(kpi)}
          badgeLabel={kpiBadgeLabel(kpi)}
        />
      ))}
    </div>
  );
};
