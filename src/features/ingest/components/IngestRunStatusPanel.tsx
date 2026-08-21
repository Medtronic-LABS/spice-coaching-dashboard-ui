import { useEffect, useMemo, useState } from 'react';
import { Banner, Button, Card, Loader } from '@/components/ui';
import {
  useGetIngestBatchStatusQuery,
  useRetryIngestBatchMutation,
  type AdminV3IngestBatchStatusResponse,
} from '@/features/ingest/api/adminIngestApi';
import { IngestDocumentProgressCard } from '@/features/ingest/components/IngestDocumentProgressCard';
import { Tooltip } from '@/components/ui/Tooltip';
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
import { extractIngestBatchFailureTooltipMessage } from '@/features/ingest/utils/extractIngestErrorMessage';

export interface IngestRunStatusPanelProps {
  batchId: string;
  /** @deprecated Title is always generic; kept for call-site compatibility. */
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
  onGoToDrafts?: (sourceDocumentId: string, documentLabel: string) => void;
  onGoToNeedsReview?: (sourceDocumentId: string, documentLabel: string) => void;
}

export const IngestRunStatusPanel = ({
  batchId,
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
  const [expandedBySourceId, setExpandedBySourceId] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setPollReady(initialPollDelayMs === 0);
    if (!batchId || initialPollDelayMs === 0) return;
    const timer = window.setTimeout(
      () => setPollReady(true),
      initialPollDelayMs,
    );
    return () => window.clearTimeout(timer);
  }, [batchId, initialPollDelayMs]);

  useEffect(() => {
    setExpandedBySourceId({});
  }, [batchId]);

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
  const [retryIngestBatch, { isLoading: isRetrying, error: retryError }] =
    useRetryIngestBatchMutation();

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
  const batchFailureMessage =
    extractIngestBatchFailureTooltipMessage(statusData);
  const sources = statusData?.sources ?? [];
  const canRetryIngestion =
    ingestRunStatusTone(statusData?.status) === 'failed';

  const handleRetryIngestion = async () => {
    if (!batchId || !canRetryIngestion || isRetrying) return;
    try {
      await retryIngestBatch(batchId).unwrap();
      await refetch();
    } catch {
      // Retry error is rendered from mutation state.
    }
  };

  const retryAction = canRetryIngestion ? (
    <Button
      variant="secondary"
      className="h-8 text-xs"
      disabled={isRetrying}
      onClick={() => void handleRetryIngestion()}
    >
      {isRetrying ? 'Retrying…' : 'Retry'}
    </Button>
  ) : null;

  const progressLabel = useMemo(() => {
    if (!batchId) return emptyLabel;
    if (!statusData) return 'Loading ingestion status…';
    if (isIngestRunning(statusData.status)) {
      return 'Ingestion running. Expand a document to inspect pipeline steps.';
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
              Ingestion status
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
            {batchFailureMessage ? (
              <Tooltip
                label={batchFailureMessage}
                content={batchFailureMessage}
              />
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

        {retryAction || (!ingestionSucceeded && successAction) ? (
          <div className="flex flex-wrap items-center gap-2">
            {retryAction}
            {!ingestionSucceeded ? successAction : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="space-y-2">
          <Banner tone="critical">{formatRtkQueryError(error)}</Banner>
          <Button
            variant="secondary"
            className="h-8 text-xs"
            onClick={() => void refetch()}
          >
            Retry status
          </Button>
        </div>
      ) : null}

      {retryError ? (
        <Banner tone="critical">{formatRtkQueryError(retryError)}</Banner>
      ) : null}

      <Loader
        open={
          isUploading ||
          Boolean(batchId && pollReady && !statusData && isLoading)
        }
        label={isUploading ? uploadLabel : 'Loading ingestion status…'}
      />

      {statusData ? (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-spice-text-primary">
            Documents
          </div>
          {sources.length ? (
            sources.map((source) => (
              <IngestDocumentProgressCard
                key={source.source_document_id}
                source={source}
                expanded={Boolean(
                  expandedBySourceId[source.source_document_id],
                )}
                onExpandedChange={(nextExpanded) => {
                  setExpandedBySourceId((current) => ({
                    ...current,
                    [source.source_document_id]: nextExpanded,
                  }));
                }}
                onGoToDrafts={onGoToDrafts}
                onGoToNeedsReview={onGoToNeedsReview}
              />
            ))
          ) : (
            <div className="text-xs text-spice-text-muted">
              No sources in this batch yet.
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
};
