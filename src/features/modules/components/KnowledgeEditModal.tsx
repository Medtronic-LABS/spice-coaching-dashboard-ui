import { Button, Card, ImagePicker, Modal } from '@/components/ui';
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
        className="w-full max-w-2xl border-spice-border p-0 shadow-lg"
      >
        <div className="shrink-0 space-y-4 p-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="knowledge-edit-title"
                className="text-xl font-semibold text-spice-text-primary"
              >
                Edit Knowledge Asset
              </h2>
              <p className="mt-1 text-xs text-spice-text-muted">
                {asset ? `ID: ${asset.id}` : null}
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
              Title
            </div>
            <input
              type="text"
              value={title}
              disabled={disabled}
              onChange={(e) => onTitleChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:border-spice-brand-primary/40 focus:ring-2 focus:ring-spice-brand-primary/20"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
              Custom thumbnail (optional)
            </div>
            <ImagePicker
              variant="compact"
              value={thumbnailFile}
              onChange={onThumbnailChange}
              disabled={disabled}
              accept="image/*"
              label="Choose thumbnail"
              labelWhenSelected="Change thumbnail"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-spice-border bg-spice-bg-surface/95 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="ghost"
            className="h-10 text-sm"
            disabled={disabled}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="h-10 min-w-[10rem] text-sm"
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
