import type { ReactNode } from 'react';
import { ChevronIcon } from '@/assets/icon';
import { cn } from '@/utils';

export interface DocumentSelectionCollapsibleProps {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Short summary shown in the header when collapsed (e.g. selection hint). */
  collapsedSummary?: string;
  /** Extra header content shown only while expanded (e.g. search). */
  headerAside?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export const DocumentSelectionCollapsible = ({
  title,
  open,
  onOpenChange,
  collapsedSummary,
  headerAside,
  disabled = false,
  children,
  className,
}: DocumentSelectionCollapsibleProps) => {
  const panelId = 'document-selection-panel';
  const headingId = 'document-selection-heading';

  return (
    <div
      className={cn(
        'rounded-xl border border-spice-border bg-spice-bg-surface',
        className,
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          className={cn(
            'min-w-0 flex-1 text-left transition-colors',
            disabled
              ? 'cursor-not-allowed opacity-60'
              : 'hover:text-spice-text-primary',
          )}
          aria-expanded={open}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => onOpenChange(!open)}
        >
          <div
            id={headingId}
            className="text-sm font-semibold text-spice-text-primary"
          >
            {title}
          </div>
          {!open && collapsedSummary ? (
            <p className="mt-0.5 truncate text-xs text-spice-text-muted">
              {collapsedSummary}
            </p>
          ) : null}
        </button>

        {open && headerAside ? (
          <div className="w-full max-w-xs shrink-0 sm:w-64">{headerAside}</div>
        ) : null}

        <button
          type="button"
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-spice-text-muted transition-colors',
            disabled
              ? 'cursor-not-allowed opacity-60'
              : 'hover:bg-spice-bg-tint hover:text-spice-text-primary',
          )}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          disabled={disabled}
          onClick={() => onOpenChange(!open)}
        >
          <ChevronIcon expanded={open} className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headingId}
          className="border-t border-spice-border px-4 py-4"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};
