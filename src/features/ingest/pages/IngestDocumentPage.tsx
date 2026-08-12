import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, Button, Card } from '@/components/ui';
import { paths } from '@/constants/routes';
import type {
  AdminV3IngestAcceptedResponse,
  AdminV3IngestBatchStatusResponse,
  AdminV3IngestUploadResponse,
  IngestContentDomain,
} from '@/features/ingest/api/adminIngestApi';
import { DocumentSelectionCollapsible } from '@/features/ingest/components/DocumentSelectionCollapsible';
import { DocumentSelectionPanel } from '@/features/ingest/components/DocumentSelectionPanel';
import { DuplicateIngestConfirmDialog } from '@/features/ingest/components/DuplicateIngestConfirmDialog';
import { IngestConfigurationPanel } from '@/features/ingest/components/IngestConfigurationPanel';
import { IngestRunStatusPanel } from '@/features/ingest/components/IngestRunStatusPanel';
import { useIngestWithDuplicateHandling } from '@/features/ingest/hooks/useIngestWithDuplicateHandling';
import { MAX_DOCUMENT_SELECTION } from '@/features/ingest/constants/documentSelection';
import {
  INGEST_FORM_DEFAULTS,
  type IngestModuleCountInput,
  ingestModuleCountForPayload,
  isOptionalIngestModuleCountValid,
} from '@/features/ingest/constants/ingestFormDefaults';
import type { SelectedIngestDocument } from '@/features/ingest/types/documentSelection.types';
import {
  clearActiveIngestSession,
  readActiveIngestSession,
  writeActiveIngestSession,
} from '@/features/ingest/utils/ingestSessionStorage';
import { appendRecentIngestDocument } from '@/features/ingest/utils/recentIngestDocumentsStorage';
import { hasPendingMergeDecisions } from '@/features/ingest/utils/ingestMergeDecisions';
import {
  isIngestInProgress,
  isIngestSucceeded,
} from '@/features/ingest/utils/ingestStatus';
import { sourceDocumentFromDuplicateConflict } from '@/features/ingest/utils/parseIngestDuplicateError';
import type { ModuleLibraryLocationState } from '@/features/modules/types/moduleLibraryNavigation.types';

export const IngestDocumentPage = () => {
  const navigate = useNavigate();
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

  const [selectedDocuments, setSelectedDocuments] = useState<
    SelectedIngestDocument[]
  >([]);
  const [selectionPanelOpen, setSelectionPanelOpen] = useState(false);
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [uploadClearSignal, setUploadClearSignal] = useState(0);

  const [accepted, setAccepted] =
    useState<AdminV3IngestAcceptedResponse | null>(null);
  const [activeBatchId, setActiveBatchId] = useState(
    () => readActiveIngestSession()?.batch_id ?? '',
  );
  const [restoredBatchId, setRestoredBatchId] = useState(
    () => readActiveIngestSession()?.batch_id ?? '',
  );
  const [actionError, setActionError] = useState('');
  const [statusData, setStatusData] =
    useState<AdminV3IngestBatchStatusResponse | null>(null);

  const handleUploaded = useCallback((res: AdminV3IngestUploadResponse) => {
    const uploaded: SelectedIngestDocument[] = res.sources
      .filter((source) => source.source_document_id)
      .map((source) => ({
        id: source.source_document_id,
        title: source.title.trim() || source.source_document_id,
        originalFilename: source.title.trim() || null,
        sourceType: source.source_type || 'pdf',
        status: source.status || 'uploaded',
      }));

    if (uploaded.length) {
      setSelectedDocuments((previous) => {
        const withoutDupes = previous.filter(
          (doc) => !uploaded.some((item) => item.id === doc.id),
        );
        return [...withoutDupes, ...uploaded].slice(0, MAX_DOCUMENT_SELECTION);
      });
    }
    setUploadClearSignal((current) => current + 1);
  }, []);

  const handleIngestAccepted = useCallback(
    (res: AdminV3IngestAcceptedResponse) => {
      setAccepted(res);
      if (res.batch_id) {
        setActiveBatchId(res.batch_id);
        setRestoredBatchId(res.batch_id);
      }
      setSelectedDocuments([]);
      setSelectionPanelOpen(true);
    },
    [],
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
    onUploaded: (response) => handleUploaded(response),
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

  const selectionDisabled =
    isUploading || isStartingIngest || ingestionInProgress;

  const canStartIngest =
    selectedDocuments.length > 0 &&
    !isUploading &&
    !isStartingIngest &&
    !ingestionInProgress &&
    moduleCountsValid;

  const primarySourceDocumentId =
    accepted?.sources?.[0]?.source_document_id ||
    selectedDocuments[0]?.id ||
    readActiveIngestSession()?.source_document_id ||
    '';

  const activeSourceTitle = useMemo(() => {
    const fromAccepted = accepted?.sources?.[0]?.title;
    if (fromAccepted) return fromAccepted;
    const fromSelected = selectedDocuments[0]?.title;
    if (fromSelected) return fromSelected;
    if (readActiveIngestSession()?.batch_id === batchId) {
      return readActiveIngestSession()?.title;
    }
    return undefined;
  }, [accepted?.sources, batchId, selectedDocuments]);

  const keptExistingRows = useMemo(() => {
    if (!keptExistingIngestNotice?.length) return [];
    return keptExistingIngestNotice.flatMap((conflict) => {
      const target = sourceDocumentFromDuplicateConflict(conflict);
      if (!target) return [];
      return [{ conflict, target }];
    });
  }, [keptExistingIngestNotice]);

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

  const goToAllModulesForSource = useCallback(
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

  const goToNeedsReviewForSource = useCallback(
    (sourceDocumentId: string, sourceTitle?: string) => {
      const state: ModuleLibraryLocationState = {
        tab: 'needs_review',
        sourceDocumentId,
        sourceDocumentTitle: sourceTitle,
      };
      navigate(paths.moduleLibrary, { state });
    },
    [navigate],
  );

  const goToModulesForSource = goToAllModulesForSource;

  const runStartIngest = useCallback(async () => {
    if (!selectedDocuments.length) return;
    setActionError('');
    setAccepted(null);
    setActiveBatchId('');
    setRestoredBatchId('');
    clearActiveIngestSession();
    await startIngest({
      source_document_ids: selectedDocuments.map((doc) => doc.id),
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
    selectedDocuments,
    startIngest,
  ]);

  const selectedCountLabel =
    selectedDocuments.length === 1
      ? '1 document selected'
      : `${selectedDocuments.length} documents selected`;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            Ingest Document
          </h1>
          <p className="mt-1 text-sm text-spice-text-muted">
            Select documents from the Upload Knowledge library, then configure
            and start ingestion to generate modules.
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
            processed. Select more documents after the pipeline reports
            succeeded.
          </span>
        </div>
      ) : null}

      {actionError ? <Banner tone="critical">{actionError}</Banner> : null}

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

      <Card variant="elevated" className="min-w-0 p-4 sm:p-6">
        <IngestConfigurationPanel
          disabled={selectionDisabled}
          assessmentMode={assessmentMode}
          onAssessmentModeChange={setAssessmentMode}
          contentDomain={contentDomain}
          onContentDomainChange={setContentDomain}
          cardsPerModule={cardsPerModule}
          onCardsPerModuleChange={setCardsPerModule}
          quizzesPerModule={quizzesPerModule}
          onQuizzesPerModuleChange={setQuizzesPerModule}
          ingestionInstructions={ingestionInstructions}
          onIngestionInstructionsChange={setIngestionInstructions}
        />
      </Card>

      <div className="space-y-2">
        <DocumentSelectionCollapsible
          title="Document Selection"
          open={selectionPanelOpen}
          onOpenChange={setSelectionPanelOpen}
          collapsedSummary="Expand to select documents or upload new files"
          disabled={selectionDisabled}
        >
          <DocumentSelectionPanel
            selectedDocuments={selectedDocuments}
            onSelectedDocumentsChange={setSelectedDocuments}
            searchQuery={documentSearchQuery}
            onSearchQueryChange={setDocumentSearchQuery}
            contentDomain={contentDomain}
            disabled={selectionDisabled}
            uploadFiles={uploadFiles}
            isUploading={isUploading}
            uploadClearSignal={uploadClearSignal}
          />
        </DocumentSelectionCollapsible>
        <p className="text-xs text-spice-text-muted" aria-live="polite">
          {selectedCountLabel}
        </p>
      </div>

      {keptExistingRows.length ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-spice-text-primary">
            Existing sources
          </div>
          <div className="space-y-2">
            {keptExistingRows.map(({ conflict, target }) => (
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

      <div className="flex flex-wrap justify-end gap-2">
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

      {accepted?.note ? (
        <div className="rounded-lg bg-spice-bg-tint px-3 py-2 text-xs text-spice-text-muted">
          {accepted.note}
        </div>
      ) : null}

      {batchId ? (
        <IngestRunStatusPanel
          batchId={batchId}
          isUploading={isUploading}
          uploadLabel="Uploading document…"
          initialPollDelayMs={activeBatchId ? 5000 : 0}
          onStatusChange={handleStatusChange}
          onGoToDrafts={goToAllModulesForSource}
          onGoToNeedsReview={goToNeedsReviewForSource}
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
