import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, LoadingState } from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  useGetIngestStatusByDocumentQuery,
  useIngestDocumentsMutation,
} from '@/features/module-library/api/adminIngestApi';
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

function redirectToModuleLibrary(): void {
  window.location.assign(paths.moduleLibrary);
}

export const CourseCreatePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [sourceDocumentId, setSourceDocumentId] = useState(
    () => readActiveIngestSession()?.source_document_id ?? '',
  );

  const [ingestDocuments, { isLoading: isUploading }] =
    useIngestDocumentsMutation();

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
    if (!isIngestSucceeded(statusData?.status)) return;
    clearActiveIngestSession();
    redirectToModuleLibrary();
  }, [statusData?.status]);

  const ingestionInProgress = isIngestInProgress(
    sourceDocumentId,
    statusData?.status,
  );
  const ingestionSucceeded = isIngestSucceeded(statusData?.status);
  const uploadFieldsDisabled = isUploading || ingestionInProgress;

  const progressLabel = useMemo(() => {
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
  }, [ingestionInProgress, ingestionSucceeded, sourceDocumentId, statusData]);

  const displayStages = useMemo(() => {
    return (statusData?.steps ?? []).map((step) => ({
      key: `${step.stage}-${step.started_at ?? ''}`,
      stage: step.stage,
      status: step.status,
    }));
  }, [statusData?.steps]);

  const persistIngestSession = (documentId: string) => {
    writeActiveIngestSession({
      source_document_id: documentId,
    });
    setSourceDocumentId(documentId);
  };

  return (
    <section
      className="space-y-4"
      aria-busy={isUploading || ingestionInProgress}
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
            {' Status is polled from the server.'}
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
                setUploadError('');
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
                setUploadError('');
                if (!selectedFile) return;

                clearActiveIngestSession();
                setSourceDocumentId('');

                try {
                  const accepted = await ingestDocuments({
                    files: [selectedFile],
                    titles: null,
                    fuse_sources: false,
                    content_domain: INGEST_FORM_DEFAULTS.content_domain,
                    assessment_mode: INGEST_FORM_DEFAULTS.assessment_mode,
                    authority_label: INGEST_FORM_DEFAULTS.authority_label,
                    primary_language: INGEST_FORM_DEFAULTS.primary_language,
                    mode: INGEST_FORM_DEFAULTS.mode,
                  }).unwrap();
                  const first = accepted.sources?.[0]?.source_document_id ?? '';
                  if (!first) {
                    throw new Error(
                      'Ingest accepted but no source ID was returned.',
                    );
                  }
                  persistIngestSession(first);
                } catch (err) {
                  setUploadError(
                    err instanceof Error ? err.message : String(err),
                  );
                }
              }}
            >
              {isUploading
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

        {uploadError ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {uploadError}
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
