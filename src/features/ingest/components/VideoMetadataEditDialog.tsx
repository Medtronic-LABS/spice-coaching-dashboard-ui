import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, Card, Loader, Modal } from '@/components/ui';
import {
  useUpdateSourceDocumentMetadataMutation,
  useUpdateSourceDocumentThumbnailMutation,
  type SourceDocumentSummary,
} from '@/features/modules/api/adminSourceDocumentsApi';
import {
  VIDEO_THUMBNAIL_ACCEPT,
  formatVideoThumbnailRejectionError,
  isAcceptedVideoThumbnailFile,
} from '@/features/ingest/utils/videoThumbnail';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';

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
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    null,
  );
  const [fieldError, setFieldError] = useState('');
  const [actionError, setActionError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateMetadata, { isLoading: isSavingMetadata }] =
    useUpdateSourceDocumentMetadataMutation();
  const [updateThumbnail, { isLoading: isSavingThumbnail }] =
    useUpdateSourceDocumentThumbnailMutation();

  const isSaving = isSavingMetadata || isSavingThumbnail;

  useEffect(() => {
    if (!open || !document) return;
    setTitle(document.title);
    setDescription(document.description ?? '');
    setThumbnailFile(null);
    setThumbnailPreviewUrl(document.thumbnail_presigned_url ?? null);
    setFieldError('');
    setActionError('');
  }, [open, document]);

  useEffect(() => {
    if (!thumbnailFile) return;
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreviewUrl(url);
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

    setFieldError('');
    setActionError('');

    try {
      let latest = document;
      const descriptionValue = description.trim() ? description.trim() : null;
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
      setActionError(formatRtkQueryError(error));
    }
  };

  return (
    <Modal
      open={open}
      labelledBy="video-metadata-edit-title"
      onClose={isSaving ? () => undefined : onClose}
    >
      <Loader open={isSaving} label="Saving video details…" />
      <Card
        variant="elevated"
        className="w-full max-w-lg space-y-4 border-spice-border p-4 shadow-lg sm:p-6"
      >
        <h2
          id="video-metadata-edit-title"
          className="text-lg font-semibold text-spice-text-primary"
        >
          Edit video details
        </h2>

        {actionError ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {actionError}
          </div>
        ) : null}
        {fieldError ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {fieldError}
          </div>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-spice-text-primary">
            Title <span className="text-spice-semantic-error">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isSaving}
            className="w-full rounded-md border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm text-spice-text-primary outline-none focus:border-spice-brand-primary focus:ring-2 focus:ring-spice-brand-primary/20"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-spice-text-primary">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSaving}
            rows={3}
            className="w-full resize-y rounded-md border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm text-spice-text-primary outline-none focus:border-spice-brand-primary focus:ring-2 focus:ring-spice-brand-primary/20"
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
          <input
            ref={fileInputRef}
            type="file"
            accept={VIDEO_THUMBNAIL_ACCEPT}
            className="sr-only"
            onChange={handleThumbnailChange}
          />
          {thumbnailPreviewUrl ? (
            <div className="overflow-hidden rounded-lg border border-spice-border bg-spice-bg-tint">
              <img
                src={thumbnailPreviewUrl}
                alt="Video thumbnail preview"
                className="aspect-video w-full object-cover"
              />
            </div>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-dashed border-spice-border bg-spice-bg-tint text-center transition-colors hover:bg-spice-bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-[11px] font-medium text-spice-text-muted">
                Add thumbnail
              </span>
              <span className="mt-0.5 text-[10px] text-spice-text-muted">
                PNG, JPEG, or WebP · max 5 MB
              </span>
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="secondary"
            className="h-9 text-xs"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="h-9 text-xs"
            disabled={isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Card>
    </Modal>
  );
};
