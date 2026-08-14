import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Button, ImagePicker } from '@/components/ui';
import { usePdfPageThumbnail } from '@/features/modules/hooks/usePdfPageThumbnail';
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
  /** Opened PDF document for auto thumbnails (lazy-loaded on the page). */
  pdfDocument?: PDFDocumentProxy | null;
  /** Known page count for input max + helper copy. */
  pageCount?: number | null;
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
  pdfDocument = null,
  pageCount = null,
}: KnowledgeSplitEditorProps) => {
  const rowLabel = `Split ${index + 1}`;
  const hasCustomThumbnail = Boolean(value.thumbnailFile);
  const suppressAutoThumbnail = Boolean(value.suppressAutoThumbnail);
  const isBlankThumbnail = !hasCustomThumbnail && suppressAutoThumbnail;
  const autoThumbEnabled =
    Boolean(pdfDocument) && !hasCustomThumbnail && !suppressAutoThumbnail;

  const { url: autoThumbnailUrl, isRendering: isAutoThumbnailRendering } =
    usePdfPageThumbnail(pdfDocument, value.startPage, autoThumbEnabled);

  const thumbnailValue: File | string | null = hasCustomThumbnail
    ? (value.thumbnailFile ?? null)
    : suppressAutoThumbnail
      ? null
      : autoThumbnailUrl;

  const hasVisibleThumbnail = Boolean(thumbnailValue);
  const pageMax =
    typeof pageCount === 'number' && pageCount >= 1 ? pageCount : undefined;

  let thumbnailStatus = '';
  if (isAutoThumbnailRendering && autoThumbEnabled) {
    thumbnailStatus = ' (loading…)';
  } else if (hasCustomThumbnail) {
    thumbnailStatus = ' (custom)';
  } else if (isBlankThumbnail) {
    thumbnailStatus = ' (none)';
  } else if (autoThumbnailUrl) {
    thumbnailStatus = ' (from PDF)';
  }

  return (
    <div className="rounded-xl border border-spice-border bg-spice-bg-surface/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-spice-text-primary">
          {rowLabel}
        </div>
        <Button
          variant="ghost"
          className="h-8 w-8 shrink-0 px-0 text-spice-semantic-error hover:bg-spice-semantic-errorBg"
          onClick={onRemove}
          disabled={disabled || !canRemove}
          aria-label={`Delete ${rowLabel}`}
          title={`Delete ${rowLabel}`}
        >
          <TrashIcon />
        </Button>
      </div>

      <div className="mt-3 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
              Title <span className="text-spice-semantic-error">*</span>
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
              <p className="text-xs text-spice-semantic-error">
                {errors.title}
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
                  Start page{' '}
                  <span className="text-spice-semantic-error">*</span>
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={pageMax}
                  step={1}
                  value={
                    Number.isFinite(value.startPage) ? value.startPage : ''
                  }
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
              <div>
                <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
                  End page <span className="text-spice-semantic-error">*</span>
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={pageMax}
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

          <div className="w-full shrink-0 space-y-2 sm:w-36">
            <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
              Thumbnail{thumbnailStatus}
            </div>
            <ImagePicker
              variant="tile"
              value={thumbnailValue}
              onChange={(next) => {
                if (next) {
                  onChange({
                    ...value,
                    thumbnailFile: next,
                    suppressAutoThumbnail: false,
                  });
                  return;
                }
                onChange({
                  ...value,
                  thumbnailFile: null,
                  suppressAutoThumbnail: true,
                });
              }}
              disabled={disabled}
              clearable={hasVisibleThumbnail}
              accept="image/*"
              label="Optional — leave blank for none"
              labelWhenSelected={
                hasCustomThumbnail ? 'Change custom' : 'Replace with custom'
              }
              previewAlt={`${rowLabel} thumbnail`}
              frameClassName="aspect-square h-auto w-full"
              previewObjectFit="contain"
            />
            {isBlankThumbnail ? (
              <button
                type="button"
                disabled={disabled || !pdfDocument}
                className="text-left text-[11px] font-medium text-spice-brand-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() =>
                  onChange({
                    ...value,
                    thumbnailFile: null,
                    suppressAutoThumbnail: false,
                  })
                }
              >
                Use PDF preview
              </button>
            ) : null}
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
