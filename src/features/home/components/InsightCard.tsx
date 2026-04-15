import { Button, InfoCard } from '@/components/ui';

export interface InsightCardProps {
  title: string;
  description: string;
  tone?: 'info' | 'success' | 'warning' | 'critical';
  actionLabel: string;
  onAction: () => void;
  actionVariant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export const InsightCard = ({
  title,
  description,
  tone = 'info',
  actionLabel,
  onAction,
  actionVariant = 'secondary',
  disabled,
}: InsightCardProps) => {
  if (!description || !actionLabel || !title) return null;
  return (
    <div className="space-y-3">
      <InfoCard title={title} description={description} tone={tone} />
      <div className="flex justify-end">
        <Button
          variant={actionVariant}
          onClick={onAction}
          disabled={disabled}
          className="transition-transform hover:-translate-y-px active:translate-y-0"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};
