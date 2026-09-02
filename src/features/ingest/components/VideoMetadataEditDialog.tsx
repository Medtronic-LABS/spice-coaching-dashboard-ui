import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  Card,
  LimitedTextInput,
  LimitedTextarea,
  Loader,
  Modal,
  ModalActionBar,
  useSnackbar,
} from '@/components/ui';
import {
  FIELD_LIMITS,
  fieldLimitExceededMessage,
} from '@/constants/fieldLimits';
import { SPICE_INPUT_FOCUS_CLASSNAME } from '@/constants/formControls';
import {
  useUpdateSourceDocumentMetadataMutation,
  useUpdateSourceDocumentThumbnailMutation,
  type SourceDocumentSummary,
} from '@/features/modules/api/adminSourceDocumentsApi';
import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';
import { cn } from '@/utils';
import {
  VIDEO_THUMBNAIL_ACCEPT,
  formatVideoThumbnailRejectionError,
  isAcceptedVideoThumbnailFile,
} from '@/features/ingest/utils/videoThumbnail';
import { THUMBNAIL_ACCEPT_SIZE_HINT } from '@/constants/uploadLimits';

interface VideoMetadataEditDialogProps {
  open: boolean;
  document: SourceDocumentSummary | null;
  onClose: () => void;
  onSaved: (document: SourceDocumentSummary) => void;
}

export const VideoMetadataEditDialog = ({
  open,
  document,
  onClose,
  onSaved,
}: VideoMetadataEditDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [localThumbnailPreviewUrl, setLocalThumbnailPreviewUrl] = useState<
    string | null
  >(null);
  const [fieldError, setFieldError] = useState('');
  const snackbar = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateMetadata, { isLoading: isSavingMetadata }] =
    useUpdateSourceDocumentMetadataMutation();
  const [updateThumbnail, { isLoading: isSavingThumbnail }] =
    useUpdateSourceDocumentThumbnailMutation();

  const isSaving = isSavingMetadata || isSavingThumbnail;

  const existingStoragePath =
    open && document && !thumbnailFile ? document.thumbnail_storage_path : null;
  const { url: existingThumbnailUrl, isLoading: isLoadingExistingThumbnail } =
    usePresignedFileUrl(existingStoragePath);

  const thumbnailPreviewUrl =
    localThumbnailPreviewUrl ?? existingThumbnailUrl ?? null;

  useEffect(() => {
    if (!open || !document) return;
    setTitle(document.title);
    setDescription(document.description ?? '');
    setThumbnailFile(null);
    setLocalThumbnailPreviewUrl(null);
    setFieldError('');
  }, [open, document]);

  useEffect(() => {
    if (!thumbnailFile) {
      setLocalThumbnailPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setLocalThumbnailPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  if (!open || !document) return null;

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;

    if (
      !isAcceptedVideoThumbnailFile(file) ||
      formatVideoThumbnailRejectionError(file)
    ) {
      setFieldError(
        formatVideoThumbnailRejectionError(file) ||
          'Invalid thumbnail. Use PNG, JPEG, or WebP up to 5 MB.',
      );
      return;
    }
    setFieldError('');
    setThumbnailFile(file);
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFieldError('Title is required.');
      return;
    }
    if (trimmedTitle.length > FIELD_LIMITS.documentTitle) {
      setFieldError(
        fieldLimitExceededMessage('Title', FIELD_LIMITS.documentTitle),
      );
      return;
    }
    const descriptionValue = description.trim() ? description.trim() : null;
    if (
      descriptionValue &&
      descriptionValue.length > FIELD_LIMITS.description
    ) {
      setFieldError(
        fieldLimitExceededMessage('Description', FIELD_LIMITS.description),
      );
      return;
    }

    setFieldError('');

    try {
      let latest = document;
      const metadataChanged =
        trimmedTitle !== document.title ||
        descriptionValue !== (document.description ?? null);

      if (metadataChanged) {
        latest = await updateMetadata({
          sourceDocumentId: document.id,
          body: {
            title: trimmedTitle,
            description: descriptionValue,
          },
        }).unwrap();
      }

      if (thumbnailFile) {
        latest = await updateThumbnail({
          sourceDocumentId: document.id,
          file: thumbnailFile,
        }).unwrap();
      }

      onSaved(latest);
      onClose();
    } catch (error) {
      snackbar.showApiError(error);
    }
  };

  return (
    <Modal
      open={open}
      labelledBy="video-metadata-edit-title"
      contentClassName="max-w-lg"
      onClose={isSaving ? () => undefined : onClose}
    >
      <Loader open={isSaving} label="Saving video details…" />
      <Card
        variant="elevated"
        className="w-full space-y-4 border-spice-border p-4 shadow-lg sm:p-6"
      >
        <h2
          id="video-metadata-edit-title"
          className="text-lg font-semibold text-spice-text-primary"
        >
          Edit video details
        </h2>

        {fieldError ? (
          <p className="text-xs text-spice-semantic-error" role="alert">
            {fieldError}
          </p>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-spice-text-primary">
            Title <span className="text-spice-semantic-error">*</span>
          </span>
          <LimitedTextInput
            id="video-metadata-title"
            value={title}
            maxLength={FIELD_LIMITS.documentTitle}
            disabled={isSaving}
            onChange={setTitle}
            inputClassName={cn(
              'w-full rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 py-2 text-sm text-spice-text-primary caret-spice-palette-purple',
              SPICE_INPUT_FOCUS_CLASSNAME,
            )}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-spice-text-primary">
            Description
          </span>
          <LimitedTextarea
            id="video-metadata-description"
            value={description}
            maxLength={FIELD_LIMITS.description}
            disabled={isSaving}
            rows={3}
            textareaClassName="min-h-0 rounded-lg border-spice-border-mid"
            onChange={setDescription}
          />
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-spice-text-primary">
              Thumbnail
            </span>
            <button
              type="button"
              disabled={isSaving}
              title={
                thumbnailPreviewUrl ? 'Edit thumbnail' : 'Upload thumbnail'
              }
              aria-label={
                thumbnailPreviewUrl ? 'Edit thumbnail' : 'Upload thumbnail'
              }
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md p-1 text-spice-text-muted transition-colors hover:bg-spice-bg-tint hover:text-spice-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
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
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </div>
          <p className="text-[10px] leading-snug text-spice-text-muted">
            {THUMBNAIL_ACCEPT_SIZE_HINT}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={VIDEO_THUMBNAIL_ACCEPT}
            className="sr-only"
            onChange={handleThumbnailChange}
          />
          {thumbnailPreviewUrl ? (
            <div className="flex max-h-[220px] min-h-[140px] w-full items-center justify-center overflow-hidden rounded-lg border border-spice-border bg-spice-bg-tint p-2">
              <img
                src={thumbnailPreviewUrl}
                alt="Video thumbnail preview"
                draggable={false}
                className="max-h-[200px] max-w-full object-contain"
              />
            </div>
          ) : isLoadingExistingThumbnail ? (
            <div
              className="flex min-h-[140px] w-full animate-pulse items-center justify-center rounded-lg border border-spice-border bg-spice-bg-tint"
              aria-label="Loading thumbnail"
            >
              <span className="text-[11px] font-medium text-spice-text-muted">
                Loading thumbnail…
              </span>
            </div>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[140px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-spice-border bg-spice-bg-tint text-center transition-colors hover:bg-spice-bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-[11px] font-medium text-spice-text-muted">
                Add thumbnail
              </span>
            </button>
          )}
        </div>

        <ModalActionBar
          className="border-0 px-0 pb-0 pt-1"
          confirmLabel="Save"
          confirmingLabel="Saving…"
          isConfirming={isSaving}
          onCancel={onClose}
          onConfirm={() => void handleSave()}
        />
      </Card>
    </Modal>
  );
};
