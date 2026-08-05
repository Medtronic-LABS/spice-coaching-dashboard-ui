import type { SVGProps } from 'react';

export interface SearchIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const SearchIcon = ({ title, className, ...props }: SearchIconProps) => (
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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
