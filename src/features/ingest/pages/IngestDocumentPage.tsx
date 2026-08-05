import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteIcon } from '@/assets/icon';
import { Button, Card } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { paths } from '@/constants/routes';
import type {
  AdminV3IngestAcceptedResponse,
  AdminV3IngestBatchStatusResponse,
  AdminV3IngestUploadResponse,
  AdminV3IngestUploadedSource,
  IngestContentDomain,
  IngestDuplicateConflict,
} from '@/features/ingest/api/adminIngestApi';
import { DuplicateIngestConfirmDialog } from '@/features/ingest/components/DuplicateIngestConfirmDialog';
import { IngestConfigurationPanel } from '@/features/ingest/components/IngestConfigurationPanel';
import { IngestRunStatusPanel } from '@/features/ingest/components/IngestRunStatusPanel';
import { IngestUploadProgress } from '@/features/ingest/components/IngestUploadProgress';
import { useIngestWithDuplicateHandling } from '@/features/ingest/hooks/useIngestWithDuplicateHandling';
import {
  INGEST_ACCEPTED_FILE_TYPES_LABEL,
  INGEST_FILE_INPUT_ACCEPT,
  formatIngestFileRejectionError,
  isIngestAcceptedFile,
} from '@/features/ingest/constants/ingestAcceptedFileTypes';
import {
  INGEST_FORM_DEFAULTS,
  type IngestModuleCountInput,
  ingestModuleCountForPayload,
  isOptionalIngestModuleCountValid,
} from '@/features/ingest/constants/ingestFormDefaults';
import {
  clearActiveIngestSession,
  readActiveIngestSession,
  writeActiveIngestSession,
} from '@/features/ingest/utils/ingestSessionStorage';
import { appendRecentIngestDocument } from '@/features/ingest/utils/recentIngestDocumentsStorage';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';
import { hasPendingMergeDecisions } from '@/features/ingest/utils/ingestMergeDecisions';
import {
  isIngestInProgress,
  isIngestSucceeded,
} from '@/features/ingest/utils/ingestStatus';
import {
  findKeptExistingTargetForSource,
  isOverriddenUploadedSource,
  sourceDocumentFromDuplicateConflict,
} from '@/features/ingest/utils/parseIngestDuplicateError';

function titleFromFilename(filename: string): string {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0) return trimmed;
  return trimmed.slice(0, dot) || trimmed;
}

export const IngestDocumentPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [contentDomain, setContentDomain] = useState<IngestContentDomain>(
    INGEST_FORM_DEFAULTS.content_domain,
  );
  const [assessmentMode, setAssessmentMode] = useState<
    'with_quiz' | 'read_only'
  >(INGEST_FORM_DEFAULTS.assessment_mode);
  const [quizzesPerModule, setQuizzesPerModule] =
    useState<IngestModuleCountInput>(INGEST_FORM_DEFAULTS.quizzes_per_module);
  const [cardsPerModule, setCardsPerModule] = useState<IngestModuleCountInput>(
    INGEST_FORM_DEFAULTS.cards_per_module,
  );
  const [ingestionInstructions, setIngestionInstructions] = useState('');

  const [uploadedSources, setUploadedSources] = useState<
    AdminV3IngestUploadedSource[]
  >([]);
  const [overriddenFilenames, setOverriddenFilenames] = useState<string[]>([]);
  const [uploadDuplicateConflicts, setUploadDuplicateConflicts] = useState<
    IngestDuplicateConflict[]
  >([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [accepted, setAccepted] =
    useState<AdminV3IngestAcceptedResponse | null>(null);
  const [activeBatchId, setActiveBatchId] = useState(
    () => readActiveIngestSession()?.batch_id ?? '',
  );
  const [restoredBatchId, setRestoredBatchId] = useState(
    () => readActiveIngestSession()?.batch_id ?? '',
  );
  const [actionError, setActionError] = useState('');
  const [fileSelectionError, setFileSelectionError] = useState('');
  const [statusData, setStatusData] =
    useState<AdminV3IngestBatchStatusResponse | null>(null);

  const clearUploadedState = useCallback(() => {
    setUploadedSources([]);
    setUploadComplete(false);
    setOverriddenFilenames([]);
    setUploadDuplicateConflicts([]);
  }, []);

  const removeFileAtIndex = useCallback(
    (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      clearUploadedState();
    },
    [clearUploadedState],
  );

  const appendFiles = useCallback(
    (picked: File[]) => {
      const acceptedFiles = picked.filter(isIngestAcceptedFile);
      const rejected = picked.filter((file) => !isIngestAcceptedFile(file));

      setFileSelectionError(
        rejected.length ? formatIngestFileRejectionError(rejected) : '',
      );

      if (!acceptedFiles.length) return;

      clearUploadedState();

      setFiles((prev) => {
        const existing = new Set(
          prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`),
        );
        const next = [...prev];
        for (const file of acceptedFiles) {
          const key = `${file.name}-${file.size}-${file.lastModified}`;
          if (existing.has(key)) continue;
          next.push(file);
          existing.add(key);
          if (next.length >= 10) break;
        }
        return next;
      });
    },
    [clearUploadedState],
  );

  const handleUploaded = useCallback(
    (
      res: AdminV3IngestUploadResponse,
      {
        isReupload,
        overriddenFilenames: overridden,
        duplicateConflicts,
      }: {
        isReupload: boolean;
        overriddenFilenames: string[];
        duplicateConflicts: IngestDuplicateConflict[];
      },
    ) => {
      setUploadedSources((prev) =>
        isReupload ? [...prev, ...res.sources] : res.sources,
      );
      setOverriddenFilenames(overridden);
      setUploadDuplicateConflicts(duplicateConflicts);
      setUploadComplete(res.sources.length > 0);
      if (res.sources.length) {
        setFiles([]);
      }
    },
    [],
  );

  const handleIngestAccepted = useCallback(
    (res: AdminV3IngestAcceptedResponse) => {
      setAccepted(res);
      if (res.batch_id) {
        setActiveBatchId(res.batch_id);
        setRestoredBatchId(res.batch_id);
      }
      setFiles([]);
      clearUploadedState();
    },
    [clearUploadedState],
  );

  const {
    uploadFiles,
    startIngest,
    confirmDuplicate,
    cancelDuplicate,
    duplicateDialog,
    isUploading,
    isStartingIngest,
    isConfirmingDuplicate,
    reusedUploadNotice,
    keptExistingIngestNotice,
  } = useIngestWithDuplicateHandling({
    onUploaded: handleUploaded,
    onAccepted: (response) => handleIngestAccepted(response),
    onError: setActionError,
  });

  const batchId = activeBatchId || restoredBatchId;
  const handleStatusChange = useCallback(
    (_: string, status: AdminV3IngestBatchStatusResponse | null) => {
      setStatusData(status);
    },
    [],
  );

  const pendingMergeDecisions = hasPendingMergeDecisions(
    statusData?.merge_decisions,
  );
  const ingestionInProgress = isIngestInProgress(batchId, statusData?.status, {
    hasPendingMergeDecisions: pendingMergeDecisions,
  });
  const ingestionSucceeded =
    isIngestSucceeded(statusData?.status) && !pendingMergeDecisions;

  useEffect(() => {
    if (ingestionSucceeded) {
      clearActiveIngestSession();
      return;
    }
    if (!accepted?.batch_id) return;
    const first = accepted.sources?.[0];
    writeActiveIngestSession({
      batch_id: accepted.batch_id,
      source_document_id: first?.source_document_id,
      title: first?.title,
    });
    setRestoredBatchId(accepted.batch_id);
  }, [accepted, ingestionSucceeded]);

  useEffect(() => {
    if (ingestionSucceeded || !restoredBatchId) return;
    const session = readActiveIngestSession();
    if (session?.batch_id === restoredBatchId) return;
    writeActiveIngestSession({
      batch_id: restoredBatchId,
      source_document_id: session?.source_document_id,
      title: session?.title,
    });
  }, [ingestionSucceeded, restoredBatchId]);

  const moduleCountsValid =
    isOptionalIngestModuleCountValid(quizzesPerModule) &&
    isOptionalIngestModuleCountValid(cardsPerModule);

  const canUpload =
    files.length > 0 &&
    !isUploading &&
    !isStartingIngest &&
    !ingestionInProgress &&
    !uploadComplete;

  const canStartIngest =
    uploadedSources.length > 0 &&
    uploadComplete &&
    !isUploading &&
    !isStartingIngest &&
    !ingestionInProgress &&
    moduleCountsValid;

  const uploadFieldsDisabled =
    isUploading || isStartingIngest || ingestionInProgress;

  const primarySourceDocumentId =
    accepted?.sources?.[0]?.source_document_id ||
    uploadedSources[0]?.source_document_id ||
    readActiveIngestSession()?.source_document_id ||
    '';

  const activeSourceTitle = useMemo(() => {
    const fromAccepted = accepted?.sources?.[0]?.title;
    if (fromAccepted) return fromAccepted;
    const fromUploaded = uploadedSources[0]?.title;
    if (fromUploaded) return fromUploaded;
    if (readActiveIngestSession()?.batch_id === batchId) {
      return readActiveIngestSession()?.title;
    }
    return undefined;
  }, [accepted?.sources, batchId, uploadedSources]);

  const keptExistingOnlyRows = useMemo(() => {
    if (!keptExistingIngestNotice?.length) return [];

    const matchedSourceDocumentIds = new Set(
      uploadedSources.flatMap((source) => {
        const target = findKeptExistingTargetForSource(
          source,
          keptExistingIngestNotice,
        );
        return target ? [target.sourceDocumentId] : [];
      }),
    );

    return keptExistingIngestNotice.flatMap((conflict) => {
      const target = sourceDocumentFromDuplicateConflict(conflict);
      if (!target || matchedSourceDocumentIds.has(target.sourceDocumentId)) {
        return [];
      }
      return [{ conflict, target }];
    });
  }, [keptExistingIngestNotice, uploadedSources]);

  useEffect(() => {
    if (!ingestionSucceeded || !primarySourceDocumentId) return;
    appendRecentIngestDocument({
      source_document_id: primarySourceDocumentId,
      title: activeSourceTitle,
      ingested_at: statusData?.completed_at ?? new Date().toISOString(),
    });
  }, [
    activeSourceTitle,
    ingestionSucceeded,
    primarySourceDocumentId,
    statusData?.completed_at,
  ]);

  const goToAllModules = useCallback(() => {
    const state: ModuleLibraryLocationState = {
      tab: 'all',
      sourceDocumentId: primarySourceDocumentId,
      sourceDocumentTitle: activeSourceTitle,
    };
    navigate(paths.moduleLibrary, { state });
  }, [activeSourceTitle, navigate, primarySourceDocumentId]);

  const goToNeedsReview = useCallback(() => {
    const state: ModuleLibraryLocationState = {
      tab: 'needs_review',
      sourceDocumentId: primarySourceDocumentId,
      sourceDocumentTitle: activeSourceTitle,
    };
    navigate(paths.moduleLibrary, { state });
  }, [activeSourceTitle, navigate, primarySourceDocumentId]);

  const goToModulesForSource = useCallback(
    (sourceDocumentId: string, sourceTitle?: string) => {
      const state: ModuleLibraryLocationState = {
        tab: 'all',
        sourceDocumentId,
        sourceDocumentTitle: sourceTitle,
      };
      navigate(paths.moduleLibrary, { state });
    },
    [navigate],
  );

  const runUpload = useCallback(async () => {
    if (!files.length) return;
    setActionError('');
    setAccepted(null);
    setActiveBatchId('');
    setRestoredBatchId('');
    clearActiveIngestSession();
    setUploadComplete(false);

    await uploadFiles({
      files,
      titles: files.map((file) => titleFromFilename(file.name)),
      content_domains: files.map(() => contentDomain),
      sync_published_visible: files.map(
        () => INGEST_FORM_DEFAULTS.sync_published_visible,
      ),
    });
  }, [contentDomain, files, uploadFiles]);

  const runStartIngest = useCallback(async () => {
    if (!uploadedSources.length) return;
    setActionError('');
    await startIngest({
      source_document_ids: uploadedSources.map(
        (source) => source.source_document_id,
      ),
      assessment_mode: assessmentMode,
      quizzes_per_module: ingestModuleCountForPayload(quizzesPerModule) ?? null,
      cards_per_module: ingestModuleCountForPayload(cardsPerModule) ?? null,
      ingestion_instructions: ingestionInstructions.trim()
        ? ingestionInstructions
        : null,
      override_duplicates: null,
    });
  }, [
    assessmentMode,
    cardsPerModule,
    ingestionInstructions,
    quizzesPerModule,
    startIngest,
    uploadedSources,
  ]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            Ingest Document
          </h1>
          <p className="mt-1 text-sm text-spice-text-muted">
            Upload files first, then start ingestion to generate modules
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
            Batch <span className="font-mono">{batchId}</span> is being
            processed. Upload another file after the pipeline reports succeeded.
          </span>
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
          {actionError}
        </div>
      ) : null}

      {reusedUploadNotice?.length ? (
        <div
          className="rounded-lg border border-spice-border bg-spice-bg-tint px-3 py-2 text-xs text-spice-text-medium"
          role="status"
        >
          <span className="font-semibold text-spice-text-primary">
            Already uploaded:
          </span>{' '}
          {reusedUploadNotice.map((conflict) => conflict.filename).join(', ')}.
          These files are ready for ingestion.
        </div>
      ) : null}

      {keptExistingIngestNotice?.length ? (
        <div
          className="rounded-lg border border-spice-border bg-spice-bg-tint px-3 py-2 text-xs text-spice-text-medium"
          role="status"
        >
          <span className="font-semibold text-spice-text-primary">
            Already ingested:
          </span>{' '}
          {keptExistingIngestNotice
            .map((conflict) => conflict.filename)
            .join(', ')}
          . View existing modules below.
        </div>
      ) : null}

      <Card variant="elevated" className="min-w-0 space-y-4 p-4 sm:p-6">
        <IngestConfigurationPanel
          disabled={uploadFieldsDisabled}
          assessmentMode={assessmentMode}
          onAssessmentModeChange={setAssessmentMode}
          contentDomain={contentDomain}
          onContentDomainChange={(value) => {
            setContentDomain(value);
            clearUploadedState();
          }}
          cardsPerModule={cardsPerModule}
          onCardsPerModuleChange={setCardsPerModule}
          quizzesPerModule={quizzesPerModule}
          onQuizzesPerModuleChange={setQuizzesPerModule}
          ingestionInstructions={ingestionInstructions}
          onIngestionInstructionsChange={setIngestionInstructions}
        />

        <div className="space-y-3">
          <div className="text-sm font-semibold text-spice-text-primary">
            Upload
          </div>

          <div className="space-y-2">
            {files.length ? (
              <ul className="max-h-[11.5rem] space-y-2 overflow-y-auto pr-1">
                {files.map((f, idx) => (
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

                    <Button
                      variant="ghost"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center p-0 text-spice-semantic-error hover:bg-spice-semantic-errorBg"
                      disabled={uploadFieldsDisabled}
                      aria-label={`Remove ${f.name}`}
                      title="Remove"
                      onClick={() => removeFileAtIndex(idx)}
                    >
                      <DeleteIcon className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}

            {files.length < 10 && !uploadComplete ? (
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={INGEST_FILE_INPUT_ACCEPT}
                  multiple
                  tabIndex={-1}
                  className="sr-only"
                  disabled={uploadFieldsDisabled}
                  onFocus={(event) => {
                    // Windows Chrome scrolls scrollable ancestors to reveal
                    // focused sr-only inputs after the native file dialog closes.
                    event.currentTarget.blur();
                  }}
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []).slice(
                      0,
                      10,
                    );
                    e.target.value = '';
                    appendFiles(picked);
                  }}
                />
                <button
                  type="button"
                  aria-label={files.length ? 'Add more files' : 'Select files'}
                  disabled={uploadFieldsDisabled}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-spice-border-mid bg-spice-bg-tint p-3 text-center transition-colors ${
                    uploadFieldsDisabled
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer hover:border-spice-border hover:bg-spice-bg-surface'
                  }`}
                >
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
                    {files.length ? 'Add more' : 'Select files'}
                  </span>
                  {!files.length ? (
                    <span className="text-[11px] text-spice-text-muted">
                      Click to select documents
                    </span>
                  ) : null}
                </button>
              </div>
            ) : null}

            {fileSelectionError ? (
              <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
                {fileSelectionError}
              </div>
            ) : null}
          </div>

          <IngestUploadProgress
            active={isUploading}
            complete={uploadComplete && !isUploading}
          />

          {uploadedSources.length || keptExistingOnlyRows.length ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-spice-text-primary">
                Uploaded sources
              </div>
              <div className="space-y-2">
                {uploadedSources.map((source) => {
                  const overridden = isOverriddenUploadedSource(
                    source,
                    overriddenFilenames,
                    uploadDuplicateConflicts,
                  );
                  const keptExistingTarget = findKeptExistingTargetForSource(
                    source,
                    keptExistingIngestNotice ?? undefined,
                  );
                  const keptExistingConflict = keptExistingIngestNotice?.find(
                    (conflict) =>
                      Boolean(
                        findKeptExistingTargetForSource(source, [conflict]),
                      ),
                  );
                  const displayTitle =
                    keptExistingConflict?.filename ?? source.title;
                  return (
                    <div
                      key={source.source_document_id}
                      className="rounded-lg border border-spice-border bg-spice-bg-tint px-3 py-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-spice-text-primary">
                            {displayTitle}
                          </div>
                          {overridden ? (
                            <Badge className="bg-spice-semantic-warningBg text-spice-semantic-warning">
                              Overridden
                            </Badge>
                          ) : null}
                        </div>
                        {keptExistingTarget ? (
                          <Button
                            className="h-8 shrink-0 px-3 text-xs"
                            onClick={() =>
                              goToModulesForSource(
                                keptExistingTarget.sourceDocumentId,
                                keptExistingTarget.title,
                              )
                            }
                          >
                            View modules
                          </Button>
                        ) : null}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-spice-text-muted">
                        {source.source_document_id}
                      </div>
                    </div>
                  );
                })}
                {keptExistingOnlyRows.map(({ conflict, target }) => (
                  <div
                    key={`${target.sourceDocumentId}-${conflict.filename}`}
                    className="rounded-lg border border-spice-border bg-spice-bg-tint px-3 py-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 font-semibold text-spice-text-primary">
                        {conflict.filename}
                      </div>
                      <Button
                        className="h-8 shrink-0 px-3 text-xs"
                        onClick={() =>
                          goToModulesForSource(
                            target.sourceDocumentId,
                            target.title,
                          )
                        }
                      >
                        View modules
                      </Button>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-spice-text-muted">
                      {target.sourceDocumentId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <p className="text-xs text-spice-text-muted">
            {INGEST_ACCEPTED_FILE_TYPES_LABEL}
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            className="h-9 text-xs"
            disabled={!canUpload}
            onClick={() => void runUpload()}
          >
            {isUploading ? 'Uploading…' : 'Upload'}
          </Button>
          <Button
            className="h-9 text-xs"
            disabled={!canStartIngest}
            onClick={() => void runStartIngest()}
          >
            {isStartingIngest
              ? 'Starting…'
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
                <div
                  key={s.source_document_id}
                  className="w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-left text-xs text-spice-text-medium"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-spice-text-primary">
                        {s.title}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-spice-text-muted">
                        {s.source_document_id}
                      </div>
                    </div>
                    <div className="text-[11px] text-spice-text-muted">
                      {s.source_type}
                    </div>
                  </div>
                </div>
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

      {batchId ? (
        <IngestRunStatusPanel
          batchId={batchId}
          sourceTitle={activeSourceTitle}
          isUploading={isUploading}
          uploadLabel="Uploading document…"
          initialPollDelayMs={activeBatchId ? 5000 : 0}
          onStatusChange={handleStatusChange}
          onGoToDrafts={goToAllModules}
          onGoToNeedsReview={goToNeedsReview}
        />
      ) : null}

      <DuplicateIngestConfirmDialog
        open={duplicateDialog.open}
        variant={duplicateDialog.variant}
        conflicts={duplicateDialog.conflicts}
        onCancel={cancelDuplicate}
        onConfirm={(selectedFilenames) => {
          void confirmDuplicate(selectedFilenames);
        }}
        isConfirming={isConfirmingDuplicate}
      />
    </section>
  );
};
