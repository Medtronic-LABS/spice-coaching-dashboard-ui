import type { SVGProps } from 'react';

export interface KnowledgeIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

/** Book with upload arrow — distinct from BookIcon / ClipboardIcon. */
export const KnowledgeIcon = ({
  title,
  className,
  ...props
}: KnowledgeIconProps) => (
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
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5v-10A2.5 2.5 0 0 1 6.5 2Z" />
    <path d="M12 7v6" />
    <path d="m9.5 9.5 2.5-2.5 2.5 2.5" />
  </svg>
);
