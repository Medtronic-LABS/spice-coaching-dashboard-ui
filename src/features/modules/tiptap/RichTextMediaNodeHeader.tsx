import { DeleteIcon } from '@/assets/icon';

interface RichTextMediaNodeHeaderProps {
  label: string;
  title?: string;
  /** When false, only the remove action is shown (e.g. media is loaded). */
  showLabel?: boolean;
  onRemove?: () => void;
}

export const RichTextMediaNodeHeader = ({
  label,
  title,
  showLabel = true,
  onRemove,
}: RichTextMediaNodeHeaderProps) => (
  <div
    className={`mb-1 flex select-none items-center gap-2 ${showLabel || !onRemove ? 'justify-between' : 'justify-end'}`}
  >
    {showLabel ? (
      <span
        className="min-w-0 flex-1 truncate text-[11px] font-semibold text-spice-text-muted"
        title={title}
      >
        {label}
      </span>
    ) : null}
    {onRemove ? (
      <button
        type="button"
        aria-label="Remove"
        title="Remove"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-spice-semantic-error transition-colors hover:bg-spice-semantic-errorBg"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={onRemove}
      >
        <DeleteIcon className="h-4 w-4" />
      </button>
    ) : null}
  </div>
);
