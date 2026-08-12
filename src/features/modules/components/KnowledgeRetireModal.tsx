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
      describedBy="knowledge-retire-description"
      onClose={() => {
        if (disabled) return;
        onClose();
      }}
    >
      <Card
        variant="elevated"
        className="w-full max-w-md border-spice-border p-0 shadow-lg"
      >
        <div className="space-y-3 p-6 pb-4">
          <h2
            id="knowledge-retire-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            Remove Knowledge Document
          </h2>

          <p
            id="knowledge-retire-description"
            className="text-sm text-spice-text-medium"
          >
            Are you sure you want to remove{' '}
            {asset ? (
              <span className="font-medium text-spice-text-primary">
                “{asset.title}”
              </span>
            ) : (
              'this knowledge document'
            )}
            ?
          </p>

          <p className="text-sm text-spice-text-medium">
            This will retire the knowledge document and remove it from users’
            access and active assignments. The original uploaded document will
            be retained.
          </p>

          {error ? (
            <div
              className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error"
              role="alert"
            >
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-spice-border px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="ghost"
            className="h-9 text-xs"
            disabled={disabled}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="h-9 bg-spice-semantic-error text-xs hover:bg-spice-semantic-error/90"
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
