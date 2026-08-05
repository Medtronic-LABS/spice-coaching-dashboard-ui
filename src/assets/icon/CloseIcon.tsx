import type { SVGProps } from 'react';

export interface CloseIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const CloseIcon = ({ title, className, ...props }: CloseIconProps) => (
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
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);
