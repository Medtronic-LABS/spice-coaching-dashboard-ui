import type { SVGProps } from 'react';

export interface VideoIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const VideoIcon = ({ title, className, ...props }: VideoIconProps) => (
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
    <rect x="2" y="4" width="20" height="16" rx="3.5" />
    <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none" />
  </svg>
);
