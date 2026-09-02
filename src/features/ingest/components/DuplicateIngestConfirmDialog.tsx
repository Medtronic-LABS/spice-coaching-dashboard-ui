import { useEffect, useMemo, useState } from 'react';
import { Table, type ColumnDef } from '@/components/common/Table';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { OVERLAY_Z_INDEX } from '@/components/ui/overlayZIndex';
import { Tooltip } from '@/components/ui/Tooltip';
import type { IngestDuplicateConflict } from '@/features/ingest/api/adminIngestApi';
import { SPICE_CHECKBOX_CLASSNAME } from '@/constants/formControls';
import {
  useLazyFetchSourceDocumentsQuery,
  type SourceDocumentSummary,
} from '@/features/modules/api/adminSourceDocumentsApi';
import { formatHierarchyActorName } from '@/features/modules/types/hierarchyActor';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { cn } from '@/utils';

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

type ConflictRow = IngestDuplicateConflict & {
  _key: string;
  uploadedAt: string;
  uploadedBy: string;
  ingestedBy: string;
};

type ExistingSourceMeta = {
  uploadedAt: string;
  uploadedBy: string | null;
  ingestedBy: string | null;
};

function conflictKey(conflict: IngestDuplicateConflict): string {
  return `${conflict.filename}-${conflict.content_sha256}`;
}

function latestExistingSource(conflict: IngestDuplicateConflict) {
  return conflict.existing_source_documents[0];
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

function metaFromSummary(doc: SourceDocumentSummary): ExistingSourceMeta {
  return {
    uploadedAt: doc.uploaded_date || doc.ingested_at,
    uploadedBy: doc.uploaded_by?.name ?? null,
    ingestedBy: doc.ingested_by?.name ?? null,
  };
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
  const [existingMetaById, setExistingMetaById] = useState<
    Map<string, ExistingSourceMeta>
  >(() => new Map());
  const [fetchSourceDocuments] = useLazyFetchSourceDocumentsQuery();

  useEffect(() => {
    if (!open) return;
    setSelectedFilenames([]);
  }, [allFilenames, open]);

  useEffect(() => {
    if (!open) {
      setExistingMetaById(new Map());
      return;
    }

    const lookups = conflicts
      .map((conflict) => {
        const existing = latestExistingSource(conflict);
        if (!existing) return null;
        return {
          sourceDocumentId: existing.source_document_id,
          query: (
            existing.original_filename?.trim() ||
            conflict.filename.trim() ||
            existing.title.trim()
          ).trim(),
        };
      })
      .filter((entry): entry is { sourceDocumentId: string; query: string } =>
        Boolean(entry?.sourceDocumentId && entry.query),
      );

    if (lookups.length === 0) {
      setExistingMetaById(new Map());
      return;
    }

    let cancelled = false;

    void (async () => {
      const next = new Map<string, ExistingSourceMeta>();
      const queried = new Set<string>();

      for (const lookup of lookups) {
        if (next.has(lookup.sourceDocumentId)) continue;

        const queryKey = lookup.query.toLowerCase();
        if (!queried.has(queryKey)) {
          queried.add(queryKey);
          try {
            const response = await fetchSourceDocuments({
              q: lookup.query,
              limit: 50,
              sort_by: 'uploaded_date',
              sort_dir: 'desc',
            }).unwrap();
            for (const doc of response.source_documents) {
              next.set(doc.id, metaFromSummary(doc));
            }
          } catch {
            // Keep unresolved rows as "—" when catalog lookup fails.
          }
        }
      }

      if (!cancelled) {
        setExistingMetaById(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conflicts, fetchSourceDocuments, open]);

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
    uploadedAt: '',
    uploadedBy: '',
    ingestedBy: '',
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
          className={cn(SPICE_CHECKBOX_CLASSNAME, isConfirming && 'opacity-60')}
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
      headerClassName: isUpload
        ? 'w-[24%] px-3 py-2 sm:px-3'
        : 'w-[18%] px-3 py-2 sm:px-3',
      className: isUpload
        ? 'w-[24%] min-w-0 px-3 py-2 align-middle whitespace-normal sm:px-3'
        : 'w-[18%] min-w-0 px-3 py-2 align-middle whitespace-normal sm:px-3',
      render: (row) => (
        <TruncatedTooltipText
          text={row.filename}
          className="block truncate font-medium text-spice-text-primary"
        />
      ),
    },
    {
      key: 'content_sha256',
      header: 'Existing source',
      headerClassName: isUpload
        ? 'w-[22%] px-3 py-2 sm:px-3'
        : 'w-[16%] px-3 py-2 sm:px-3',
      className: isUpload
        ? 'w-[22%] min-w-0 px-3 py-2 align-middle whitespace-normal text-xs text-spice-text-muted sm:px-3'
        : 'w-[16%] min-w-0 px-3 py-2 align-middle whitespace-normal text-xs text-spice-text-muted sm:px-3',
      render: (row) => {
        const latest = latestExistingSource(row);
        const label = latest?.title || row.title || '—';
        return (
          <TruncatedTooltipText
            text={label}
            className="block truncate text-xs text-spice-text-muted"
          />
        );
      },
    },
    {
      key: 'uploadedAt',
      header: 'Uploaded',
      headerClassName: isUpload
        ? 'w-[30%] whitespace-nowrap px-3 py-2 sm:px-3'
        : 'w-[24%] whitespace-nowrap px-3 py-2 sm:px-3',
      className: isUpload
        ? 'w-[30%] whitespace-nowrap px-3 py-2 align-middle text-xs text-spice-text-medium sm:px-3'
        : 'w-[24%] whitespace-nowrap px-3 py-2 align-middle text-xs text-spice-text-medium sm:px-3',
      render: (row) => {
        const latest = latestExistingSource(row);
        const meta = latest
          ? existingMetaById.get(latest.source_document_id)
          : undefined;
        const uploadedAt = meta?.uploadedAt || latest?.ingested_at || '';
        return formatDisplayDateTime(uploadedAt) || '—';
      },
    },
    {
      key: 'uploadedBy',
      header: 'Uploaded by',
      headerClassName: isUpload
        ? 'w-[24%] whitespace-nowrap px-3 py-2 sm:px-3'
        : 'w-[16%] whitespace-nowrap px-3 py-2 sm:px-3',
      className: isUpload
        ? 'w-[24%] whitespace-nowrap px-3 py-2 align-middle text-xs text-spice-text-medium sm:px-3'
        : 'w-[16%] whitespace-nowrap px-3 py-2 align-middle text-xs text-spice-text-medium sm:px-3',
      render: (row) => {
        const latest = latestExistingSource(row);
        const meta = latest
          ? existingMetaById.get(latest.source_document_id)
          : undefined;
        return formatHierarchyActorName(meta?.uploadedBy);
      },
    },
    ...(isUpload
      ? []
      : [
          {
            key: 'ingestedBy' as const,
            header: 'Ingested by',
            headerClassName: 'w-[16%] whitespace-nowrap px-3 py-2 sm:px-3',
            className:
              'w-[16%] whitespace-nowrap px-3 py-2 align-middle text-xs text-spice-text-medium sm:px-3',
            render: (row: ConflictRow) => {
              const latest = latestExistingSource(row);
              const meta = latest
                ? existingMetaById.get(latest.source_document_id)
                : undefined;
              return formatHierarchyActorName(meta?.ingestedBy);
            },
          },
        ]),
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
      contentClassName="max-w-4xl"
      showCloseButton={false}
      onClose={isConfirming ? undefined : onCancel}
      zIndexClassName={OVERLAY_Z_INDEX.modal}
    >
      <Card
        variant="elevated"
        className="w-full space-y-4 border-spice-border p-6 shadow-lg"
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
