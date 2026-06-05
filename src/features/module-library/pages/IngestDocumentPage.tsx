import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Loader } from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  useGetIngestStatusByDocumentQuery,
  useIngestDocumentsMutation,
  type AdminV3IngestAcceptedResponse,
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

function filenameStem(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Untitled';
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot <= 0) return trimmed;
  return trimmed.slice(0, lastDot);
}

export const IngestDocumentPage = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [authorityLabel, setAuthorityLabel] = useState<string>(
    INGEST_FORM_DEFAULTS.authority_label,
  );
  const [primaryLanguage, setPrimaryLanguage] = useState<'bn' | 'en'>(
    INGEST_FORM_DEFAULTS.primary_language,
  );
  const [contentDomain, setContentDomain] = useState<
    'digital' | 'clinical' | 'clinical_with_app_action' | 'supervisor_update'
  >(INGEST_FORM_DEFAULTS.content_domain);
  const [assessmentMode, setAssessmentMode] = useState<
    'with_quiz' | 'read_only'
  >(INGEST_FORM_DEFAULTS.assessment_mode);
  const [mode, setMode] = useState<'append' | 'new'>(INGEST_FORM_DEFAULTS.mode);
  const [fuseSources, setFuseSources] = useState<boolean>(
    INGEST_FORM_DEFAULTS.fuse_sources,
  );

  const [accepted, setAccepted] =
    useState<AdminV3IngestAcceptedResponse | null>(null);
  const [activeSourceDocumentId, setActiveSourceDocumentId] = useState('');
  const [restoredSourceDocumentId, setRestoredSourceDocumentId] = useState(
    () => readActiveIngestSession()?.source_document_id ?? '',
  );
  const [actionError, setActionError] = useState('');

  const [ingestDocuments, { isLoading: isUploading }] =
    useIngestDocumentsMutation();

  const sourceDocumentId = activeSourceDocumentId || restoredSourceDocumentId;

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
    const first = accepted?.sources?.[0];
    if (!first?.source_document_id) return;
    writeActiveIngestSession({
      source_document_id: first.source_document_id,
      title: first.title,
    });
    setRestoredSourceDocumentId(first.source_document_id);
  }, [accepted]);

  useEffect(() => {
    if (!restoredSourceDocumentId) return;
    const session = readActiveIngestSession();
    if (session?.source_document_id === restoredSourceDocumentId) return;
    writeActiveIngestSession({
      source_document_id: restoredSourceDocumentId,
    });
  }, [restoredSourceDocumentId]);

  const canSubmit = files.length > 0 && !isUploading && !ingestionInProgress;

  const steps = statusData?.steps ?? [];
  // const candidates = statusData?.candidates ?? [];

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
        <p className="text-xs text-spice-text-muted">
          Accepted file types: {INGEST_ACCEPTED_FILE_TYPES_LABEL}
        </p>

        <label className="block space-y-1">
          <input
            type="file"
            accept={INGEST_FILE_INPUT_ACCEPT}
            multiple
            disabled={uploadFieldsDisabled}
            onChange={(e) => {
              const nextFiles = Array.from(e.target.files ?? []).slice(0, 10);
              setFiles(nextFiles);
              setTitles(nextFiles.map((f) => filenameStem(f.name)));
            }}
          />
          {files.length ? (
            <div className="text-xs text-spice-text-muted">
              Selected:{' '}
              <span className="font-semibold">
                {files.length} file{files.length === 1 ? '' : 's'}
              </span>
            </div>
          ) : null}
        </label>

        {files.length ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-spice-text-primary">
              Titles (optional)
            </div>
            <div className="space-y-2">
              {files.map((f, idx) => (
                <label
                  key={`${f.name}-${f.size}-${f.lastModified}`}
                  className="block space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-spice-text-muted">
                    <span className="truncate font-mono">{f.name}</span>
                    <span>{Math.round(f.size / 1024)} KB</span>
                  </div>
                  <input
                    className="h-9 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                    value={titles[idx] ?? ''}
                    disabled={uploadFieldsDisabled}
                    onChange={(e) =>
                      setTitles((prev) => {
                        const next = [...prev];
                        next[idx] = e.target.value;
                        return next;
                      })
                    }
                    placeholder="Title…"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">
              Assessment mode
            </span>
            <select
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={assessmentMode}
              disabled={uploadFieldsDisabled}
              onChange={(e) =>
                setAssessmentMode(e.target.value as typeof assessmentMode)
              }
            >
              <option value="with_quiz">with_quiz</option>
              <option value="read_only">read_only</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">
              Authority label
            </span>
            <input
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={authorityLabel}
              disabled={uploadFieldsDisabled}
              onChange={(e) => setAuthorityLabel(e.target.value)}
              placeholder="BRAC"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">
              Content domain
            </span>
            <select
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={contentDomain}
              disabled={uploadFieldsDisabled}
              onChange={(e) =>
                setContentDomain(e.target.value as typeof contentDomain)
              }
            >
              <option value="digital">digital</option>
              <option value="clinical">clinical</option>
              <option value="clinical_with_app_action">
                clinical_with_app_action
              </option>
              <option value="supervisor_update">supervisor_update</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">
              Primary language
            </span>
            <select
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={primaryLanguage}
              disabled={uploadFieldsDisabled}
              onChange={(e) =>
                setPrimaryLanguage(e.target.value as typeof primaryLanguage)
              }
            >
              <option value="bn">bn</option>
              <option value="en">en</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">Mode</span>
            <select
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={mode}
              disabled={uploadFieldsDisabled}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="append">append</option>
              <option value="new">new</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-spice-text-medium">
            <input
              type="checkbox"
              disabled={uploadFieldsDisabled}
              checked={fuseSources}
              onChange={(e) => setFuseSources(e.target.checked)}
            />
            Fuse sources (requires 2+ files)
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            className="h-9 text-xs"
            disabled={!canSubmit}
            onClick={async () => {
              if (!files.length) return;
              setActionError('');
              setAccepted(null);
              setRestoredSourceDocumentId('');
              setActiveSourceDocumentId('');
              clearActiveIngestSession();
              try {
                const effectiveTitles =
                  titles.length === files.length ? titles : null;
                const res = await ingestDocuments({
                  files,
                  titles: effectiveTitles,
                  fuse_sources: fuseSources,
                  content_domain: contentDomain,
                  assessment_mode: assessmentMode,
                  authority_label: authorityLabel,
                  primary_language: primaryLanguage,
                  mode,
                }).unwrap();
                setAccepted(res);
                const first = res.sources?.[0]?.source_document_id ?? '';
                setActiveSourceDocumentId(first);
                setFiles([]);
                setTitles([]);
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

        {accepted?.sources?.length ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-spice-text-primary">
              Queued sources
            </div>
            <div className="space-y-2">
              {accepted.sources.map((s) => (
                <button
                  key={s.source_document_id}
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                    activeSourceDocumentId === s.source_document_id
                      ? 'border-spice-border bg-spice-bg-tint text-spice-text-primary'
                      : 'border-spice-border bg-spice-bg-surface text-spice-text-medium'
                  }`}
                  onClick={() =>
                    setActiveSourceDocumentId(s.source_document_id)
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{s.title}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-spice-text-muted">
                        {s.source_document_id}
                      </div>
                    </div>
                    <div className="text-[11px] text-spice-text-muted">
                      {s.source_type}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {accepted.note ? (
              <div className="rounded-lg bg-spice-bg-tint px-3 py-2 text-xs text-spice-text-muted">
                {accepted.note}
              </div>
            ) : null}
          </div>
        ) : null}
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

        <Loader
          open={Boolean(sourceDocumentId && !statusData && isStatusLoading)}
          label={isPolling ? 'Polling status…' : 'Loading…'}
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

            {/* <div className="space-y-2">
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
            </div> */}

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
