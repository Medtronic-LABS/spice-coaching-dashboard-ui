import type { SVGProps } from 'react';

export interface PencilIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const PencilIcon = ({ title, className, ...props }: PencilIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);
