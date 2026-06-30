import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ErrorState
 * Generic error block with optional recovery action.
 *
 * Usage:
 * <ErrorState title="Failed to load" action={<Button>Retry</Button>} />
 */
export interface ErrorStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const ErrorState = ({ title, description, action }: ErrorStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-spice-semantic-error/25 bg-spice-semantic-errorBg p-6">
      <h4 className="text-base font-semibold text-spice-semantic-error">
        {title}
      </h4>
      <p className="mt-1 text-sm text-spice-semantic-error">
        {description ?? t('common.somethingWentWrongDescription')}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};
