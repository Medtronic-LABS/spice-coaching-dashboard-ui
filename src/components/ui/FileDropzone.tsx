import { useRef, useState, type DragEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';

export interface FileDropzoneProps {
  /** Currently staged files (controlled). */
  files: File[];
  /** Called with the next staged file list after add/remove. */
  onChange: (files: File[]) => void;
  /** Native `accept` attribute for the file input. */
  accept: string;
  /** Allow selecting more than one file. Defaults to false. */
  multiple?: boolean;
  /** Cap on staged files when `multiple` is true. */
  maxFiles?: number;
  disabled?: boolean;
  /** Enable drag-and-drop onto the dashed area. Defaults to true. */
  enableDragDrop?: boolean;
  /** Render the staged file list with Remove actions. Defaults to false. */
  showFileList?: boolean;
  /** Show the circular plus icon. Defaults to true. */
  showIcon?: boolean;
  /** Primary label when no files are staged. */
  title: string;
  /** Primary label when at least one file is staged (e.g. Add more / Replace). */
  titleWhenSelected?: string;
  /** Secondary helper text under the title. */
  subtitle?: string;
  /** Hide subtitle once files are present. Defaults to false. */
  hideSubtitleWhenSelected?: boolean;
  ariaLabel?: string;
  /** Return an error message to reject a file; `null` accepts it. */
  validateFile?: (file: File) => string | null;
  /** Called when one or more files are rejected. */
  onReject?: (message: string) => void;
  className?: string;
}

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

const PlusIcon = () => (
  <svg
    className="h-4 w-4"
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

const DocumentIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M14 3v5h5"
    />
  </svg>
);

/**
 * Shared dashed dropzone for document/video uploads.
 * Controlled via `files` / `onChange`; optional staged-file list.
 */
export const FileDropzone = ({
  files,
  onChange,
  accept,
  multiple = false,
  maxFiles,
  disabled = false,
  enableDragDrop = true,
  showFileList = false,
  showIcon = true,
  title,
  titleWhenSelected,
  subtitle,
  hideSubtitleWhenSelected = false,
  ariaLabel,
  validateFile,
  onReject,
  className,
}: FileDropzoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const atCapacity =
    multiple && typeof maxFiles === 'number' && files.length >= maxFiles;
  const dropzoneDisabled = disabled || atCapacity;

  const stageIncoming = (incoming: File[]) => {
    if (dropzoneDisabled || !incoming.length) return;

    const candidates = multiple ? incoming : incoming.slice(0, 1);
    const accepted: File[] = [];
    const rejectionMessages: string[] = [];

    for (const file of candidates) {
      const message = validateFile?.(file) ?? null;
      if (message) {
        rejectionMessages.push(message);
        continue;
      }
      accepted.push(file);
    }

    if (rejectionMessages.length) {
      onReject?.(rejectionMessages.join(' '));
    } else {
      onReject?.('');
    }

    if (!accepted.length) return;

    if (!multiple) {
      onChange(accepted.slice(0, 1));
      return;
    }

    const existing = new Set(files.map(fileKey));
    const next = [...files];
    for (const file of accepted) {
      const key = fileKey(file);
      if (existing.has(key)) continue;
      next.push(file);
      existing.add(key);
      if (typeof maxFiles === 'number' && next.length >= maxFiles) break;
    }
    onChange(next);
  };

  const removeAt = (index: number) => {
    if (disabled) return;
    onChange(files.filter((_, i) => i !== index));
  };

  const primaryLabel =
    files.length > 0 && titleWhenSelected ? titleWhenSelected : title;
  const showSubtitle =
    Boolean(subtitle) && !(hideSubtitleWhenSelected && files.length > 0);

  let dropzoneStateClasses =
    'cursor-pointer border-spice-border-mid bg-spice-bg-tint hover:border-spice-border hover:bg-spice-bg-surface';
  if (dropzoneDisabled) {
    dropzoneStateClasses =
      'cursor-not-allowed border-spice-border-mid bg-spice-bg-tint opacity-60';
  } else if (isDragActive) {
    dropzoneStateClasses =
      'cursor-pointer border-spice-brand-primary bg-spice-bg-surface';
  }

  return (
    <div className={cn('space-y-2', className)}>
      {showFileList && files.length ? (
        <ul className="max-h-[11.5rem] space-y-2 overflow-y-auto pr-1">
          {files.map((file, index) => (
            <li
              key={fileKey(file)}
              className="flex items-center gap-3 rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2.5"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-spice-bg-tint text-spice-text-muted"
                aria-hidden
              >
                <DocumentIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-sm font-medium text-spice-text-primary"
                  title={file.name}
                >
                  {file.name}
                </div>
                <div className="mt-0.5 text-[11px] text-spice-text-muted">
                  {Math.round(file.size / 1024)} KB
                </div>
              </div>
              <Button
                variant="ghost"
                className="h-8 shrink-0 px-2 text-[11px] text-spice-semantic-error hover:bg-spice-semantic-errorBg"
                disabled={disabled}
                onClick={() => removeAt(index)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {!atCapacity ? (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            tabIndex={-1}
            className="sr-only"
            disabled={dropzoneDisabled}
            onFocus={(event) => {
              // Windows Chrome scrolls scrollable ancestors to reveal
              // focused sr-only inputs after the native file dialog closes.
              event.currentTarget.blur();
            }}
            onChange={(event) => {
              const picked = Array.from(event.target.files ?? []);
              event.target.value = '';
              stageIncoming(picked);
            }}
          />
          <button
            type="button"
            aria-label={ariaLabel ?? primaryLabel}
            disabled={dropzoneDisabled}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-3 text-center transition-colors',
              dropzoneStateClasses,
            )}
            onDragOver={(event: DragEvent<HTMLButtonElement>) => {
              if (!enableDragDrop || dropzoneDisabled) return;
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={(event: DragEvent<HTMLButtonElement>) => {
              if (!enableDragDrop || dropzoneDisabled) return;
              event.preventDefault();
              setIsDragActive(false);
              stageIncoming(Array.from(event.dataTransfer.files ?? []));
            }}
          >
            {showIcon ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-spice-border bg-spice-bg-surface text-spice-text-muted">
                <PlusIcon />
              </span>
            ) : null}
            <span className="text-xs font-semibold text-spice-text-primary">
              {primaryLabel}
            </span>
            {showSubtitle ? (
              <span className="text-[11px] text-spice-text-muted">
                {subtitle}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}
    </div>
  );
};
