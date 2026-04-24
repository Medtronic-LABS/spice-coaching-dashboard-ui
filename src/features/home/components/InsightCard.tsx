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
  info: 'border-yellow-200 bg-yellow-50',
  success: 'border-green-200 bg-green-50',
  warning: 'border-yellow-200 bg-yellow-50',
  critical: 'border-red-200 bg-red-50',
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
    className="text-amber-600"
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
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/60 ring-1 ring-slate-200/60">
            <SparkIcon />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold tracking-wider text-amber-700">
              {title}
            </div>
            <div className="mt-1 text-sm text-slate-700">{description}</div>
          </div>
        </div>
        <Button
          variant={actionVariant}
          onClick={onAction}
          disabled={disabled}
          className="rounded-full border border-amber-200 bg-white px-4 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
        >
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
};
