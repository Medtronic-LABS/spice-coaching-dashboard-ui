import { useEffect, useMemo, useState } from 'react';
import { PageTitle } from '@/components/common/PageTitle';
import {
  Banner,
  Button,
  Card,
  FileDropzone,
  Loader,
  SectionHeader,
  StatusBadge,
  useSnackbar,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import { useGetIngestStatusByDocumentQuery } from '@/features/ingest/api/adminIngestApi';
import { DuplicateIngestConfirmDialog } from '@/features/ingest/components/DuplicateIngestConfirmDialog';
import { useIngestWithDuplicateHandling } from '@/features/ingest/hooks/useIngestWithDuplicateHandling';
import {
  INGEST_ACCEPTED_FILE_TYPES_LABEL,
  INGEST_FILE_INPUT_ACCEPT,
  formatIngestFileRejectionError,
  isIngestAcceptedFile,
} from '@/features/ingest/constants/ingestAcceptedFileTypes';
import { INGEST_FORM_DEFAULTS } from '@/features/ingest/constants/ingestFormDefaults';
import {
  clearActiveIngestSession,
  readActiveIngestSession,
  writeActiveIngestSession,
} from '@/features/ingest/utils/ingestSessionStorage';
import {
  isIngestInProgress,
  isIngestRunning,
  isIngestSucceeded,
  shouldPollIngestStatus,
} from '@/features/ingest/utils/ingestStatus';
import { getIngestRunStatusBadgeProps } from '@/features/ingest/utils/ingestRunStatusBadge';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';

function redirectToModuleLibrary(): void {
  window.location.assign(paths.moduleLibrary);
}

export const ModuleCreatePage = () => {
  const snackbar = useSnackbar();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceDocumentId, setSourceDocumentId] = useState(
    () => readActiveIngestSession()?.source_document_id ?? '',
  );

  const persistIngestSession = (documentId: string) => {
    writeActiveIngestSession({
      source_document_id: documentId,
    });
    setSourceDocumentId(documentId);
  };

  const {
    submitIngest,
    confirmDuplicate,
    cancelDuplicate,
    duplicateDialog,
    isUploading,
    isConfirmingDuplicate,
  } = useIngestWithDuplicateHandling({
    onAccepted: (accepted) => {
      const first = accepted.sources?.[0]?.source_document_id ?? '';
      if (!first) {
        snackbar.showError('Ingest accepted but no source ID was returned.');
        return;
      }
      persistIngestSession(first);
      setSelectedFile(null);
    },
    onError: (message) => snackbar.showError(message),
  });

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
    snackbar.showSuccess('Ingestion succeeded. Redirecting to Module Library…');
    clearActiveIngestSession();
    redirectToModuleLibrary();
  }, [snackbar, statusData?.status]);

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

  return (
    <section
      className="space-y-4"
      aria-busy={isUploading || ingestionInProgress}
    >
      <PageTitle
        title="Create module"
        subtitle="Upload a source document and track ingestion progress (stage-wise). When the pipeline completes successfully, you’ll be redirected to the Module Library to claim and review. If you leave this page while ingestion runs, progress continues and status is restored when you return."
      />

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
        <SectionHeader
          title="Upload document"
          variant="h2"
          subtitle={`Accepted file types: ${INGEST_ACCEPTED_FILE_TYPES_LABEL} · Max 100 MB`}
        />

        <div className="space-y-3">
          <FileDropzone
            files={selectedFile ? [selectedFile] : []}
            onChange={(next) => {
              setSelectedFile(next[0] ?? null);
            }}
            accept={INGEST_FILE_INPUT_ACCEPT}
            disabled={uploadFieldsDisabled}
            showFileList
            title="Select file"
            titleWhenSelected="Replace file"
            subtitle="Click to select or drag and drop"
            ariaLabel="Upload document"
            validateFile={(file) =>
              isIngestAcceptedFile(file)
                ? null
                : formatIngestFileRejectionError([file])
            }
            onReject={(message) => snackbar.showError(message)}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="ghost"
              disabled={uploadFieldsDisabled || !selectedFile}
              onClick={() => {
                setSelectedFile(null);
              }}
            >
              Reset
            </Button>
            <Button
              disabled={uploadFieldsDisabled || !selectedFile}
              onClick={async () => {
                if (!selectedFile) return;

                clearActiveIngestSession();
                setSourceDocumentId('');

                await submitIngest({
                  files: [selectedFile],
                  fuse_sources: false,
                  content_domain: INGEST_FORM_DEFAULTS.content_domain,
                  assessment_mode: INGEST_FORM_DEFAULTS.assessment_mode,
                  mode: INGEST_FORM_DEFAULTS.mode,
                });
              }}
            >
              {isUploading
                ? 'Uploading…'
                : ingestionInProgress
                  ? 'Ingestion in progress…'
                  : 'Upload & start ingestion'}
            </Button>
          </div>
        </div>

        {statusError ? (
          <div className="space-y-2">
            <Banner tone="critical">{formatRtkQueryError(statusError)}</Banner>
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
          <SectionHeader
            title="Ingestion status"
            variant="h2"
            subtitle={progressLabel}
            titleAccessory={
              <>
                {statusData?.status ? (
                  <StatusBadge
                    {...getIngestRunStatusBadgeProps(statusData.status)}
                  />
                ) : null}
                {isPolling && statusData ? (
                  <span className="text-xs font-normal text-spice-text-muted">
                    Updating…
                  </span>
                ) : null}
              </>
            }
            action={
              <div className="text-sm text-spice-text-muted">
                Document: <span className="font-mono">{sourceDocumentId}</span>
              </div>
            }
          />

          <Loader
            open={isUploading || (!statusData && isStatusLoading)}
            label={
              isUploading
                ? 'Uploading document…'
                : isPolling
                  ? 'Polling status…'
                  : 'Loading status…'
            }
          />

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
        </Card>
      ) : null}

      <DuplicateIngestConfirmDialog
        open={duplicateDialog.open}
        variant={duplicateDialog.variant}
        conflicts={duplicateDialog.conflicts}
        onCancel={cancelDuplicate}
        onConfirm={() => void confirmDuplicate()}
        isConfirming={isConfirmingDuplicate}
      />
    </section>
  );
};
