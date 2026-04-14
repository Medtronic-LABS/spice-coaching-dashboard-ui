import { type ReactNode } from 'react';

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
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h4 className="text-base font-semibold text-red-900">{title}</h4>
      <p className="mt-1 text-sm text-red-700">
        {description ?? 'Something went wrong.'}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};
