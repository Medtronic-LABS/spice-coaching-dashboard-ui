import {
  Card,
  FormLabel,
  ImagePicker,
  LimitedTextInput,
  Modal,
  ModalActionBar,
  ModalTitle,
} from '@/components/ui';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { SPICE_INPUT_FOCUS_CLASSNAME } from '@/constants/formControls';
import { THUMBNAIL_ACCEPT_SIZE_HINT } from '@/constants/uploadLimits';
import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';
import type { KnowledgeLibraryItem } from '@/features/knowledge-library/types/knowledgeLibrary.types';
import { IMAGE_FILE_INPUT_ACCEPT } from '@/utils/acceptedImageFile';
import { cn } from '@/utils';

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
      contentClassName="max-w-lg"
      onClose={() => {
        if (disabled) return;
        onClose();
      }}
    >
      <Card
        variant="elevated"
        className="w-full border-spice-border p-0 shadow-lg"
      >
        <div className="space-y-4 p-5 pb-4 pr-12">
          <ModalTitle id="knowledge-edit-title">Edit Knowledge</ModalTitle>

          {error ? (
            <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
              {error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <FormLabel htmlFor="knowledge-edit-title-input">Title</FormLabel>
            <LimitedTextInput
              id="knowledge-edit-title-input"
              value={title}
              maxLength={FIELD_LIMITS.documentTitle}
              disabled={disabled}
              onChange={onTitleChange}
              inputClassName={cn(
                'h-10 w-full rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary caret-spice-palette-purple',
                SPICE_INPUT_FOCUS_CLASSNAME,
              )}
            />
          </div>

          <div className="space-y-1.5">
            <FormLabel>Thumbnail</FormLabel>
            <ImagePicker
              variant="compact"
              value={thumbnailValue}
              onChange={onThumbnailChange}
              disabled={disabled}
              accept={IMAGE_FILE_INPUT_ACCEPT}
              label="Choose thumbnail"
              labelWhenSelected="Change thumbnail"
              hint={THUMBNAIL_ACCEPT_SIZE_HINT}
              previewAlt="Knowledge thumbnail"
              previewObjectFit="contain"
            />
          </div>
        </div>

        <ModalActionBar
          className="px-5 py-3"
          confirmLabel="Save"
          confirmingLabel="Saving…"
          isConfirming={isSaving}
          cancelDisabled={disabled}
          confirmDisabled={disabled || !title.trim() || !asset}
          onCancel={onClose}
          onConfirm={onSave}
        />
      </Card>
    </Modal>
  );
}
