import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, LoadingState } from '@/components/ui';
import { paths } from '@/constants/routes';
import { useGetIngestStatusByDocumentQuery } from '@/features/module-library/api/adminIngestApi';
import {
  INGEST_ACCEPTED_FILE_TYPES_LABEL,
  INGEST_FILE_INPUT_ACCEPT,
} from '@/features/module-library/constants/ingestAcceptedFileTypes';
import { INGEST_FORM_DEFAULTS } from '@/features/module-library/constants/ingestFormDefaults';
import {
  clearActiveIngestSession,
  readActiveIngestSession,
  writeActiveIngestSession,
} from '@/features/module-library/utils/ingestSessionStorage';
import {
  isIngestInProgress,
  isIngestRunning,
  isIngestSucceeded,
  shouldPollIngestStatus,
} from '@/features/module-library/utils/ingestStatus';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';
import { adminApiBaseUrl, adminApiCommonHeaders } from '@/store/apis/adminBase';

type IngestStreamEventName =
  | 'run_started'
  | 'stage_started'
  | 'stage_succeeded'
  | 'stage_skipped'
  | 'stage_failed'
  | 'pipeline_complete';

type IngestStreamEvent = {
  event: IngestStreamEventName | 'message';
  stage?: string;
  message?: string;
  run_id?: string;
  source_document_id?: string;
  raw?: string;
};

function parseSseEventBlock(block: string): IngestStreamEvent | null {
  const lines = block
    .split('\n')
    .map((l) => l.trimEnd())
    .filter(Boolean);
  if (!lines.length) return null;

  let eventName: string | undefined;
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  }

  const dataRaw = dataLines.join('\n').trim();
  if (!dataRaw) {
    return { event: (eventName ?? 'message') as IngestStreamEvent['event'] };
  }

  try {
    const parsed: unknown = JSON.parse(dataRaw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      const event =
        typeof obj.event === 'string' ? obj.event : (eventName ?? 'message');
      const stage = typeof obj.stage === 'string' ? obj.stage : undefined;
      const run_id = typeof obj.run_id === 'string' ? obj.run_id : undefined;
      const source_document_id =
        typeof obj.source_document_id === 'string'
          ? obj.source_document_id
          : undefined;
      const message =
        typeof obj.message === 'string'
          ? obj.message
          : typeof obj.detail === 'string'
            ? obj.detail
            : undefined;
      return {
        event: event as IngestStreamEvent['event'],
        stage,
        message,
        run_id,
        source_document_id,
        raw: dataRaw,
      };
    }
    return {
      event: (eventName ?? 'message') as IngestStreamEvent['event'],
      message: dataRaw,
      raw: dataRaw,
    };
  } catch {
    return {
      event: (eventName ?? 'message') as IngestStreamEvent['event'],
      message: dataRaw,
      raw: dataRaw,
    };
  }
}

function redirectToModuleLibrary(): void {
  window.location.assign(paths.moduleLibrary);
}

export const CourseCreatePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [stageState, setStageState] = useState<Record<string, string>>({});
  const [sourceDocumentId, setSourceDocumentId] = useState(
    () => readActiveIngestSession()?.source_document_id ?? '',
  );

  const [statusPollIntervalMs, setStatusPollIntervalMs] = useState(() =>
    readActiveIngestSession()?.source_document_id ? 2000 : 0,
  );

  const {
    data: statusData,
    isLoading: isStatusLoading,
    isFetching: isPolling,
    error: statusError,
    refetch: refetchIngestStatus,
  } = useGetIngestStatusByDocumentQuery(sourceDocumentId, {
    skip: !sourceDocumentId,
    pollingInterval: statusPollIntervalMs,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!sourceDocumentId) {
      setStatusPollIntervalMs(0);
      return;
    }
    setStatusPollIntervalMs(
      shouldPollIngestStatus(sourceDocumentId, statusData?.status) ? 2000 : 0,
    );
  }, [sourceDocumentId, statusData?.status]);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isIngestSucceeded(statusData?.status)) return;
    clearActiveIngestSession();
    redirectToModuleLibrary();
  }, [statusData?.status]);

  const ingestionInProgress = isIngestInProgress(
    sourceDocumentId,
    statusData?.status,
  );
  const ingestionSucceeded = isIngestSucceeded(statusData?.status);
  const uploadFieldsDisabled = isStreaming || ingestionInProgress;

  const progressLabel = useMemo(() => {
    if (isStreaming) {
      return 'Ingestion running. Live updates stream while you stay on this page.';
    }
    if (!sourceDocumentId) {
      return 'Upload a document to start ingestion.';
    }
    if (!statusData) {
      return 'Loading ingestion status…';
    }
    if (isIngestRunning(statusData.status)) {
      return 'Ingestion running. Status updates while processing.';
    }
    if (ingestionInProgress) {
      return `Ingestion in progress · ${statusData.status}`;
    }
    if (ingestionSucceeded) {
      return `Ingestion complete · ${statusData.status}`;
    }
    return `Status · ${statusData.status}`;
  }, [
    ingestionInProgress,
    ingestionSucceeded,
    isStreaming,
    sourceDocumentId,
    statusData,
  ]);

  const displayStages = useMemo(() => {
    if (statusData?.steps?.length) {
      return statusData.steps.map((step) => ({
        key: `${step.stage}-${step.started_at ?? ''}`,
        stage: step.stage,
        status: step.status,
      }));
    }
    return Object.entries(stageState).map(([stage, status]) => ({
      key: stage,
      stage,
      status,
    }));
  }, [stageState, statusData?.steps]);

  const persistIngestSession = (documentId: string) => {
    writeActiveIngestSession({
      source_document_id: documentId,
      title: INGEST_FORM_DEFAULTS.title,
    });
    setSourceDocumentId(documentId);
  };

  return (
    <section
      className="space-y-4"
      aria-busy={isStreaming || ingestionInProgress}
    >
      <h1 className="text-3xl font-semibold text-spice-brand-pm">
        Create module
      </h1>
      <p className="text-sm text-spice-text-muted">
        Upload a source document and track ingestion progress (stage-wise). When
        the pipeline completes successfully, you’ll be redirected to the Module
        Library to claim and review. If you leave this page while ingestion
        runs, progress continues and status is restored when you return.
      </p>

      {ingestionInProgress && sourceDocumentId ? (
        <div
          className="rounded-lg border border-spice-border bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary"
          role="status"
        >
          <span className="font-semibold">Ingestion in progress.</span>{' '}
          <span className="text-spice-text-muted">
            Document <span className="font-mono">{sourceDocumentId}</span> is
            being processed.
            {isStreaming
              ? ' Live stream updates appear below.'
              : ' Status is polled from the server.'}
          </span>
        </div>
      ) : null}

      <Card variant="elevated" className="space-y-4">
        <div className="rounded-xl border border-dashed border-spice-border-mid bg-spice-bg-tint p-8 text-center">
          <div className="text-sm font-semibold text-spice-text-primary">
            Upload document
          </div>
          <p className="mt-1 text-xs text-spice-text-muted">
            Accepted file types: {INGEST_ACCEPTED_FILE_TYPES_LABEL}
          </p>
          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={INGEST_FILE_INPUT_ACCEPT}
              className="hidden"
              disabled={uploadFieldsDisabled}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                setStreamError('');
              }}
            />
            <Button
              variant="secondary"
              disabled={uploadFieldsDisabled}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            <Button
              className="ml-2"
              disabled={uploadFieldsDisabled || !selectedFile}
              onClick={async () => {
                setStreamError('');
                setStageState({});
                if (!selectedFile) return;

                streamAbortRef.current?.abort();
                clearActiveIngestSession();
                setSourceDocumentId('');

                const abortController = new AbortController();
                streamAbortRef.current = abortController;
                setIsStreaming(true);

                try {
                  const formData = new FormData();
                  formData.append('file', selectedFile, selectedFile.name);
                  formData.append('title', INGEST_FORM_DEFAULTS.title);
                  formData.append(
                    'authority_kind',
                    INGEST_FORM_DEFAULTS.authority_kind,
                  );
                  formData.append(
                    'authority_label',
                    INGEST_FORM_DEFAULTS.authority_label,
                  );
                  formData.append(
                    'primary_language',
                    INGEST_FORM_DEFAULTS.primary_language,
                  );

                  const res = await fetch(
                    `${adminApiBaseUrl}/admin/v3/ingest/stream`,
                    {
                      method: 'POST',
                      headers: {
                        ...adminApiCommonHeaders,
                        Accept: 'text/event-stream',
                      },
                      body: formData,
                      signal: abortController.signal,
                    },
                  );

                  if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    throw new Error(text || `Ingest failed (${res.status})`);
                  }
                  if (!res.body) {
                    throw new Error('Streaming response body missing.');
                  }

                  const reader = res.body.getReader();
                  const decoder = new TextDecoder('utf-8');
                  let buffer = '';

                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });

                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() ?? '';

                    for (const part of parts) {
                      const evt = parseSseEventBlock(part);
                      if (!evt) continue;

                      if (evt.source_document_id) {
                        persistIngestSession(evt.source_document_id);
                      }

                      if (evt.stage) {
                        const stage = evt.stage;
                        setStageState((prev) => ({
                          ...prev,
                          [stage]: evt.event,
                        }));
                      }

                      if (evt.event === 'pipeline_complete') {
                        clearActiveIngestSession();
                        redirectToModuleLibrary();
                        return;
                      }

                      if (evt.event === 'stage_failed') {
                        setIsStreaming(false);
                      }
                    }
                  }
                } catch (err) {
                  if (abortController.signal.aborted) {
                    return;
                  }
                  setStreamError(
                    err instanceof Error ? err.message : String(err),
                  );
                } finally {
                  if (streamAbortRef.current === abortController) {
                    streamAbortRef.current = null;
                  }
                  setIsStreaming(false);
                }
              }}
            >
              {isStreaming
                ? 'Uploading…'
                : ingestionInProgress
                  ? 'Ingestion in progress…'
                  : 'Upload & start ingestion'}
            </Button>
          </div>
          <div className="mt-4 text-xs text-spice-text-medium">
            {selectedFile ? selectedFile.name : 'No file selected'}
          </div>
        </div>

        {streamError ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {streamError}
          </div>
        ) : null}

        {statusError ? (
          <div className="space-y-2">
            <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
              {formatRtkQueryError(statusError)}
            </div>
            <Button
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => void refetchIngestStatus()}
            >
              Retry status
            </Button>
          </div>
        ) : null}
      </Card>

      {sourceDocumentId ? (
        <Card variant="elevated" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-spice-text-primary">
                  Ingestion status
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
                {isPolling && statusData ? (
                  <span className="text-[10px] text-spice-text-muted">
                    Updating…
                  </span>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-spice-text-muted">
                {progressLabel}
              </div>
            </div>
            <div className="text-xs text-spice-text-muted">
              Document: <span className="font-mono">{sourceDocumentId}</span>
            </div>
          </div>

          {!statusData && isStatusLoading ? (
            <div className="py-4">
              <LoadingState
                label={isPolling ? 'Polling status…' : 'Loading status…'}
              />
            </div>
          ) : null}

          {displayStages.length ? (
            <div className="space-y-2">
              {displayStages.map((step) => (
                <div
                  key={step.key}
                  className="flex items-center justify-between rounded-lg bg-spice-bg-tint px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-spice-text-primary">
                    {step.stage}
                  </span>
                  <span className="text-spice-text-medium">{step.status}</span>
                </div>
              ))}
            </div>
          ) : isStreaming ? (
            <div className="text-xs text-spice-text-muted">
              Waiting for pipeline stages…
            </div>
          ) : null}

          {ingestionSucceeded ? (
            <div className="rounded-lg bg-spice-semantic-successBg px-3 py-2 text-xs text-spice-semantic-success">
              Ingestion succeeded. Redirecting to Module Library…
            </div>
          ) : null}
        </Card>
      ) : null}
    </section>
  );
};
