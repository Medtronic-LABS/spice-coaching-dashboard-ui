import type { SVGProps } from 'react';

export interface MenuIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const MenuIcon = ({ title, className, ...props }: MenuIconProps) => (
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
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
