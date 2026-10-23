import type { SVGProps } from 'react';

export interface ClipboardIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const ClipboardIcon = ({
  title,
  className,
  ...props
}: ClipboardIconProps) => (
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
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 2h6v4H9V2Z" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </svg>
);
