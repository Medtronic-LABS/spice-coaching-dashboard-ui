import type { SVGProps } from 'react';

export interface PageLoadErrorIllustrationProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const PageLoadErrorIllustration = ({
  title,
  className,
  ...props
}: PageLoadErrorIllustrationProps) => (
  <svg
    viewBox="0 0 200 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <circle cx="36" cy="34" r="5" fill="#ECE4FF" />
    <circle cx="164" cy="42" r="4" fill="#F3EDFF" />
    <circle cx="152" cy="96" r="6" fill="#ECE4FF" />
    <circle cx="48" cy="104" r="3.5" fill="#F3EDFF" />
    <path
      d="M58 108c-12.15 0-22-9.85-22-22 0-10.52 7.36-19.32 17.22-21.54C56.86 50.62 67.8 42 80.5 42c10.77 0 20.08 6.12 24.68 15.05 2.14-.47 4.36-.72 6.62-.72 18.23 0 33 14.77 33 33 0 .98-.05 1.95-.13 2.9C153.18 95.64 161 104.93 161 116c0 12.15-9.85 22-22 22H58z"
      fill="#FFFFFF"
      stroke="#D8CCF5"
      strokeWidth="2"
    />
    <path
      d="M99.5 78v24"
      stroke="#E45C8C"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <circle cx="99.5" cy="112" r="4" fill="#E45C8C" />
  </svg>
);
