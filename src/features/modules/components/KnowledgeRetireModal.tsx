import { Button, Card, Modal } from '@/components/ui';
import type { KnowledgeLibraryItem } from '@/features/modules/types/knowledgeLibrary.types';

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
    <Modal
      open={open}
      labelledBy="knowledge-retire-title"
      onClose={() => {
        if (disabled) return;
        onClose();
      }}
    >
      <Card
        variant="elevated"
        className="w-full max-w-xl border-spice-border p-0 shadow-lg"
      >
        <div className="shrink-0 space-y-4 p-6 pb-4">
          <h2
            id="knowledge-retire-title"
            className="text-xl font-semibold text-spice-text-primary"
          >
            Remove Knowledge Document
          </h2>
          {error ? (
            <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
              {error}
            </div>
          ) : null}
          <p className="text-sm text-spice-text-muted">
            This will retire the document and hide it from devices. Stored files
            are kept.
            {asset ? (
              <>
                {' '}
                Document: <span className="font-semibold">{asset.title}</span>.
              </>
            ) : null}
          </p>
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
            disabled={disabled || !asset}
            onClick={onConfirm}
          >
            {isRetiring ? 'Removing…' : 'Confirm Remove'}
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
