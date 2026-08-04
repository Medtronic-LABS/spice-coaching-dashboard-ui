import { useEffect, useMemo, useState } from 'react';
import { Table, type ColumnDef } from '@/components/common/Table';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Tooltip } from '@/components/ui/Tooltip';
import type { IngestDuplicateConflict } from '@/features/ingest/api/adminIngestApi';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

export type DuplicateIngestDialogVariant = 'upload' | 'blocked' | 'skipped';

export interface DuplicateIngestConfirmDialogProps {
  open: boolean;
  variant: DuplicateIngestDialogVariant;
  conflicts: IngestDuplicateConflict[];
  onCancel: () => void;
  /** Selected filenames to override. Empty means reuse existing for all. */
  onConfirm: (selectedFilenames: string[]) => void;
  isConfirming?: boolean;
}

const UPLOAD_DUPLICATE_TOOLTIP =
  'One or more selected files match content that has already been uploaded. Select files to upload these files as new sources. Leave files unselected to reuse the existing uploaded source.';

const INGEST_BLOCKED_TOOLTIP =
  'One or more selected documents match content that has already been ingested. Select documents to re-ingest them. Leave documents unselected to keep using the existing ingested source.';

const INGEST_SKIPPED_TOOLTIP =
  'One or more documents with similar content were already ingested and were not queued. Select documents to re-ingest them. Leave documents unselected to keep using the existing ingested source.';

type ConflictRow = IngestDuplicateConflict & { _key: string };

function conflictKey(conflict: IngestDuplicateConflict): string {
  return `${conflict.filename}-${conflict.content_sha256}`;
}

function TruncatedTooltipText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <Tooltip label={text} content={text}>
      <span className={className}>{text}</span>
    </Tooltip>
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
  const isUpload = variant === 'upload';
  const isBlocked = variant === 'blocked';
  const allFilenames = useMemo(
    () => conflicts.map((conflict) => conflict.filename),
    [conflicts],
  );
  const [selectedFilenames, setSelectedFilenames] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelectedFilenames([]);
  }, [allFilenames, open]);

  if (!open) return null;

  const selectedCount = selectedFilenames.length;
  const conflictCount = conflicts.length;

  const title = isUpload
    ? 'Duplicate file detected'
    : isBlocked
      ? conflictCount === 1
        ? 'Document already ingested'
        : 'Documents already ingested'
      : conflictCount === 1
        ? 'Document was skipped'
        : 'Some documents were skipped';

  const tooltip = isUpload
    ? {
        label: 'About duplicate file upload',
        content: UPLOAD_DUPLICATE_TOOLTIP,
      }
    : isBlocked
      ? {
          label: 'About duplicate ingest',
          content: INGEST_BLOCKED_TOOLTIP,
        }
      : {
          label: 'About skipped duplicate ingest',
          content: INGEST_SKIPPED_TOOLTIP,
        };

  const toggleFilename = (filename: string, checked: boolean) => {
    setSelectedFilenames((previous) => {
      if (checked) {
        if (previous.includes(filename)) return previous;
        return [...previous, filename];
      }
      return previous.filter((name) => name !== filename);
    });
  };

  const tableData: ConflictRow[] = conflicts.map((conflict) => ({
    ...conflict,
    _key: conflictKey(conflict),
  }));

  const columns: ColumnDef<ConflictRow>[] = [
    {
      key: 'filename',
      header: '',
      headerClassName: 'w-8 px-2 py-2 text-center sm:px-2',
      className: 'w-8 px-2 py-2 align-middle text-center sm:px-2',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedFilenames.includes(row.filename)}
          disabled={isConfirming}
          onChange={(event) =>
            toggleFilename(row.filename, event.target.checked)
          }
          aria-label={
            isUpload
              ? `Select ${row.filename} to upload as new source`
              : `Select ${row.filename} to re-ingest`
          }
        />
      ),
    },
    {
      key: 'title',
      header: 'File name',
      headerClassName: 'w-[55%] px-3 py-2 sm:px-3',
      className:
        'w-[55%] min-w-0 px-3 py-2 align-middle whitespace-normal sm:px-3',
      render: (row) => {
        const latest = row.existing_source_documents[0];
        return (
          <div className="min-w-0">
            <TruncatedTooltipText
              text={row.filename}
              className="block truncate font-medium text-spice-text-primary"
            />
            {!isUpload && latest?.ingested_at ? (
              <div className="mt-0.5 truncate text-[11px] text-spice-text-muted">
                Last ingested {formatDisplayDateTime(latest.ingested_at)}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'content_sha256',
      header: 'Existing source',
      headerClassName: 'w-[45%] px-3 py-2 sm:px-3',
      className:
        'w-[45%] min-w-0 px-3 py-2 align-middle whitespace-normal text-xs text-spice-text-muted sm:px-3',
      render: (row) => {
        const latest = row.existing_source_documents[0];
        const label = latest?.title || row.title || '—';
        return (
          <TruncatedTooltipText
            text={label}
            className="block truncate text-xs text-spice-text-muted"
          />
        );
      },
    },
  ];

  const secondaryLabel = isUpload
    ? isConfirming
      ? 'Uploading…'
      : 'Skip Upload'
    : isConfirming
      ? 'Re-ingesting…'
      : 'Keep Existing';

  const primaryLabel = isUpload
    ? isConfirming
      ? 'Uploading…'
      : 'Upload as New Source'
    : isConfirming
      ? 'Re-ingesting…'
      : 'Re-ingest';

  return (
    <Modal
      open={open}
      labelledBy="duplicate-ingest-title"
      onClose={isConfirming ? undefined : onCancel}
      zIndexClassName="z-[110]"
    >
      <Card
        variant="elevated"
        className="w-full max-w-2xl space-y-4 border-spice-border p-6 shadow-lg"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2
              id="duplicate-ingest-title"
              className="text-lg font-semibold text-spice-text-primary"
            >
              {title}
            </h2>
            <Tooltip label={tooltip.label} content={tooltip.content} />
          </div>
        </div>

        <Table
          data={tableData}
          columns={columns}
          keyExtractor={(row) => row._key}
          emptyMessage="No conflicts."
          containerClassName="overflow-hidden"
          className="table-fixed w-full"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-spice-text-muted">
            {selectedCount}/{conflictCount}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => onConfirm([])}
              disabled={isConfirming}
            >
              {secondaryLabel}
            </Button>
            <Button
              onClick={() => onConfirm(selectedFilenames)}
              disabled={isConfirming || selectedCount === 0}
            >
              {primaryLabel}
            </Button>
          </div>
        </div>
      </Card>
    </Modal>
  );
};
