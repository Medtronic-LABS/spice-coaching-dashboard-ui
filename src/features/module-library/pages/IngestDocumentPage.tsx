import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, LoadingState } from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  useGetIngestStatusByDocumentQuery,
  useIngestDocumentMutation,
  type AdminV3IngestAcceptedResponse,
  type PrimaryLanguage,
} from '@/features/module-library/api/adminIngestApi';
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

export const IngestDocumentPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [authorityKind, setAuthorityKind] = useState('official_training');
  const [authorityLabel, setAuthorityLabel] = useState('BRAC');
  const [primaryLanguage, setPrimaryLanguage] = useState<PrimaryLanguage>('bn');

  const [accepted, setAccepted] =
    useState<AdminV3IngestAcceptedResponse | null>(null);
  const [restoredSourceDocumentId, setRestoredSourceDocumentId] = useState(
    () => readActiveIngestSession()?.source_document_id ?? '',
  );
  const [actionError, setActionError] = useState('');

  const [ingestDocument, { isLoading: isUploading }] =
    useIngestDocumentMutation();

  const sourceDocumentId =
    accepted?.source_document_id ?? restoredSourceDocumentId;

  const [statusPollIntervalMs, setStatusPollIntervalMs] = useState(() =>
    readActiveIngestSession()?.source_document_id ? 30000 : 0,
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

  const ingestionInProgress = isIngestInProgress(
    sourceDocumentId,
    statusData?.status,
  );
  const ingestionSucceeded = isIngestSucceeded(statusData?.status);

  useEffect(() => {
    if (!accepted?.source_document_id) return;
    writeActiveIngestSession({
      source_document_id: accepted.source_document_id,
      title: accepted.title,
    });
    setRestoredSourceDocumentId(accepted.source_document_id);
  }, [accepted]);

  useEffect(() => {
    if (!restoredSourceDocumentId) return;
    const session = readActiveIngestSession();
    if (session?.source_document_id === restoredSourceDocumentId) return;
    writeActiveIngestSession({
      source_document_id: restoredSourceDocumentId,
    });
  }, [restoredSourceDocumentId]);

  const canSubmit =
    Boolean(file) &&
    Boolean(title.trim()) &&
    !isUploading &&
    !ingestionInProgress;

  const steps = statusData?.steps ?? [];
  const candidates = statusData?.candidates ?? [];

  const progressLabel = useMemo(() => {
    if (!sourceDocumentId) {
      return 'Upload a document to start ingestion.';
    }
    if (!statusData) {
      return 'Loading ingestion status…';
    }
    if (isIngestRunning(statusData.status)) {
      return 'Ingestion running. Pipeline steps update below while processing.';
    }
    if (ingestionInProgress) {
      return `Ingestion in progress · ${statusData.status}. Wait before uploading another document.`;
    }
    if (ingestionSucceeded) {
      return `Ingestion complete · ${statusData.status}`;
    }
    if (statusData.completed_at) return `Finished · ${statusData.status}`;
    return `Status · ${statusData.status}`;
  }, [ingestionInProgress, ingestionSucceeded, sourceDocumentId, statusData]);

  const uploadFieldsDisabled = isUploading || ingestionInProgress;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            Ingest document
          </h1>
          <p className="mt-1 text-sm text-spice-text-muted">
            Upload a PDF, PPTX, or DOCX to generate module candidates. You can
            monitor pipeline stages and candidate IDs when ready.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-9 text-xs"
            onClick={() => navigate(paths.moduleLibrary)}
          >
            Back to modules
          </Button>
        </div>
      </div>

      {ingestionInProgress ? (
        <div
          className="rounded-lg border border-spice-border bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary"
          role="status"
        >
          <span className="font-semibold">Ingestion in progress.</span>{' '}
          <span className="text-spice-text-muted">
            Document <span className="font-mono">{sourceDocumentId}</span> is
            being processed. Upload another file after the pipeline reports
            succeeded.
          </span>
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
          {actionError}
        </div>
      ) : null}

      <Card variant="elevated" className="space-y-4 p-4">
        <div className="text-sm font-semibold text-spice-text-primary">
          Upload
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">Title</span>
            <input
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              value={title}
              disabled={uploadFieldsDisabled}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Antenatal Counseling and TT Vaccination"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">
              Primary language
            </span>
            <select
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              value={primaryLanguage}
              disabled={uploadFieldsDisabled}
              onChange={(e) =>
                setPrimaryLanguage(e.target.value as PrimaryLanguage)
              }
            >
              <option value="bn">Bangla (bn)</option>
              <option value="en">English (en)</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">
              Authority kind
            </span>
            <input
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              value={authorityKind}
              disabled={uploadFieldsDisabled}
              onChange={(e) => setAuthorityKind(e.target.value)}
              placeholder="official_training"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">
              Authority label
            </span>
            <input
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              value={authorityLabel}
              disabled={uploadFieldsDisabled}
              onChange={(e) => setAuthorityLabel(e.target.value)}
              placeholder="BRAC"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-spice-text-muted">File</span>
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={uploadFieldsDisabled}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="text-xs text-spice-text-muted">
              Selected: <span className="font-semibold">{file.name}</span>
            </div>
          ) : null}
        </label>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            className="h-9 text-xs"
            disabled={!canSubmit}
            onClick={async () => {
              if (!file) return;
              setActionError('');
              setAccepted(null);
              setRestoredSourceDocumentId('');
              clearActiveIngestSession();
              try {
                const res = await ingestDocument({
                  file,
                  title: title.trim(),
                  authority_kind: authorityKind.trim(),
                  authority_label: authorityLabel.trim(),
                  primary_language: primaryLanguage,
                }).unwrap();
                setAccepted(res);
                setFile(null);
              } catch (err) {
                setActionError(formatRtkQueryError(err));
              }
            }}
          >
            {isUploading
              ? 'Uploading…'
              : ingestionInProgress
                ? 'Ingestion in progress…'
                : 'Start ingestion'}
          </Button>
        </div>
      </Card>

      <Card variant="elevated" className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-spice-text-primary">
                Status
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
          {sourceDocumentId ? (
            <div className="text-xs text-spice-text-muted">
              Document: <span className="font-mono">{sourceDocumentId}</span>
            </div>
          ) : null}
        </div>

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

        {sourceDocumentId && !statusData && isStatusLoading ? (
          <div className="py-6">
            <LoadingState label={isPolling ? 'Polling status…' : 'Loading…'} />
          </div>
        ) : null}

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
                  steps.map((s) => (
                    <Card
                      key={`${s.stage}-${s.started_at ?? ''}`}
                      variant="bordered"
                      className="p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-spice-text-primary">
                          {s.stage}
                        </div>
                        <div className="text-xs text-spice-text-muted">
                          {s.status}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-spice-text-muted">
                        {s.started_at ? `Started: ${s.started_at}` : '—'}
                        {s.completed_at
                          ? ` · Completed: ${s.completed_at}`
                          : ''}
                      </div>
                      {s.error ? (
                        <pre className="mt-2 overflow-auto rounded-lg bg-spice-bg-tint p-2 text-[11px] text-spice-semantic-error">
                          {JSON.stringify(s.error, null, 2)}
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

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-spice-text-primary">
                  Candidates
                </div>
                <div className="text-xs text-spice-text-muted">
                  {candidates.length} found
                </div>
              </div>
              <div className="space-y-2">
                {candidates.length ? (
                  candidates.map((c) => (
                    <Card
                      key={c.candidate_id}
                      variant="bordered"
                      className="p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-spice-text-primary">
                            {c.proposed_title}
                          </div>
                          <div className="mt-1 text-xs text-spice-text-muted">
                            {c.behavioural_gap_code} · {c.proposed_module_type}{' '}
                            · {c.estimated_card_count} cards ·{' '}
                            {c.estimated_quiz_count} quiz
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-spice-text-muted">
                          <div className="font-semibold text-spice-text-medium">
                            Candidate ID
                          </div>
                          <div className="mt-0.5 font-mono break-all">
                            {c.candidate_id}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-xs text-spice-text-muted">
                    No candidates yet.
                  </div>
                )}
              </div>
            </div>

            {ingestionSucceeded ? (
              <div className="rounded-lg bg-spice-semantic-successBg px-3 py-2 text-xs text-spice-semantic-success">
                Ingestion succeeded. You can upload another document.
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
    </section>
  );
};
