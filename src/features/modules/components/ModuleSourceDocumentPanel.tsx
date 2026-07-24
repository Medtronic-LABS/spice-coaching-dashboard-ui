import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import type { AdminModuleSourceDocument } from '@/features/modules/api/adminModulesApi';
import {
  sourceDocumentIsPdf,
  sourceDocumentLabel,
} from '@/features/modules/utils/sourceDocument';

export interface ModuleSourceDocumentPanelProps {
  documents: AdminModuleSourceDocument[];
  className?: string;
  onClose?: () => void;
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

export const ModuleSourceDocumentPanel = ({
  documents,
  className = '',
  onClose,
}: ModuleSourceDocumentPanelProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex((index) => clampIndex(index, documents.length));
  }, [documents]);

  if (!documents.length) {
    return null;
  }

  const safeIndex = clampIndex(selectedIndex, documents.length);
  const active = documents[safeIndex];
  if (!active) return null;

  const label = sourceDocumentLabel(active);
  const showPdf = sourceDocumentIsPdf(active);
  const multiple = documents.length > 1;

  return (
    <Card
      variant="elevated"
      className={`flex min-h-0 flex-col overflow-hidden ${className}`.trim()}
    >
      <div className="shrink-0 space-y-2 border-b border-spice-border p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
              {multiple ? 'Source documents' : 'Source document'}
            </div>
            <div className="mt-1 text-sm font-semibold text-spice-text-primary">
              Compare with original
              {multiple ? (
                <span className="ml-1 font-normal text-spice-text-muted">
                  ({documents.length} files)
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] text-spice-text-muted">
              {multiple
                ? 'Choose a file below to preview while reviewing cards.'
                : 'Review card content against the ingested file.'}
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              className="shrink-0 text-[11px] font-semibold text-spice-text-muted hover:text-spice-text-primary"
              onClick={onClose}
            >
              Close
            </button>
          ) : null}
        </div>

        {multiple ? (
          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-spice-text-muted">
              Active file ({safeIndex + 1} of {documents.length})
            </span>
            <select
              className="select-arrow h-9 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-2 text-xs text-spice-text-primary"
              value={safeIndex}
              onChange={(event) => setSelectedIndex(Number(event.target.value))}
            >
              {documents.map((doc, index) => (
                <option key={doc.source_document_id} value={index}>
                  {index + 1}. {sourceDocumentLabel(doc)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="truncate text-xs text-spice-text-medium" title={label}>
            {label}
          </p>
        )}

        <a
          href={active.presigned_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-semibold text-spice-brand-primary underline"
        >
          Open current file in new tab
        </a>
      </div>

      <div className="min-h-[min(70vh,720px)] flex-1 bg-spice-bg-tint p-2">
        {showPdf ? (
          <iframe
            key={active.source_document_id}
            title={label}
            src={active.presigned_url}
            className="h-full min-h-[min(68vh,700px)] w-full rounded-lg border border-spice-border bg-white"
          />
        ) : (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-spice-border bg-spice-bg-surface p-6 text-center">
            <p className="text-sm text-spice-text-medium">
              Preview is not available for this file type.
            </p>
            <a
              href={active.presigned_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-spice-brand-primary underline"
            >
              Download or open source file
            </a>
          </div>
        )}
      </div>
    </Card>
  );
};
