import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { cn } from '@/utils';

export type ImagePickerVariant = 'tile' | 'compact';

export interface ImagePickerProps {
  variant: ImagePickerVariant;
  /** Local file or remote preview URL. */
  value: File | string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  enableDragDrop?: boolean;
  label?: string;
  labelWhenSelected?: string;
  previewAlt?: string;
  className?: string;
  /** Classes for the tile preview / dropzone frame (tile variant only). */
  frameClassName?: string;
  /** How the preview image fits inside the frame (default: cover). */
  previewObjectFit?: 'cover' | 'contain';
  clearable?: boolean;
}

const DEFAULT_IMAGE_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp';

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

/**
 * Shared image picker with tile (preview dropzone) and compact (choose button) variants.
 */
export const ImagePicker = ({
  variant,
  value,
  onChange,
  accept = DEFAULT_IMAGE_ACCEPT,
  disabled = false,
  enableDragDrop = true,
  label = 'Choose image',
  labelWhenSelected = 'Change image',
  previewAlt = 'Selected image',
  className,
  frameClassName,
  previewObjectFit = 'cover',
  clearable = false,
}: ImagePickerProps) => {
  const previewFitClassName =
    previewObjectFit === 'contain' ? 'object-contain' : 'object-cover';
  const [isDragActive, setIsDragActive] = useState(false);

  const objectUrl = useMemo(() => {
    if (value instanceof File) return URL.createObjectURL(value);
    return null;
  }, [value]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewSrc =
    objectUrl ?? (typeof value === 'string' && value ? value : null);
  const hasPreview = Boolean(previewSrc);
  const primaryLabel = hasPreview ? labelWhenSelected : label;

  const takeFile = (file: File | null | undefined) => {
    if (disabled || !file) return;
    onChange(file);
  };

  const clearFile = () => {
    if (disabled) return;
    onChange(null);
  };

  const input = (
    <input
      type="file"
      accept={accept}
      className="sr-only"
      disabled={disabled}
      onChange={(event) => {
        const next = event.target.files?.[0] ?? null;
        event.target.value = '';
        takeFile(next);
      }}
    />
  );

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        {hasPreview ? (
          <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-md border border-spice-border bg-spice-bg-tint">
            <img
              src={previewSrc ?? undefined}
              alt={previewAlt}
              draggable={false}
              className={cn('h-full w-full', previewFitClassName)}
            />
          </div>
        ) : null}
        <label
          className={cn(
            'inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-medium hover:bg-spice-bg-tint',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          {input}
          {primaryLabel}
        </label>
      </div>
    );
  }

  let tileStateClasses =
    'cursor-pointer border-spice-border bg-spice-bg-tint hover:bg-spice-border';
  if (disabled) {
    tileStateClasses =
      'cursor-not-allowed border-spice-border bg-spice-bg-tint opacity-60';
  } else if (isDragActive) {
    tileStateClasses =
      'cursor-pointer border-spice-brand-primary bg-spice-bg-surface';
  }

  const tileFrameClassName = cn(
    'flex h-[180px] w-full items-center justify-center overflow-hidden rounded-lg border border-spice-border bg-spice-bg-tint',
    frameClassName,
  );

  if (hasPreview) {
    return (
      <div className={cn('relative', className)}>
        {clearable ? (
          <button
            type="button"
            aria-label="Remove selected image"
            disabled={disabled}
            onClick={clearFile}
            className={cn(
              'absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-spice-border bg-spice-bg-surface/95 text-spice-semantic-error shadow-sm transition hover:bg-spice-semantic-errorBg',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        ) : null}
        <div className={tileFrameClassName}>
          <img
            src={previewSrc ?? undefined}
            alt={previewAlt}
            draggable={false}
            className={cn('h-full w-full', previewFitClassName)}
          />
        </div>
        <label
          className={cn(
            'mt-2 inline-flex cursor-pointer items-center justify-center rounded-md border border-spice-border bg-spice-bg-surface px-3 py-1.5 text-xs text-spice-text-medium hover:bg-spice-bg-tint',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          {input}
          {labelWhenSelected}
        </label>
      </div>
    );
  }

  return (
    <label
      className={cn(
        'flex h-[180px] w-full flex-col items-center justify-center rounded-lg border border-dashed p-2 text-center transition-colors',
        tileStateClasses,
        frameClassName,
        className,
      )}
      onDragOver={(event: DragEvent<HTMLLabelElement>) => {
        if (!enableDragDrop || disabled) return;
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(event: DragEvent<HTMLLabelElement>) => {
        if (!enableDragDrop || disabled) return;
        event.preventDefault();
        setIsDragActive(false);
        takeFile(event.dataTransfer.files?.[0]);
      }}
    >
      {input}
      <PlusIcon className="mx-auto h-6 w-6 text-spice-text-muted opacity-60" />
      <span className="mt-1 block text-[10px] font-medium text-spice-text-muted">
        {label}
      </span>
    </label>
  );
};

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 5v6m4-6v6"
    />
  </svg>
);
