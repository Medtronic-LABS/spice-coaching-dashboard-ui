import { type ReactNode } from 'react';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

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
  /** Heading tag used for the title. Defaults to h3. */
  variant?: HeadingTag;
}

export const SectionHeader = ({
  title,
  subtitle,
  action,
  variant = 'h3',
}: SectionHeaderProps) => {
  const Heading = variant;
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <Heading className="text-lg font-semibold text-slate-900">
          {title}
        </Heading>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
};
