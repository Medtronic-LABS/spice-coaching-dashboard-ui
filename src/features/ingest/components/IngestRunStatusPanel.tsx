import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Loader } from '@/components/ui';
import {
  useGetIngestBatchStatusQuery,
  type AdminV3IngestBatchNode,
  type AdminV3IngestBatchStatusResponse,
} from '@/features/ingest/api/adminIngestApi';
import { IngestFlowStatusLabel } from '@/features/ingest/components/IngestFlowStatusLabel';
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
  onGoToNeedsReview?: () => void;
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

function hasSimilarityDetectedInBatch(
  status: AdminV3IngestBatchStatusResponse | null | undefined,
): boolean {
  if (!status) return false;
  for (const source of status.sources ?? []) {
    for (const node of flattenNodes(source.nodes ?? [])) {
      const summary = node.output_summary;
      if (!summary || typeof summary !== 'object') continue;
      const rec = summary as Record<string, unknown>;
      if (
        rec.has_similarity === true ||
        rec.review_pending === true ||
        rec.similarity_detected === true
      ) {
        return true;
      }
    }
  }
  return false;
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
  onGoToNeedsReview,
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

  useEffect(() => {
    if (!batchId || !pollReady) {
      setPollingIntervalMs(0);
      return;
    }
    setPollingIntervalMs(
      shouldPollIngestStatus(batchId, statusData?.status) ? 2000 : 0,
    );
  }, [batchId, pollReady, statusData?.status]);

  useEffect(() => {
    onStatusChange?.(batchId, statusData ?? null);
  }, [batchId, onStatusChange, statusData]);

  const ingestionInProgress = isIngestInProgress(batchId, statusData?.status);
  const ingestionSucceeded = canCompleteIngestFlow(statusData?.status);
  const batchStatusTone = ingestRunStatusTone(statusData?.status);
  const sources = statusData?.sources ?? [];
  const similarityDetected = hasSimilarityDetectedInBatch(statusData);
  const generatedModuleCount = countGeneratedModulesFromBatch(statusData);

  const progressLabel = useMemo(() => {
    if (!batchId) return emptyLabel;
    if (!statusData) return 'Loading ingestion status…';
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
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ingestRunStatusBadgeClassName(
                  batchStatusTone,
                )}`}
              >
                {formatIngestRunStatusDisplay(statusData.status)}
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

        {ingestionSucceeded ? (
          <div>
            {similarityDetected ? (
              <Button
                className="h-8 shrink-0 text-xs"
                onClick={onGoToNeedsReview}
              >
                Review Modules ({generatedModuleCount})
              </Button>
            ) : generatedModuleCount > 0 ? (
              <Button className="h-8 shrink-0 text-xs" onClick={onGoToDrafts}>
                Open Modules
              </Button>
            ) : null}
          </div>
        ) : successAction ? (
          <div>{successAction}</div>
        ) : null}
      </div>

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
                : isIngestRunning(statusData.status)
                  ? 'Running'
                  : 'In progress'}
            </div>
          </Card>

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
                        nodes.map((node) => (
                          <div
                            key={node.path}
                            className="rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-spice-text-primary">
                                  {node.title || node.key}
                                </span>
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
                        ))
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
        </div>
      ) : null}
    </Card>
  );
};
