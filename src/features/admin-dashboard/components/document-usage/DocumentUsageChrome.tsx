import type { ReactNode } from 'react';
import { ArrowRightIcon } from '@/assets/icon';

/** Compact uppercase subheading used inside dashboard widgets (not the page-level SectionHeader). */
export function WidgetSubheading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-spice-text-muted">
        {title}
      </h4>
      {action}
    </div>
  );
}

export function TextLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-semibold text-spice-brand-primary transition hover:text-spice-brand-primary/80"
    >
      {label}
      <ArrowRightIcon className="h-3.5 w-3.5" />
    </button>
  );
}
