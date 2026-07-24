import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Loader } from '@/components/ui';
import {
  useGetIngestStatusByDocumentQuery,
  type AdminV3IngestStatusResponse,
} from '@/features/ingest/api/adminIngestApi';
import {
  isIngestInProgress,
  isIngestRunning,
  isIngestSucceeded,
  shouldPollIngestStatus,
} from '@/features/ingest/utils/ingestStatus';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';

export interface IngestRunStatusPanelProps {
  sourceDocumentId: string;
  sourceTitle?: string;
  isUploading?: boolean;
  uploadLabel?: string;
  emptyLabel?: string;
  initialPollDelayMs?: number;
  onStatusChange?: (
    sourceDocumentId: string,
    status: AdminV3IngestStatusResponse | null,
  ) => void;
  successAction?: React.ReactNode;
}

export const IngestRunStatusPanel = ({
  sourceDocumentId,
  sourceTitle,
  isUploading = false,
  uploadLabel = 'Uploading…',
  emptyLabel = 'Upload a file to start ingestion.',
  initialPollDelayMs = 0,
  onStatusChange,
  successAction,
}: IngestRunStatusPanelProps) => {
  const [pollReady, setPollReady] = useState(initialPollDelayMs === 0);
  const [pollingIntervalMs, setPollingIntervalMs] = useState(0);

  useEffect(() => {
    setPollReady(initialPollDelayMs === 0);
    if (!sourceDocumentId || initialPollDelayMs === 0) return;
    const timer = window.setTimeout(
      () => setPollReady(true),
      initialPollDelayMs,
    );
    return () => window.clearTimeout(timer);
  }, [initialPollDelayMs, sourceDocumentId]);

  const {
    data: statusData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetIngestStatusByDocumentQuery(sourceDocumentId, {
    skip: !sourceDocumentId || !pollReady,
    pollingInterval: pollingIntervalMs,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!sourceDocumentId || !pollReady) {
      setPollingIntervalMs(0);
      return;
    }
    setPollingIntervalMs(
      shouldPollIngestStatus(sourceDocumentId, statusData?.status) ? 2000 : 0,
    );
  }, [pollReady, sourceDocumentId, statusData?.status]);

  useEffect(() => {
    onStatusChange?.(sourceDocumentId, statusData ?? null);
  }, [onStatusChange, sourceDocumentId, statusData]);

  const ingestionInProgress = isIngestInProgress(
    sourceDocumentId,
    statusData?.status,
  );
  const ingestionSucceeded = isIngestSucceeded(statusData?.status);
  const steps = statusData?.steps ?? [];

  const progressLabel = useMemo(() => {
    if (!sourceDocumentId) return emptyLabel;
    if (!statusData) return 'Loading ingestion status…';
    if (isIngestRunning(statusData.status)) {
      return 'Ingestion running. Pipeline steps update below while processing.';
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
    emptyLabel,
    ingestionInProgress,
    ingestionSucceeded,
    sourceDocumentId,
    statusData,
  ]);

  return (
    <Card variant="elevated" className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-spice-text-primary">
              {sourceTitle ? `Status · ${sourceTitle}` : 'Status'}
            </div>
            {statusData?.status ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  isIngestRunning(statusData.status)
                    ? 'bg-spice-brand-pm/15 text-spice-brand-pm'
                    : ingestionSucceeded
                      ? 'bg-spice-semantic-successBg text-spice-semantic-success'
                      : 'bg-spice-bg-tint text-spice-text-muted'
                }`}
              >
                {statusData.status}
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
        {sourceDocumentId ? (
          <div className="text-xs text-spice-text-muted">
            Document: <span className="font-mono">{sourceDocumentId}</span>
          </div>
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
          Boolean(sourceDocumentId && pollReady && !statusData && isLoading)
        }
        label={isUploading ? uploadLabel : 'Loading ingestion status…'}
      />

      {statusData ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Card variant="bordered" className="space-y-1 p-3">
              <div className="text-[11px] font-semibold tracking-wider text-spice-text-muted">
                Run
              </div>
              <div className="text-xs text-spice-text-medium">
                <span className="font-mono">{statusData.run_id}</span>
              </div>
            </Card>
            <Card variant="bordered" className="space-y-1 p-3">
              <div className="text-[11px] font-semibold tracking-wider text-spice-text-muted">
                Timeline
              </div>
              <div className="text-xs text-spice-text-medium">
                {statusData.started_at
                  ? `Started: ${statusData.started_at}`
                  : '—'}
                <br />
                {statusData.completed_at
                  ? `Completed: ${statusData.completed_at}`
                  : isIngestRunning(statusData.status)
                    ? 'Running'
                    : 'In progress'}
              </div>
            </Card>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-spice-text-primary">
              Steps
            </div>
            <div className="space-y-2">
              {steps.length ? (
                steps.map((step) => (
                  <Card
                    key={`${step.stage}-${step.started_at ?? ''}`}
                    variant="bordered"
                    className="p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-spice-text-primary">
                        {step.stage}
                      </div>
                      <div className="text-xs text-spice-text-muted">
                        {step.status}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-spice-text-muted">
                      {step.started_at ? `Started: ${step.started_at}` : '—'}
                      {step.completed_at
                        ? ` · Completed: ${step.completed_at}`
                        : ''}
                    </div>
                    {step.error ? (
                      <pre className="mt-2 overflow-auto rounded-lg bg-spice-bg-tint p-2 text-[11px] text-spice-semantic-error">
                        {JSON.stringify(step.error, null, 2)}
                      </pre>
                    ) : null}
                  </Card>
                ))
              ) : (
                <div className="text-xs text-spice-text-muted">
                  No steps yet.
                </div>
              )}
            </div>
          </div>

          {ingestionSucceeded && successAction ? successAction : null}
        </div>
      ) : null}
    </Card>
  );
};
