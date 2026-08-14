import type { SVGProps } from 'react';

export interface LayersIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const LayersIcon = ({ title, className, ...props }: LayersIconProps) => (
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
    <path d="m12 2 9 4.5-9 4.5L3 6.5 12 2Z" />
    <path d="m3 12.5 9 4.5 9-4.5" />
    <path d="m3 18.5 9 4.5 9-4.5" />
  </svg>
);
