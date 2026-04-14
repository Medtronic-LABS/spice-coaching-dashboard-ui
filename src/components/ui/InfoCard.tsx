import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

/**
 * InfoCard
 * Generic message card for alerts, insights, and contextual hints.
 *
 * Usage:
 * <InfoCard title="Low AI Usage" description="Usage dropped by 12%" tone="warning" />
 */
export interface InfoCardProps {
  title: string;
  description: string;
  tone?: 'info' | 'success' | 'warning' | 'critical';
}

const toneClassMap: Record<NonNullable<InfoCardProps['tone']>, string> = {
  info: 'border-blue-200 bg-blue-50',
  success: 'border-green-200 bg-green-50',
  warning: 'border-yellow-200 bg-yellow-50',
  critical: 'border-red-200 bg-red-50',
};

export const InfoCard = ({
  title,
  description,
  tone = 'info',
}: InfoCardProps) => {
  return (
    <Card variant="bordered" className={cn(toneClassMap[tone])}>
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-1 text-sm text-slate-700">{description || '-'}</p>
    </Card>
  );
};
