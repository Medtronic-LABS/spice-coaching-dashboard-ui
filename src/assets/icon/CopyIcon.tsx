import type { SVGProps } from 'react';

export interface CopyIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

/** Overlapping-squares glyph for duplicate/copy actions. */
export const CopyIcon = ({ title, className, ...props }: CopyIconProps) => (
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
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15V5a2 2 0 012-2h10" />
  </svg>
);
