import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * EmptyState
 * Standard no-data placeholder with optional action.
 *
 * Usage:
 * <EmptyState title="No records" description="Try changing filters." />
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-1 text-sm text-slate-500">
        {description ?? t('common.noData')}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};
