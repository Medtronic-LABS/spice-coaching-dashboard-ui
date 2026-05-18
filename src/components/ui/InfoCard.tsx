import { Card } from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';

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
  info: 'border-spice-semantic-info/25 bg-spice-semantic-infoBg',
  success: 'border-spice-semantic-success/25 bg-spice-semantic-successBg',
  warning: 'border-spice-semantic-warning/25 bg-spice-semantic-warningBg',
  critical: 'border-spice-semantic-error/25 bg-spice-semantic-errorBg',
};

export const InfoCard = ({
  title,
  description,
  tone = 'info',
}: InfoCardProps) => {
  const { t } = useTranslation();

  return (
    <Card variant="bordered" className={cn(toneClassMap[tone])}>
      <h4 className="text-base font-semibold text-spice-text-primary">
        {title}
      </h4>
      <p className="mt-1 text-sm text-spice-text-medium">
        {description || t('ui.infoCard.emptyFallback')}
      </p>
    </Card>
  );
};
