import type { SVGProps } from 'react';

export interface CalendarIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const CalendarIcon = ({
  title,
  className,
  ...props
}: CalendarIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 2v4M16 2v4M4 10h16" />
  </svg>
);
