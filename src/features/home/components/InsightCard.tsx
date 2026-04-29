import { Button, Card } from '@/components/ui';

export interface InsightCardProps {
  title: string;
  description: string;
  tone?: 'info' | 'success' | 'warning' | 'critical';
  actionLabel: string;
  onAction: () => void;
  actionVariant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

const toneClassMap: Record<NonNullable<InsightCardProps['tone']>, string> = {
  info: 'border-spice-semantic-info/25 bg-spice-semantic-infoBg',
  success: 'border-spice-semantic-success/25 bg-spice-semantic-successBg',
  warning: 'border-spice-semantic-warning/25 bg-spice-semantic-warningBg',
  critical: 'border-spice-semantic-error/25 bg-spice-semantic-errorBg',
};

const SparkIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="text-spice-brand-pm"
  >
    <path d="M12 2l1.5 6L20 10l-6.5 2L12 18l-1.5-6L4 10l6.5-2L12 2Z" />
  </svg>
);

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
    <Card variant="bordered" className={toneClassMap[tone]}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-spice-bg-surface/60 ring-1 ring-spice-border">
            <SparkIcon />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold tracking-wider text-spice-text-medium">
              {title}
            </div>
            <div className="mt-1 text-sm text-spice-text-medium">
              {description}
            </div>
          </div>
        </div>
        <Button
          variant={actionVariant}
          onClick={onAction}
          disabled={disabled}
          className="rounded-full border border-spice-border-mid bg-spice-bg-surface px-4 py-1.5 text-xs font-semibold text-spice-brand-primary hover:bg-spice-bg-tint"
        >
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
};
