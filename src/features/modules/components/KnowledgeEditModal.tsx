import { Button, Card, ImagePicker, Modal } from '@/components/ui';
import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';
import type { KnowledgeLibraryItem } from '@/features/modules/types/knowledgeLibrary.types';

export interface KnowledgeEditModalProps {
  open: boolean;
  asset: KnowledgeLibraryItem | null;
  title: string;
  thumbnailFile: File | null;
  error: string;
  disabled: boolean;
  isSaving: boolean;
  onTitleChange: (title: string) => void;
  onThumbnailChange: (file: File | null) => void;
  onClose: () => void;
  onSave: () => void;
}

export function KnowledgeEditModal({
  open,
  asset,
  title,
  thumbnailFile,
  error,
  disabled,
  isSaving,
  onTitleChange,
  onThumbnailChange,
  onClose,
  onSave,
}: KnowledgeEditModalProps) {
  const { url: existingThumbnailUrl } = usePresignedFileUrl(
    open ? asset?.thumbnailStoragePath : null,
  );
  const thumbnailValue: File | string | null =
    thumbnailFile ?? existingThumbnailUrl;

  return (
    <Modal
      open={open}
      labelledBy="knowledge-edit-title"
      onClose={() => {
        if (disabled) return;
        onClose();
      }}
    >
      <Card
        variant="elevated"
        className="w-full max-w-lg border-spice-border p-0 shadow-lg"
      >
        <div className="space-y-4 p-5 pb-4">
          <h2
            id="knowledge-edit-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            Edit Knowledge Asset
          </h2>

          {error ? (
            <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
              {error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label
              htmlFor="knowledge-edit-title-input"
              className="text-xs font-semibold tracking-wide text-spice-text-medium"
            >
              Title
            </label>
            <input
              id="knowledge-edit-title-input"
              type="text"
              value={title}
              disabled={disabled}
              onChange={(e) => onTitleChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:border-spice-brand-primary/40 focus:ring-2 focus:ring-spice-brand-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
              Thumbnail
            </div>
            <ImagePicker
              variant="compact"
              value={thumbnailValue}
              onChange={onThumbnailChange}
              disabled={disabled}
              accept="image/*"
              label="Choose thumbnail"
              labelWhenSelected="Change thumbnail"
              previewAlt="Knowledge thumbnail"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-spice-border px-5 py-3">
          <Button
            variant="ghost"
            className="h-9 px-3 text-sm"
            disabled={disabled}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="h-9 px-3 text-sm"
            disabled={disabled || !title.trim() || !asset}
            onClick={onSave}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
