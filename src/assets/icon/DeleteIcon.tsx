import type { SVGProps } from 'react';

export interface DeleteIconProps extends SVGProps<SVGSVGElement> {
  /** Accessible title when the icon is not paired with an external aria-label. */
  title?: string;
}

/**
 * Shared trash/delete glyph for remove actions across the app.
 */
export const DeleteIcon = ({ title, className, ...props }: DeleteIconProps) => (
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
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" />
    <path d="M19 6l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);
