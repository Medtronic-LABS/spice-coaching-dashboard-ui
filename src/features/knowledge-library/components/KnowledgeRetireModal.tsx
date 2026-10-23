import { ConfirmDialog, QuotedDisplayLabel } from '@/components/ui';
import type { KnowledgeLibraryItem } from '@/features/knowledge-library/types/knowledgeLibrary.types';

export interface KnowledgeRetireModalProps {
  open: boolean;
  asset: KnowledgeLibraryItem | null;
  error: string;
  disabled: boolean;
  isRetiring: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function KnowledgeRetireModal({
  open,
  asset,
  error,
  disabled,
  isRetiring,
  onClose,
  onConfirm,
}: KnowledgeRetireModalProps) {
  return (
    <ConfirmDialog
      open={open}
      labelledBy="knowledge-retire-title"
      describedBy="knowledge-retire-description"
      title="Delete knowledge document"
      description={
        <>
          Are you sure you want to delete{' '}
          {asset ? (
            <QuotedDisplayLabel text={asset.title} />
          ) : (
            'this knowledge document'
          )}
          ?
        </>
      }
      confirmLabel="Delete"
      confirmingLabel="Deleting…"
      isConfirming={isRetiring}
      disabled={disabled}
      confirmDisabled={!asset}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <p className="text-sm text-spice-text-medium">
        This will retire the knowledge document and remove it from users’ access
        and active assignments. The original uploaded document will be retained.
      </p>

      {error ? (
        <div
          className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </ConfirmDialog>
  );
}
