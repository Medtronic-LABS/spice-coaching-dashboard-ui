import type { SVGProps } from 'react';

export interface ChevronIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
  expanded?: boolean;
}

export const ChevronIcon = ({
  title,
  className,
  expanded,
  ...props
}: ChevronIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''} ${className ?? ''}`}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path d="m6 9 6 6 6-6" />
  </svg>
);
