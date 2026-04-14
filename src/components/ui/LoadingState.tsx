/**
 * LoadingState
 * Generic loading placeholder block with optional label.
 *
 * Usage:
 * <LoadingState label="Loading dashboard data..." />
 */
export interface LoadingStateProps {
  label?: string;
}

export const LoadingState = ({ label = 'Loading...' }: LoadingStateProps) => {
  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-6"
      role="status"
      aria-live="polite"
    >
      <div className="h-2 w-1/3 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-2 w-2/3 animate-pulse rounded bg-slate-200" />
      <p className="mt-4 text-sm text-slate-500">{label}</p>
    </div>
  );
};
