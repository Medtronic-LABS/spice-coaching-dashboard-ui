import type { SVGProps } from 'react';

export interface BookIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const BookIcon = ({ title, className, ...props }: BookIconProps) => (
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
    <path d="M4 19a2 2 0 0 0 2 2h14" />
    <path d="M6 2h14v20H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
  </svg>
);
