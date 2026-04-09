import { type ReactNode } from 'react';

/**
 * SectionHeader
 * Standardized section heading with optional action area on the right.
 *
 * Usage:
 * <SectionHeader title="Overview" action={<Button>Refresh</Button>} />
 */
export interface SectionHeaderProps {
  /** Required heading text for the section. */
  title: string;
  /** Optional secondary line under the title. */
  subtitle?: string;
  /** Optional right-side action, such as a button group. */
  action?: ReactNode;
}

export const SectionHeader = ({
  title,
  subtitle,
  action,
}: SectionHeaderProps) => {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
};
