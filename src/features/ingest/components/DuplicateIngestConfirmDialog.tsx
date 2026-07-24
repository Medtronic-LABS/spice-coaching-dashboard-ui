import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import type { IngestDuplicateConflict } from '@/features/ingest/api/adminIngestApi';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

export type DuplicateIngestDialogVariant = 'blocked' | 'skipped';

export interface DuplicateIngestConfirmDialogProps {
  open: boolean;
  variant: DuplicateIngestDialogVariant;
  conflicts: IngestDuplicateConflict[];
  onCancel: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
}

function ConflictList({ conflicts }: { conflicts: IngestDuplicateConflict[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-spice-text-medium">
      {conflicts.map((conflict) => {
        const latest = conflict.existing_source_documents[0];
        return (
          <li key={`${conflict.filename}-${conflict.content_sha256}`}>
            <span className="font-medium text-spice-text-primary">
              {conflict.filename}
            </span>
            {latest ? (
              <div className="mt-0.5 text-xs text-spice-text-muted">
                Last ingested {formatDisplayDateTime(latest.ingested_at)}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export const DuplicateIngestConfirmDialog = ({
  open,
  variant,
  conflicts,
  onCancel,
  onConfirm,
  isConfirming = false,
}: DuplicateIngestConfirmDialogProps) => {
  if (!open) return null;

  const isBlocked = variant === 'blocked';
  const count = conflicts.length;
  const title = isBlocked
    ? 'Similar content already exists'
    : 'Some files were skipped';

  const description =
    count === 1 && conflicts[0]
      ? isBlocked
        ? `We already have a file with the same content as ${conflicts[0].filename}. Uploading again will start a new ingestion. Do you want to continue?`
        : `${conflicts[0].filename} matches content we already ingested and was not queued. Re-ingest it anyway?`
      : isBlocked
        ? 'We already have files with the same content as the following. Uploading again will start new ingestions. Do you want to continue?'
        : `${count} files matched content we already ingested and were not queued. Re-ingest them anyway?`;

  return (
    <Modal
      open={open}
      labelledBy="duplicate-ingest-title"
      describedBy="duplicate-ingest-description"
      onClose={isConfirming ? undefined : onCancel}
      zIndexClassName="z-[110]"
    >
      <Card
        variant="elevated"
        className="w-full max-w-md space-y-4 border-spice-border p-6 shadow-lg"
      >
        <div className="space-y-2">
          <h2
            id="duplicate-ingest-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            {title}
          </h2>
          <p
            id="duplicate-ingest-description"
            className="text-sm text-spice-text-muted"
          >
            {description}
          </p>
          {count > 1 || (count === 1 && !isBlocked) ? (
            <ConflictList conflicts={conflicts} />
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isConfirming}
          >
            {isBlocked ? 'Cancel' : 'Dismiss'}
          </Button>
          <Button onClick={onConfirm} disabled={isConfirming}>
            {isConfirming
              ? 'Uploading…'
              : isBlocked
                ? 'Upload anyway'
                : 'Re-ingest skipped'}
          </Button>
        </div>
      </Card>
    </Modal>
  );
};
