import { useId, type ReactNode } from 'react';
import { Drawer, Tooltip } from '@/components/ui';
import { cn } from '@/utils';

const FiltersSlidersIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 4H14" />
    <path d="M10 4H3" />
    <path d="M21 12H12" />
    <path d="M8 12H3" />
    <path d="M21 20H16" />
    <path d="M12 20H3" />
    <path d="M14 2v4" />
    <path d="M8 10v4" />
    <path d="M16 18v4" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

interface SettingsFilterTriggerButtonProps {
  active: boolean;
  expanded: boolean;
  onClick: () => void;
  ariaLabel?: string;
  tooltip?: string;
}

export const SettingsFilterTriggerButton = ({
  active,
  expanded,
  onClick,
  ariaLabel = 'Open filters',
  tooltip,
}: SettingsFilterTriggerButtonProps) => {
  const tooltipId = useId();

  return (
    <div className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={expanded}
        aria-describedby={tooltip ? tooltipId : undefined}
        onClick={onClick}
        className={cn(
          'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-spice-border-mid bg-spice-bg-surface text-spice-text-primary shadow-sm',
          'transition hover:bg-spice-bg-tint hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary/30',
          active &&
            'border-spice-brand-primary/35 ring-1 ring-spice-brand-primary/20',
        )}
      >
        <FiltersSlidersIcon className="h-5 w-5" />
        {active ? (
          <span
            className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-spice-brand-primary ring-2 ring-spice-bg-surface"
            aria-hidden="true"
          />
        ) : null}
      </button>
      {tooltip ? (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-max max-w-64 rounded-md bg-spice-brand-navy px-3 py-2 text-xs font-medium leading-relaxed text-white shadow-spiceOverlay',
            'group-hover:block group-focus-within:block',
          )}
        >
          {tooltip}
        </span>
      ) : null}
    </div>
  );
};

interface SettingsFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  closeLabel?: string;
  titleId: string;
  descriptionId: string;
  children: ReactNode;
}

export const SettingsFilterDrawer = ({
  open,
  onClose,
  title,
  description,
  closeLabel = 'Close filters',
  titleId,
  descriptionId,
  children,
}: SettingsFilterDrawerProps) => (
  <Drawer
    open={open}
    onClose={onClose}
    labelledBy={titleId}
    describedBy={descriptionId}
  >
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-spice-border bg-spice-bg-tint/50 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-spice-text-primary"
            >
              {title}
            </h2>
            <Tooltip
              label={`About ${title.toLowerCase()}`}
              content={description}
            />
          </div>
          <p id={descriptionId} className="sr-only">
            {description}
          </p>
        </div>
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className={cn(
            'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            'text-spice-text-medium ring-1 ring-spice-border-mid',
            'transition hover:bg-spice-bg-surface hover:text-spice-text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary/30',
          )}
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  </Drawer>
);
