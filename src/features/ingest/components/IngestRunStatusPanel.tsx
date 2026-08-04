import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Loader } from '@/components/ui';
import {
  useGetIngestBatchStatusQuery,
  type AdminV3IngestBatchNode,
  type AdminV3IngestBatchStatusResponse,
} from '@/features/ingest/api/adminIngestApi';
import { IngestFlowStatusLabel } from '@/features/ingest/components/IngestFlowStatusLabel';
import { IngestMatchedModulePreviewModal } from '@/features/ingest/components/IngestMatchedModulePreviewModal';
import { IngestMergeReviewBanner } from '@/features/ingest/components/IngestMergeReviewBanner';
import { IngestMergeReviewModal } from '@/features/ingest/components/IngestMergeReviewModal';
import { IngestOutcomeBanner } from '@/features/ingest/components/IngestOutcomeBanner';
import { useIngestMergeReview } from '@/features/ingest/hooks/useIngestMergeReview';
import { hasPendingMergeDecisions } from '@/features/ingest/utils/ingestMergeDecisions';
import {
  canCompleteIngestFlow,
  isIngestInProgress,
  isIngestRunning,
  shouldPollIngestStatus,
} from '@/features/ingest/utils/ingestStatus';
import {
  formatIngestRunStatusDisplay,
  ingestRunStatusBadgeClassName,
  ingestRunStatusTone,
} from '@/features/ingest/utils/ingestRunHistoryUtils';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

export interface IngestRunStatusPanelProps {
  batchId: string;
  sourceTitle?: string;
  isUploading?: boolean;
  uploadLabel?: string;
  emptyLabel?: string;
  initialPollDelayMs?: number;
  onStatusChange?: (
    batchId: string,
    status: AdminV3IngestBatchStatusResponse | null,
  ) => void;
  successAction?: React.ReactNode;
  onGoToDrafts?: () => void;
}

function flattenNodes(
  nodes: AdminV3IngestBatchNode[],
  prefix = '',
): Array<AdminV3IngestBatchNode & { path: string }> {
  const rows: Array<AdminV3IngestBatchNode & { path: string }> = [];
  for (const node of nodes) {
    const path = prefix ? `${prefix}/${node.key}` : node.key;
    rows.push({ ...node, path });
    if (node.children?.length) {
      rows.push(...flattenNodes(node.children, path));
    }
  }
  return rows;
}

function wasMergedIntoExisting(node: AdminV3IngestBatchNode): boolean {
  if (node.key !== 'candidate') return false;
  for (const child of node.children ?? []) {
    if (child.key !== 'card_draft') continue;
    const merge = child.published_module_merge;
    if (
      merge &&
      typeof merge === 'object' &&
      (merge as Record<string, unknown>).was_merge === true
    ) {
      return true;
    }
    const out = child.output_summary;
    if (
      out &&
      typeof out === 'object' &&
      (out as Record<string, unknown>).was_published_merge === true
    ) {
      return true;
    }
  }
  return false;
}

function countGeneratedModulesFromBatch(
  status: AdminV3IngestBatchStatusResponse | null | undefined,
): number {
  if (!status) return 0;
  const seen = new Set<string>();
  for (const source of status.sources ?? []) {
    for (const node of flattenNodes(source.nodes ?? [])) {
      const summary = node.output_summary;
      if (!summary || typeof summary !== 'object') continue;
      const raw = summary.module_id;
      if (typeof raw !== 'string') continue;
      const trimmed = raw.trim();
      if (trimmed) seen.add(trimmed);
    }
  }
  return seen.size;
}

export const IngestRunStatusPanel = ({
  batchId,
  sourceTitle,
  isUploading = false,
  uploadLabel = 'Uploading…',
  emptyLabel = 'Upload a file to start ingestion.',
  initialPollDelayMs = 0,
  onStatusChange,
  successAction,
  onGoToDrafts,
}: IngestRunStatusPanelProps) => {
  const [pollReady, setPollReady] = useState(initialPollDelayMs === 0);
  const [pollingIntervalMs, setPollingIntervalMs] = useState(0);

  useEffect(() => {
    setPollReady(initialPollDelayMs === 0);
    if (!batchId || initialPollDelayMs === 0) return;
    const timer = window.setTimeout(
      () => setPollReady(true),
      initialPollDelayMs,
    );
    return () => window.clearTimeout(timer);
  }, [batchId, initialPollDelayMs]);

  const {
    data: statusData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetIngestBatchStatusQuery(batchId, {
    skip: !batchId || !pollReady,
    pollingInterval: pollingIntervalMs,
    refetchOnMountOrArgChange: true,
  });

  const pendingMergeDecisions = hasPendingMergeDecisions(
    statusData?.merge_decisions,
  );

  useEffect(() => {
    if (!batchId || !pollReady) {
      setPollingIntervalMs(0);
      return;
    }
    setPollingIntervalMs(
      shouldPollIngestStatus(batchId, statusData?.status, {
        hasPendingMergeDecisions: pendingMergeDecisions,
      })
        ? 2000
        : 0,
    );
  }, [batchId, pendingMergeDecisions, pollReady, statusData?.status]);

  useEffect(() => {
    onStatusChange?.(batchId, statusData ?? null);
  }, [batchId, onStatusChange, statusData]);

  const refreshStatus = useCallback(() => refetch(), [refetch]);

  const mergeReview = useIngestMergeReview({
    batchId,
    mergeDecisions: statusData?.merge_decisions,
    sources: statusData?.sources,
    onRefreshStatus: refreshStatus,
  });

  const ingestionInProgress = isIngestInProgress(batchId, statusData?.status, {
    hasPendingMergeDecisions: pendingMergeDecisions,
  });
  const ingestionSucceeded = canCompleteIngestFlow(statusData?.status, {
    hasPendingMergeDecisions: pendingMergeDecisions,
  });
  const batchStatusTone = ingestRunStatusTone(statusData?.status);
  const sources = statusData?.sources ?? [];

  const progressLabel = useMemo(() => {
    if (!batchId) return emptyLabel;
    if (!statusData) return 'Loading ingestion status…';
    if (pendingMergeDecisions) {
      return 'Merge review required before ingestion can continue.';
    }
    if (isIngestRunning(statusData.status)) {
      return 'Ingestion running. Pipeline nodes update below while processing.';
    }
    if (ingestionInProgress) {
      return `Ingestion in progress · ${statusData.status}.`;
    }
    if (ingestionSucceeded) {
      return `Ingestion complete · ${statusData.status}`;
    }
    if (statusData.completed_at) return `Finished · ${statusData.status}`;
    return `Status · ${statusData.status}`;
  }, [
    batchId,
    emptyLabel,
    ingestionInProgress,
    ingestionSucceeded,
    pendingMergeDecisions,
    statusData,
  ]);

  return (
    <Card variant="elevated" className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-spice-text-primary">
              {sourceTitle ? `Status · ${sourceTitle}` : 'Batch status'}
            </div>
            {statusData?.status ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  pendingMergeDecisions
                    ? 'bg-spice-semantic-warningBg text-spice-semantic-warning'
                    : ingestRunStatusBadgeClassName(batchStatusTone)
                }`}
              >
                {pendingMergeDecisions
                  ? 'awaiting_review'
                  : formatIngestRunStatusDisplay(statusData.status)}
              </span>
            ) : null}
            {isFetching && statusData ? (
              <span className="text-[10px] text-spice-text-muted">
                Updating…
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-xs text-spice-text-muted">
            {progressLabel}
          </div>
        </div>
        {batchId ? (
          <div className="text-xs text-spice-text-muted">
            Batch: <span className="font-mono">{batchId}</span>
          </div>
        ) : null}
      </div>

      {mergeReview.reviewRequired ? (
        <IngestMergeReviewBanner onViewDetails={mergeReview.openModal} />
      ) : null}

      {error ? (
        <div className="space-y-2">
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {formatRtkQueryError(error)}
          </div>
          <Button
            variant="secondary"
            className="h-8 text-xs"
            onClick={() => void refetch()}
          >
            Retry status
          </Button>
        </div>
      ) : null}

      <Loader
        open={
          isUploading ||
          Boolean(batchId && pollReady && !statusData && isLoading)
        }
        label={isUploading ? uploadLabel : 'Loading ingestion status…'}
      />

      {statusData ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Card variant="bordered" className="space-y-1 p-3">
              <div className="text-[11px] font-semibold tracking-wider text-spice-text-muted">
                Batch
              </div>
              <div className="text-xs text-spice-text-medium">
                <span className="font-mono">{statusData.batch_id}</span>
              </div>
            </Card>
            <Card variant="bordered" className="space-y-1 p-3">
              <div className="text-[11px] font-semibold tracking-wider text-spice-text-muted">
                Timeline
              </div>
              <div className="text-xs text-spice-text-medium">
                {statusData.created_at
                  ? `Created: ${formatDisplayDateTime(statusData.created_at)}`
                  : '—'}
                <br />
                {statusData.completed_at
                  ? `Completed: ${formatDisplayDateTime(statusData.completed_at)}`
                  : pendingMergeDecisions
                    ? 'Awaiting merge decisions'
                    : isIngestRunning(statusData.status)
                      ? 'Running'
                      : 'In progress'}
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-spice-text-primary">
              Sources
            </div>
            {sources.length ? (
              sources.map((source) => {
                const nodes = flattenNodes(source.nodes ?? []);
                return (
                  <Card
                    key={source.source_document_id}
                    variant="bordered"
                    className="space-y-3 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-spice-text-primary">
                          {source.document_label}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-spice-text-muted">
                          {source.source_document_id}
                        </div>
                      </div>
                      <IngestFlowStatusLabel
                        status={source.status}
                        error={source.error}
                      />
                    </div>
                    <div className="space-y-2">
                      {nodes.length ? (
                        nodes.map((node) => {
                          const mergedIntoExisting =
                            wasMergedIntoExisting(node);
                          return (
                            <div
                              key={node.path}
                              className="rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-spice-text-primary">
                                    {node.title || node.key}
                                  </span>
                                  {mergedIntoExisting ? (
                                    <span className="rounded-full bg-spice-semantic-successBg px-2 py-0.5 text-[10px] font-semibold tracking-wide text-spice-semantic-success">
                                      Merged into existing module
                                    </span>
                                  ) : null}
                                </div>
                                <IngestFlowStatusLabel
                                  status={node.status}
                                  error={node.error}
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
                        <div className="text-xs text-spice-text-muted">
                          No nodes yet.
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-xs text-spice-text-muted">
                No sources in this batch yet.
              </div>
            )}
          </div>

          {ingestionSucceeded ? (
            onGoToDrafts ? (
              <IngestOutcomeBanner
                status={statusData.status}
                generatedModuleCount={countGeneratedModulesFromBatch(
                  statusData,
                )}
                onGoToDrafts={onGoToDrafts}
              />
            ) : (
              (successAction ?? null)
            )
          ) : null}
        </div>
      ) : null}

      <IngestMergeReviewModal
        open={mergeReview.modalOpen}
        decisions={mergeReview.decisions}
        outcomes={mergeReview.outcomes}
        submittingKeys={mergeReview.submittingKeys}
        mergeUnavailableKeys={mergeReview.mergeUnavailableKeys}
        notification={mergeReview.notification}
        onClose={mergeReview.closeModal}
        onDecide={(decision, choice) => {
          void mergeReview.decide(decision, choice);
        }}
        onViewModule={mergeReview.openModulePreview}
      />

      <IngestMatchedModulePreviewModal
        open={Boolean(mergeReview.previewModuleId)}
        moduleId={mergeReview.previewModuleId}
        onClose={mergeReview.closeModulePreview}
      />
    </Card>
  );
};
