import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui';
import { BadgeImageThumb } from '@/features/badges/components/BadgeImageThumb';
import {
  useLazyGetAdminFilePresignedUrlQuery,
  useUploadAdminFileMutation,
} from '@/features/modules/api/adminFilesApi';
import { getMutationErrorMessage } from '@/features/badges/utils/badgeForm';
import { cn } from '@/utils';

const ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

export interface BadgeImageUploadValue {
  storagePath: string;
  objectName: string;
  previewUrl: string;
}

interface BadgeImageUploadFieldProps {
  value: BadgeImageUploadValue;
  required?: boolean;
  disabled?: boolean;
  onUploaded: (value: BadgeImageUploadValue) => void;
  onError?: (message: string) => void;
}

function isAcceptedImage(file: File): boolean {
  const type = file.type.toLowerCase();
  return (
    type === 'image/png' ||
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    type === 'image/webp'
  );
}

export const BadgeImageUploadField = ({
  value,
  required = false,
  disabled = false,
  onUploaded,
  onError,
}: BadgeImageUploadFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState('');

  const [uploadAdminFile, { isLoading: isUploading }] =
    useUploadAdminFileMutation();
  const [getPresignedUrl] = useLazyGetAdminFilePresignedUrlQuery();

  useEffect(() => {
    if (!pendingFile) {
      setLocalPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const openFilePicker = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;

    if (!isAcceptedImage(file) || file.size > MAX_BYTES) {
      const message = 'Invalid image. Use PNG, JPEG, or WebP up to 5 MB.';
      setFieldError(message);
      onError?.(message);
      setPendingFile(null);
      return;
    }

    setFieldError('');
    setPendingFile(file);
  };

  const handleUpload = async () => {
    if (!pendingFile) {
      const message = 'Choose an image before uploading.';
      setFieldError(message);
      onError?.(message);
      return;
    }

    setFieldError('');
    try {
      const uploadResponse = await uploadAdminFile({
        file: pendingFile,
        prefix: 'badges',
      }).unwrap();
      const presigned = await getPresignedUrl({
        object_name: uploadResponse.object_name,
        expires_seconds: 600,
      }).unwrap();

      onUploaded({
        storagePath: uploadResponse.storage_path,
        objectName: uploadResponse.object_name,
        previewUrl: presigned.presigned_url,
      });
      setPendingFile(null);
    } catch (error) {
      const message =
        getMutationErrorMessage(error) || 'Failed to upload image.';
      setFieldError(message);
      onError?.(message);
    }
  };

  const displayPreviewUrl = localPreviewUrl || value.previewUrl;
  const hasStoredImage = Boolean(value.storagePath);
  const showPreview = Boolean(displayPreviewUrl) || hasStoredImage;
  const busy = disabled || isUploading;
  const isUploaded = hasStoredImage && !pendingFile;
  const uploadLabel = isUploading
    ? 'Uploading…'
    : isUploaded
      ? 'Uploaded'
      : 'Upload';

  return (
    <div className="space-y-2 rounded-xl bg-spice-bg-surface p-3 ring-1 ring-spice-border">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
          Badge image
          {required ? (
            <span className="text-spice-semantic-error"> *</span>
          ) : null}
        </span>
        {showPreview ? (
          <button
            type="button"
            disabled={busy}
            title="Change badge image"
            aria-label="Change badge image"
            onClick={openFilePicker}
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
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={busy}
        onChange={handleFileChange}
      />

      {showPreview ? (
        <div className="mx-auto h-32 w-32 overflow-hidden rounded-lg border border-spice-border bg-spice-bg-tint">
          {displayPreviewUrl ? (
            <img
              src={displayPreviewUrl}
              alt="Badge preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <BadgeImageThumb
              storagePath={value.storagePath}
              objectName={value.objectName}
              alt="Badge preview"
              className="h-full w-full rounded-none border-0"
            />
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={openFilePicker}
          className={cn(
            'mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-lg border border-dashed border-spice-border bg-spice-bg-tint px-2 text-center transition-colors',
            'hover:bg-spice-bg-surface group disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <svg
            className="mx-auto h-5 w-5 text-spice-text-muted opacity-60 transition-opacity group-hover:opacity-100"
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
          <span className="mt-1 block text-[10px] font-medium text-spice-text-muted">
            Add image
          </span>
        </button>
      )}

      <Button
        type="button"
        variant="secondary"
        className="h-8 w-full text-xs"
        disabled={busy || !pendingFile || isUploaded}
        onClick={() => void handleUpload()}
      >
        {uploadLabel}
      </Button>

      {pendingFile ? (
        <p className="break-all text-[10px] leading-snug text-spice-text-muted">
          Selected: {pendingFile.name}
        </p>
      ) : isUploaded ? (
        <p className="text-[10px] text-spice-text-muted">Image uploaded</p>
      ) : null}

      {fieldError ? (
        <p className="text-[10px] text-spice-semantic-error" role="alert">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
};
