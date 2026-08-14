import { useEffect, useId, useRef } from 'react';
import { ChevronIcon } from '@/assets/icon';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Button } from '@/components/ui';
import { Tooltip } from '@/components/ui/Tooltip';
import type { AdminV3IngestBatchSourceStatus } from '@/features/ingest/api/adminIngestApi';
import { IngestFlowStatusLabel } from '@/features/ingest/components/IngestFlowStatusLabel';
import {
  countGeneratedModulesFromSource,
  countReviewPendingModulesFromSource,
  getVisibleIngestBatchNodes,
  formatIngestDocumentProgressStatus,
  getIngestSourceStepLabel,
  getLatestIngestSourceStep,
  hasSimilarityDetectedInSource,
} from '@/features/ingest/utils/ingestSourceProgress';
import { extractFirstIngestFailureTooltipMessage } from '@/features/ingest/utils/extractIngestErrorMessage';
import {
  formatIngestRunStatusDisplay,
  ingestRunStatusBadgeClassName,
  ingestRunStatusTone,
} from '@/features/ingest/utils/ingestRunHistoryUtils';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { cn } from '@/utils';

export interface IngestDocumentProgressCardProps {
  source: AdminV3IngestBatchSourceStatus;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onGoToDrafts?: (sourceDocumentId: string, documentLabel: string) => void;
  onGoToNeedsReview?: (sourceDocumentId: string, documentLabel: string) => void;
}

export const IngestDocumentProgressCard = ({
  source,
  expanded,
  onExpandedChange,
  onGoToDrafts,
  onGoToNeedsReview,
}: IngestDocumentProgressCardProps) => {
  const reactId = useId();
  const panelId = `${reactId}-panel`;
  const headingId = `${reactId}-heading`;
  const nodes = getVisibleIngestBatchNodes(source.nodes ?? []);
  const processingStatus = formatIngestDocumentProgressStatus(source.status);
  const documentStatusTone = ingestRunStatusTone(source.status);
  const isCompleted = processingStatus === 'Completed';
  const showIndeterminateLoader =
    processingStatus === 'Queued' || processingStatus === 'Running';
  const latestStep = getLatestIngestSourceStep(nodes);
  const latestStepLabel = getIngestSourceStepLabel(latestStep);
  const latestStepPath = latestStep?.path ?? null;
  const latestStepRef = useRef<HTMLDivElement | null>(null);
  const generatedModuleCount = countGeneratedModulesFromSource(source);
  const reviewPendingModuleCount = countReviewPendingModulesFromSource(source);
  const similarityDetected = hasSimilarityDetectedInSource(source);
  const reviewModuleCount =
    reviewPendingModuleCount > 0
      ? reviewPendingModuleCount
      : generatedModuleCount;
  const failureTooltipMessage =
    processingStatus === 'Failed'
      ? extractFirstIngestFailureTooltipMessage([source, ...nodes])
      : null;

  useEffect(() => {
    if (!expanded || !latestStepPath) return;
    latestStepRef.current?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [expanded, latestStepPath]);

  const documentName =
    source.document_label.trim() || source.source_document_id;

  const moduleAction =
    isCompleted && generatedModuleCount > 0 ? (
      similarityDetected ? (
        <Button
          className="h-8 shrink-0 text-xs"
          onClick={() =>
            onGoToNeedsReview?.(source.source_document_id, documentName)
          }
        >
          Review Modules ({reviewModuleCount})
        </Button>
      ) : (
        <Button
          className="h-8 shrink-0 text-xs"
          onClick={() =>
            onGoToDrafts?.(source.source_document_id, documentName)
          }
        >
          Open Modules ({generatedModuleCount})
        </Button>
      )
    ) : null;

  return (
    <div className="rounded-xl border border-spice-border bg-spice-bg-surface">
      <div className="flex items-start gap-3 px-3 py-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div id={headingId} className="min-w-0">
              <div className="truncate text-sm font-semibold text-spice-text-primary">
                {documentName}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ingestRunStatusBadgeClassName(
                  documentStatusTone,
                )}`}
              >
                {formatIngestRunStatusDisplay(source.status)}
              </span>
              {failureTooltipMessage ? (
                <Tooltip
                  label={failureTooltipMessage}
                  content={failureTooltipMessage}
                />
              ) : null}
              {moduleAction}
            </div>
          </div>

          {!expanded ? (
            <div className="space-y-1.5" role="status" aria-live="polite">
              <div className="flex items-center justify-between gap-2 text-xs text-spice-text-muted">
                {isCompleted ? (
                  <span className="min-w-0 truncate">
                    {source.started_at
                      ? `Started: ${formatDisplayDateTime(source.started_at)}`
                      : 'Started: —'}
                    {source.completed_at
                      ? ` · Completed: ${formatDisplayDateTime(source.completed_at)}`
                      : ''}
                  </span>
                ) : (
                  <span className="truncate">
                    {latestStepLabel
                      ? `Latest: ${latestStepLabel}`
                      : nodes.length
                        ? 'Waiting for pipeline steps…'
                        : 'No pipeline steps yet'}
                  </span>
                )}
                {isCompleted ? (
                  <span className="shrink-0 font-mono">100%</span>
                ) : null}
              </div>
              <ProgressBar
                value={isCompleted ? 100 : 0}
                indeterminate={showIndeterminateLoader}
              />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-spice-text-muted transition-colors',
            'hover:bg-spice-bg-tint hover:text-spice-text-primary',
          )}
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={
            expanded
              ? `Collapse pipeline for ${documentName}`
              : `Expand pipeline for ${documentName}`
          }
          onClick={() => onExpandedChange(!expanded)}
        >
          <ChevronIcon expanded={expanded} className="h-4 w-4" />
        </button>
      </div>

      {expanded ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headingId}
          className="max-h-80 space-y-2 overflow-y-auto border-t border-spice-border px-3 py-3"
        >
          {nodes.length ? (
            nodes.map((node) => {
              const isLatest = node.path === latestStepPath;
              return (
                <div
                  key={node.path}
                  ref={isLatest ? latestStepRef : undefined}
                  className={cn(
                    'rounded-lg border bg-spice-bg-surface px-3 py-2',
                    isLatest
                      ? 'border-spice-brand-primary/40'
                      : 'border-spice-border',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-spice-text-primary">
                        {node.title || node.key}
                      </span>
                    </div>
                    <IngestFlowStatusLabel
                      status={node.status}
                      failureContext={node}
                    />
                  </div>
                  <div className="mt-1 text-xs text-spice-text-muted">
                    {node.started_at
                      ? `Started: ${formatDisplayDateTime(node.started_at)}`
                      : '—'}
                    {node.completed_at
                      ? ` · Completed: ${formatDisplayDateTime(node.completed_at)}`
                      : ''}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-spice-text-muted">No nodes yet.</div>
          )}
        </div>
      ) : null}
    </div>
  );
};
