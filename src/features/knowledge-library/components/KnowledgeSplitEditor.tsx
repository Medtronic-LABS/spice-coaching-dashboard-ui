import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  Button,
  CardTitle,
  FormLabel,
  ImagePicker,
  LimitedTextInput,
} from '@/components/ui';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { SPICE_INPUT_FOCUS_CLASSNAME } from '@/constants/formControls';
import { ADMIN_IMAGE_ACCEPT_SIZE_HINT } from '@/constants/uploadLimits';
import { IMAGE_FILE_INPUT_ACCEPT } from '@/utils/acceptedImageFile';
import { usePdfPageThumbnail } from '@/features/modules/hooks/usePdfPageThumbnail';
import {
  knowledgeSplitPageMaxDigits,
  parseKnowledgeSplitPageInput,
  type KnowledgeSplitDraftFieldErrors,
} from '@/features/knowledge-library/utils/knowledgeSplitValidation';
import type { KnowledgeSplitDraft } from '@/features/knowledge-library/types/knowledgeLibrary.types';
import { cn } from '@/utils';

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
  const pageMaxDigits = knowledgeSplitPageMaxDigits(pageCount);

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
        <CardTitle>{rowLabel}</CardTitle>
        <Button
          variant="ghost"
          size="iconSm"
          className="shrink-0 text-spice-semantic-error hover:bg-spice-semantic-errorBg"
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
            <FormLabel htmlFor={`knowledge-split-title-${index}`} required>
              Title
            </FormLabel>
            <LimitedTextInput
              id={`knowledge-split-title-${index}`}
              value={value.title}
              maxLength={FIELD_LIMITS.documentTitle}
              aria-label={`${rowLabel} title`}
              disabled={disabled}
              placeholder="e.g. HTN Referral Tips"
              inputClassName={
                errors?.title
                  ? 'border-spice-semantic-error ring-1 ring-spice-semantic-error/30'
                  : 'border-spice-border-mid'
              }
              onChange={(title) => onChange({ ...value, title })}
            />
            {errors?.title ? (
              <p className="text-xs text-spice-semantic-error">
                {errors.title}
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FormLabel htmlFor={`knowledge-split-start-${index}`} required>
                  Start page
                </FormLabel>
                <input
                  id={`knowledge-split-start-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={pageMaxDigits}
                  autoComplete="off"
                  value={
                    Number.isFinite(value.startPage) ? value.startPage : ''
                  }
                  aria-label={`${rowLabel} start page`}
                  disabled={disabled}
                  onChange={(e) => {
                    const nextStart = parseKnowledgeSplitPageInput(
                      e.target.value,
                      pageCount,
                    );
                    onChange({ ...value, startPage: nextStart });
                  }}
                  className={cn(
                    'h-10 w-full rounded-lg border bg-spice-bg-surface px-3 text-sm text-spice-text-primary caret-spice-palette-purple',
                    SPICE_INPUT_FOCUS_CLASSNAME,
                    errors?.startPage
                      ? 'border-spice-semantic-error ring-1 ring-spice-semantic-error'
                      : 'border-spice-border-mid',
                  )}
                />
                {errors?.startPage ? (
                  <p className="mt-1 text-xs text-spice-semantic-error">
                    {errors.startPage}
                  </p>
                ) : null}
              </div>
              <div>
                <FormLabel htmlFor={`knowledge-split-end-${index}`} required>
                  End page
                </FormLabel>
                <input
                  id={`knowledge-split-end-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={pageMaxDigits}
                  autoComplete="off"
                  value={Number.isFinite(value.endPage) ? value.endPage : ''}
                  aria-label={`${rowLabel} end page`}
                  disabled={disabled}
                  onChange={(e) => {
                    const nextEnd = parseKnowledgeSplitPageInput(
                      e.target.value,
                      pageCount,
                    );
                    onChange({ ...value, endPage: nextEnd });
                  }}
                  className={cn(
                    'h-10 w-full rounded-lg border bg-spice-bg-surface px-3 text-sm text-spice-text-primary caret-spice-palette-purple',
                    SPICE_INPUT_FOCUS_CLASSNAME,
                    errors?.endPage
                      ? 'border-spice-semantic-error ring-1 ring-spice-semantic-error'
                      : 'border-spice-border-mid',
                  )}
                />
                {errors?.endPage ? (
                  <p className="mt-1 text-xs text-spice-semantic-error">
                    {errors.endPage}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 space-y-2 sm:w-44">
            <FormLabel>Thumbnail{thumbnailStatus}</FormLabel>
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
              accept={IMAGE_FILE_INPUT_ACCEPT}
              label="Optional — leave blank for none"
              labelWhenSelected={
                hasCustomThumbnail ? 'Change custom' : 'Replace with custom'
              }
              hint={ADMIN_IMAGE_ACCEPT_SIZE_HINT}
              previewAlt={`${rowLabel} thumbnail`}
              frameClassName="aspect-square h-auto w-full"
              previewObjectFit="contain"
            />
            {isBlankThumbnail ? (
              <button
                type="button"
                disabled={disabled || !pdfDocument}
                className="text-left text-xs font-medium text-spice-brand-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
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
