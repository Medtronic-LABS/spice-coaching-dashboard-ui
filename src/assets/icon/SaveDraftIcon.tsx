import type { SVGProps } from 'react';

export interface SaveDraftIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

/** Floppy-disk glyph for Save draft actions. */
export const SaveDraftIcon = ({
  title,
  className,
  ...props
}: SaveDraftIconProps) => (
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
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </svg>
);
