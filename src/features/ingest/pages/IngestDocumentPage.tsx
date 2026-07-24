import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Select } from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  type AdminV3IngestAcceptedResponse,
  type AdminV3IngestStatusResponse,
} from '@/features/ingest/api/adminIngestApi';
import { DuplicateIngestConfirmDialog } from '@/features/ingest/components/DuplicateIngestConfirmDialog';
import { IngestRunStatusPanel } from '@/features/ingest/components/IngestRunStatusPanel';
import { useIngestWithDuplicateHandling } from '@/features/ingest/hooks/useIngestWithDuplicateHandling';
import {
  INGEST_ACCEPTED_FILE_TYPES_LABEL,
  INGEST_FILE_INPUT_ACCEPT,
  formatIngestFileRejectionError,
  isIngestAcceptedFile,
} from '@/features/ingest/constants/ingestAcceptedFileTypes';
import {
  INGEST_FORM_DEFAULTS,
  INGEST_MODULE_COUNT_MAX,
  INGEST_MODULE_COUNT_MIN,
  INGEST_MODULE_COUNT_RANGE_LABEL,
  type IngestModuleCountInput,
  ingestModuleCountForPayload,
  isIngestModuleCountInRange,
  isOptionalIngestModuleCountValid,
} from '@/features/ingest/constants/ingestFormDefaults';
import {
  INGEST_ASSESSMENT_MODE_OPTIONS,
  INGEST_CONTENT_DOMAIN_OPTIONS,
} from '@/features/ingest/constants/ingestFormOptions';
import {
  clearActiveIngestSession,
  readActiveIngestSession,
  writeActiveIngestSession,
} from '@/features/ingest/utils/ingestSessionStorage';
import { appendRecentIngestDocument } from '@/features/ingest/utils/recentIngestDocumentsStorage';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';
import {
  isIngestInProgress,
  isIngestSucceeded,
} from '@/features/ingest/utils/ingestStatus';
import { conflictFilenamesFromList } from '@/features/ingest/utils/parseIngestDuplicateError';

export const IngestDocumentPage = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [contentDomain, setContentDomain] = useState<
    'digital' | 'clinical' | 'clinical_with_app_workflows'
  >(INGEST_FORM_DEFAULTS.content_domain);
  const [assessmentMode, setAssessmentMode] = useState<
    'with_quiz' | 'read_only'
  >(INGEST_FORM_DEFAULTS.assessment_mode);
  const [fuseSources, setFuseSources] = useState<boolean>(
    INGEST_FORM_DEFAULTS.fuse_sources,
  );
  const [quizzesPerModule, setQuizzesPerModule] =
    useState<IngestModuleCountInput>(INGEST_FORM_DEFAULTS.quizzes_per_module);
  const [cardsPerModule, setCardsPerModule] = useState<IngestModuleCountInput>(
    INGEST_FORM_DEFAULTS.cards_per_module,
  );
  const [syncPublishedVisible] = useState<boolean>(
    INGEST_FORM_DEFAULTS.sync_published_visible,
  );
  const [syncPublishedVisibleByFile, setSyncPublishedVisibleByFile] = useState<
    boolean[]
  >([]);
  const [ingestionInstructions, setIngestionInstructions] = useState('');

  const removeFileAtIndex = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setSyncPublishedVisibleByFile((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const appendFiles = useCallback(
    (picked: File[]) => {
      const accepted = picked.filter(isIngestAcceptedFile);
      const rejected = picked.filter((file) => !isIngestAcceptedFile(file));

      setFileSelectionError(
        rejected.length ? formatIngestFileRejectionError(rejected) : '',
      );

      if (!accepted.length) return;

      setFiles((prev) => {
        const existing = new Set(
          prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`),
        );
        const next = [...prev];
        for (const file of accepted) {
          const key = `${file.name}-${file.size}-${file.lastModified}`;
          if (existing.has(key)) continue;
          next.push(file);
          existing.add(key);
          if (next.length >= 10) break;
        }
        return next;
      });

      setSyncPublishedVisibleByFile((prev) => {
        const next = [...prev];
        const start = files.length;
        const remainingSlots = Math.max(0, 10 - files.length);
        const toAdd = accepted.slice(0, remainingSlots);
        for (let i = 0; i < toAdd.length; i += 1) {
          next[start + i] = syncPublishedVisible;
        }
        return next;
      });
    },
    [files.length, syncPublishedVisible],
  );

  const [accepted, setAccepted] =
    useState<AdminV3IngestAcceptedResponse | null>(null);
  const [activeSourceDocumentId, setActiveSourceDocumentId] = useState('');
  const [restoredSourceDocumentId, setRestoredSourceDocumentId] = useState(
    () => readActiveIngestSession()?.source_document_id ?? '',
  );
  const [actionError, setActionError] = useState('');
  const [fileSelectionError, setFileSelectionError] = useState('');
  const [statusData, setStatusData] =
    useState<AdminV3IngestStatusResponse | null>(null);

  const handleIngestAccepted = useCallback(
    (
      res: AdminV3IngestAcceptedResponse,
      { isReingest }: { isReingest: boolean },
    ) => {
      setAccepted((prev) =>
        isReingest && prev
          ? {
              ...res,
              sources: [...prev.sources, ...res.sources],
              skipped_duplicates: res.skipped_duplicates,
            }
          : res,
      );

      const first = res.sources?.[0]?.source_document_id ?? '';
      if (first) setActiveSourceDocumentId(first);

      if (res.skipped_duplicates?.length && !isReingest) {
        const skippedNames = conflictFilenamesFromList(res.skipped_duplicates);
        const nextFiles = files.filter((file) => skippedNames.has(file.name));
        const nextVisibility = files
          .map((file, index) => ({
            file,
            visible: Boolean(syncPublishedVisibleByFile[index]),
          }))
          .filter(({ file }) => skippedNames.has(file.name))
          .map(({ visible }) => visible);
        setFiles(nextFiles);
        setSyncPublishedVisibleByFile(nextVisibility);
      } else {
        setFiles([]);
        setSyncPublishedVisibleByFile([]);
      }
    },
    [files, syncPublishedVisibleByFile],
  );

  const {
    submitIngest,
    confirmDuplicate,
    cancelDuplicate,
    duplicateDialog,
    isUploading,
    isConfirmingDuplicate,
    dismissedSkippedNotice,
  } = useIngestWithDuplicateHandling({
    onAccepted: handleIngestAccepted,
    onError: setActionError,
  });

  const sourceDocumentId = activeSourceDocumentId || restoredSourceDocumentId;
  const handleStatusChange = useCallback(
    (_: string, status: AdminV3IngestStatusResponse | null) => {
      setStatusData(status);
    },
    [],
  );

  const ingestionInProgress = isIngestInProgress(
    sourceDocumentId,
    statusData?.status,
  );
  const ingestionSucceeded = isIngestSucceeded(statusData?.status);

  useEffect(() => {
    if (ingestionSucceeded) {
      clearActiveIngestSession();
      return;
    }
    const first = accepted?.sources?.[0];
    if (!first?.source_document_id) return;
    writeActiveIngestSession({
      source_document_id: first.source_document_id,
      title: first.title,
    });
    setRestoredSourceDocumentId(first.source_document_id);
  }, [accepted, ingestionSucceeded]);

  useEffect(() => {
    if (ingestionSucceeded || !restoredSourceDocumentId) return;
    const session = readActiveIngestSession();
    if (session?.source_document_id === restoredSourceDocumentId) return;
    writeActiveIngestSession({
      source_document_id: restoredSourceDocumentId,
    });
  }, [restoredSourceDocumentId, ingestionSucceeded]);

  const moduleCountsValid =
    isOptionalIngestModuleCountValid(quizzesPerModule) &&
    isOptionalIngestModuleCountValid(cardsPerModule);
  const canSubmit =
    files.length > 0 &&
    !isUploading &&
    !ingestionInProgress &&
    moduleCountsValid;

  const uploadFieldsDisabled = isUploading || ingestionInProgress;

  const activeSourceTitle = useMemo(() => {
    const fromAccepted = accepted?.sources?.find(
      (source) => source.source_document_id === sourceDocumentId,
    )?.title;
    if (fromAccepted) return fromAccepted;
    if (readActiveIngestSession()?.source_document_id === sourceDocumentId) {
      return readActiveIngestSession()?.title;
    }
    return undefined;
  }, [accepted?.sources, sourceDocumentId]);

  useEffect(() => {
    if (!ingestionSucceeded || !sourceDocumentId) return;
    appendRecentIngestDocument({
      source_document_id: sourceDocumentId,
      title: activeSourceTitle,
      ingested_at: statusData?.completed_at ?? new Date().toISOString(),
    });
  }, [
    activeSourceTitle,
    ingestionSucceeded,
    sourceDocumentId,
    statusData?.completed_at,
  ]);

  const goToDrafts = useCallback(() => {
    const state: ModuleLibraryLocationState = {
      tab: 'drafts',
      sourceDocumentId,
      sourceDocumentTitle: activeSourceTitle,
    };
    navigate(paths.moduleLibrary, { state });
  }, [activeSourceTitle, navigate, sourceDocumentId]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            Upload Document
          </h1>
          <p className="mt-1 text-sm text-spice-text-muted">
            Upload a file to generate modules
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-9 text-xs"
            onClick={() => navigate(paths.moduleLibrary)}
          >
            Module Library
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

      {dismissedSkippedNotice?.length ? (
        <div
          className="rounded-lg border border-spice-border bg-spice-bg-tint px-3 py-2 text-xs text-spice-text-medium"
          role="status"
        >
          <span className="font-semibold text-spice-text-primary">
            Skipped duplicate content:
          </span>{' '}
          {dismissedSkippedNotice
            .map((conflict) => conflict.filename)
            .join(', ')}
        </div>
      ) : null}

      <Card variant="elevated" className="min-w-0 space-y-4 p-4 sm:p-6">
        <div className="text-sm font-semibold text-spice-text-primary">
          Upload
        </div>

        <div className="space-y-2">
          {files.length ? (
            <ul className="max-h-[11.5rem] space-y-2 overflow-y-auto pr-1">
              {files.map((f, idx) => {
                const isVisible = Boolean(syncPublishedVisibleByFile[idx]);
                return (
                  <li
                    key={`${f.name}-${f.size}-${f.lastModified}`}
                    className="flex items-center gap-3 rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2.5"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-spice-bg-tint text-spice-text-muted"
                      aria-hidden
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M14 3v5h5"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-sm font-medium text-spice-text-primary"
                        title={f.name}
                      >
                        {f.name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-spice-text-muted">
                        {Math.round(f.size / 1024)} KB
                      </div>
                    </div>

                    <label className="flex shrink-0 items-center gap-2 rounded-md border border-spice-border bg-spice-bg-tint px-2.5 py-1.5 text-[11px] text-spice-text-medium">
                      <input
                        type="checkbox"
                        disabled={uploadFieldsDisabled}
                        checked={isVisible}
                        onChange={(e) =>
                          setSyncPublishedVisibleByFile((prev) => {
                            const next = [...prev];
                            next[idx] = e.target.checked;
                            return next;
                          })
                        }
                        aria-label={`Enable ${f.name} for knowledge section`}
                      />
                      <span className="whitespace-nowrap">
                        Enable for knowledge section
                      </span>
                    </label>

                    <Button
                      variant="ghost"
                      className="h-8 shrink-0 px-2 text-[11px] text-spice-semantic-error hover:bg-spice-semantic-errorBg"
                      disabled={uploadFieldsDisabled}
                      onClick={() => removeFileAtIndex(idx)}
                    >
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {files.length < 10 ? (
            <label
              aria-label={files.length ? 'Add more files' : 'Upload files'}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-spice-border-mid bg-spice-bg-tint p-3 text-center transition-colors ${
                uploadFieldsDisabled
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer hover:border-spice-border hover:bg-spice-bg-surface'
              }`}
            >
              <input
                type="file"
                accept={INGEST_FILE_INPUT_ACCEPT}
                multiple
                className="sr-only"
                disabled={uploadFieldsDisabled}
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []).slice(0, 10);
                  e.target.value = '';
                  appendFiles(picked);
                }}
              />
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-spice-border bg-spice-bg-surface text-spice-text-muted">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </span>
              <span className="text-xs font-semibold text-spice-text-primary">
                {files.length ? 'Add more' : 'Upload files'}
              </span>
              {!files.length ? (
                <span className="text-[11px] text-spice-text-muted">
                  Click to select documents
                </span>
              ) : null}
            </label>
          ) : null}

          {fileSelectionError ? (
            <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
              {fileSelectionError}
            </div>
          ) : null}
        </div>

        <p className="text-xs text-spice-text-muted">
          {INGEST_ACCEPTED_FILE_TYPES_LABEL}
        </p>
        <p className="text-xs text-spice-text-muted">
          Video files are ingested from the Video Upload page.
        </p>

        <div className="min-w-0 space-y-4 border-t border-spice-border pt-4">
          <div className="text-xs font-semibold tracking-wide text-spice-text-medium uppercase">
            Configuration
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="block min-w-0 space-y-1">
              <span className="text-xs font-semibold text-spice-text-primary">
                Module content
              </span>
              <Select
                className="w-full rounded-lg"
                options={INGEST_ASSESSMENT_MODE_OPTIONS}
                value={assessmentMode}
                disabled={uploadFieldsDisabled}
                onChange={(value) =>
                  setAssessmentMode(value as typeof assessmentMode)
                }
              />
            </label>

            <label className="block min-w-0 space-y-1">
              <span className="text-xs font-semibold text-spice-text-primary">
                Content domain type
              </span>
              <Select
                className="w-full rounded-lg"
                options={INGEST_CONTENT_DOMAIN_OPTIONS}
                value={contentDomain}
                disabled={uploadFieldsDisabled}
                onChange={(value) =>
                  setContentDomain(value as typeof contentDomain)
                }
              />
            </label>

            <label className="block min-w-0 space-y-1">
              <span className="text-xs font-semibold text-spice-text-primary">
                Learning Material per Module (Optional)
              </span>
              <input
                type="number"
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                value={cardsPerModule}
                disabled={uploadFieldsDisabled}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setCardsPerModule('');
                    return;
                  }
                  const parsed = Number.parseInt(raw, 10);
                  if (!Number.isNaN(parsed)) {
                    setCardsPerModule(parsed);
                  }
                }}
                placeholder="e.g. 5"
              />
              {cardsPerModule !== '' &&
              !isIngestModuleCountInRange(cardsPerModule) ? (
                <span className="text-[11px] text-spice-semantic-error">
                  Enter a number from {INGEST_MODULE_COUNT_MIN} to{' '}
                  {INGEST_MODULE_COUNT_MAX}.
                </span>
              ) : (
                <span className="text-[11px] text-spice-text-muted">
                  {INGEST_MODULE_COUNT_RANGE_LABEL}
                </span>
              )}
            </label>

            <label className="block min-w-0 space-y-1">
              <span className="text-xs font-semibold text-spice-text-primary">
                Quizzes per Module (Optional)
              </span>
              <input
                type="number"
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                value={quizzesPerModule}
                disabled={uploadFieldsDisabled}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setQuizzesPerModule('');
                    return;
                  }
                  const parsed = Number.parseInt(raw, 10);
                  if (!Number.isNaN(parsed)) {
                    setQuizzesPerModule(parsed);
                  }
                }}
                placeholder="e.g. 5"
              />
              {quizzesPerModule !== '' &&
              !isIngestModuleCountInRange(quizzesPerModule) ? (
                <span className="text-[11px] text-spice-semantic-error">
                  Enter a number from {INGEST_MODULE_COUNT_MIN} to{' '}
                  {INGEST_MODULE_COUNT_MAX}.
                </span>
              ) : (
                <span className="text-[11px] text-spice-text-muted">
                  {INGEST_MODULE_COUNT_RANGE_LABEL}
                </span>
              )}
            </label>
          </div>

          <label className="flex min-h-10 items-start gap-3 rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2.5">
            <input
              type="checkbox"
              className="mt-0.5 shrink-0"
              disabled={uploadFieldsDisabled || files.length < 2}
              checked={fuseSources}
              onChange={(e) => setFuseSources(e.target.checked)}
            />
            <span className="text-sm text-spice-text-medium">
              <span className="font-semibold text-spice-text-primary">
                Merge sources
              </span>
              <span className="mt-0.5 block text-xs text-spice-text-muted">
                Combine multiple files into one ingestion run. Requires at least
                2 files.
              </span>
            </span>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-spice-text-muted">
            Ingestion instructions (optional)
          </span>
          <textarea
            className="min-h-[84px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm"
            value={ingestionInstructions}
            disabled={uploadFieldsDisabled}
            onChange={(e) => setIngestionInstructions(e.target.value)}
            placeholder="e.g. Focus on hypertension counselling workflows…"
          />
        </label>

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
              const effectiveVisibility =
                syncPublishedVisibleByFile.length === files.length
                  ? syncPublishedVisibleByFile
                  : files.map(() => syncPublishedVisible);
              await submitIngest({
                files,
                fuse_sources: fuseSources && files.length >= 2,
                sync_published_visible: effectiveVisibility,
                content_domain: contentDomain,
                assessment_mode: assessmentMode,
                quizzes_per_module:
                  ingestModuleCountForPayload(quizzesPerModule),
                cards_per_module: ingestModuleCountForPayload(cardsPerModule),
                mode: INGEST_FORM_DEFAULTS.mode,
                ingestion_instructions: ingestionInstructions.trim()
                  ? ingestionInstructions
                  : null,
              });
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

      <IngestRunStatusPanel
        sourceDocumentId={sourceDocumentId}
        sourceTitle={activeSourceTitle}
        isUploading={isUploading}
        uploadLabel="Uploading document…"
        initialPollDelayMs={activeSourceDocumentId ? 5000 : 0}
        onStatusChange={handleStatusChange}
        successAction={
          <div className="flex flex-col gap-2 rounded-lg bg-spice-semantic-successBg px-3 py-2 text-xs text-spice-semantic-success sm:flex-row sm:items-center sm:justify-between">
            <span>
              Ingestion succeeded. Review generated draft modules or upload
              another document.
            </span>
            <Button className="h-8 shrink-0 text-xs" onClick={goToDrafts}>
              Go to Drafts
            </Button>
          </div>
        }
      />

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
