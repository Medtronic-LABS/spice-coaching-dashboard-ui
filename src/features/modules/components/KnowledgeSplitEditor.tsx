import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { KnowledgeSplitDraftFieldErrors } from '@/features/modules/utils/knowledgeSplitValidation';
import type { KnowledgeSplitDraft } from '@/features/modules/types/knowledgeLibrary.types';

export interface KnowledgeSplitEditorProps {
  index: number;
  value: KnowledgeSplitDraft;
  onChange: (next: KnowledgeSplitDraft) => void;
  onRemove: () => void;
  errors?: KnowledgeSplitDraftFieldErrors;
  disabled?: boolean;
  /** When false, hide/disable remove so at least one split remains. */
  canRemove?: boolean;
}

function parseIntOrNaN(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  const num = Number(trimmed);
  return Number.isFinite(num) ? Math.trunc(num) : Number.NaN;
}

export const KnowledgeSplitEditor = ({
  index,
  value,
  onChange,
  onRemove,
  errors,
  disabled = false,
  canRemove = true,
}: KnowledgeSplitEditorProps) => {
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!value.thumbnailFile) {
      setThumbnailPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(value.thumbnailFile);
    setThumbnailPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.thumbnailFile]);

  const rowLabel = useMemo(() => `Split ${index + 1}`, [index]);

  return (
    <div className="rounded-xl border border-spice-border bg-spice-bg-surface/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-spice-text-primary">
            {rowLabel}
          </div>
          <div className="mt-1 text-xs text-spice-text-muted">
            Provide title and page range. Thumbnail is optional (replace after
            upload).
          </div>
        </div>
        <Button
          variant="ghost"
          className="h-8 gap-1 px-2 text-xs text-spice-semantic-error hover:bg-spice-semantic-errorBg"
          onClick={onRemove}
          disabled={disabled || !canRemove}
          aria-label={`Delete ${rowLabel}`}
        >
          <TrashIcon />
          <span>Delete</span>
        </Button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
            Thumbnail (optional)
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-md border border-spice-border bg-spice-bg-tint">
              {thumbnailPreviewUrl ? (
                <img
                  src={thumbnailPreviewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-2 text-[11px] text-spice-text-muted">
                  No custom thumbnail
                </span>
              )}
            </div>
            <label className="cursor-pointer rounded-md border border-spice-border bg-spice-bg-surface px-3 py-2 text-xs text-spice-text-medium hover:bg-spice-bg-tint">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={disabled}
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null;
                  onChange({
                    ...value,
                    thumbnailFile: next,
                  });
                }}
              />
              Choose
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
            Title
          </div>
          <input
            type="text"
            value={value.title}
            aria-label={`${rowLabel} title`}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="e.g. HTN Referral Tips"
            className={`h-10 w-full rounded-lg border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/20 ${
              errors?.title
                ? 'border-spice-semantic-error ring-1 ring-spice-semantic-error/30'
                : 'border-spice-border-mid focus:border-spice-brand-primary/40'
            }`}
          />
          {errors?.title ? (
            <p className="text-xs text-spice-semantic-error">{errors.title}</p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
                Start page
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={Number.isFinite(value.startPage) ? value.startPage : ''}
                aria-label={`${rowLabel} start page`}
                disabled={disabled}
                onChange={(e) => {
                  const nextStart = parseIntOrNaN(e.target.value);
                  onChange({ ...value, startPage: nextStart });
                }}
                className={`h-10 w-full rounded-lg border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/20 ${
                  errors?.startPage
                    ? 'border-spice-semantic-error ring-1 ring-spice-semantic-error/30'
                    : 'border-spice-border-mid focus:border-spice-brand-primary/40'
                }`}
              />
              {errors?.startPage ? (
                <p className="mt-1 text-xs text-spice-semantic-error">
                  {errors.startPage}
                </p>
              ) : null}
            </div>
            <div className="md:col-span-1">
              <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
                End page
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={Number.isFinite(value.endPage) ? value.endPage : ''}
                aria-label={`${rowLabel} end page`}
                disabled={disabled}
                onChange={(e) => {
                  const nextEnd = parseIntOrNaN(e.target.value);
                  onChange({ ...value, endPage: nextEnd });
                }}
                className={`h-10 w-full rounded-lg border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/20 ${
                  errors?.endPage
                    ? 'border-spice-semantic-error ring-1 ring-spice-semantic-error/30'
                    : 'border-spice-border-mid focus:border-spice-brand-primary/40'
                }`}
              />
              {errors?.endPage ? (
                <p className="mt-1 text-xs text-spice-semantic-error">
                  {errors.endPage}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
