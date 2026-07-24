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
        className="shrink-0 text-[11px] font-semibold text-spice-semantic-error hover:underline"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={onRemove}
      >
        Remove
      </button>
    ) : null}
  </div>
);
