import type { SVGProps } from 'react';

export interface ArrowRightIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const ArrowRightIcon = ({
  title,
  className,
  ...props
}: ArrowRightIconProps) => (
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
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);
