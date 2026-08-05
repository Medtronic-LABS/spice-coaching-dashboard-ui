import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  FileDropzone,
  ImagePicker,
  Tabs,
  Tooltip,
  type TabItem,
} from '@/components/ui';
import { ProgressBar as CommonProgressBar } from '@/components/common/ProgressBar';
import { paths } from '@/constants/routes';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';
import {
  useGetKnowledgeUploadStatusQuery,
  usePutKnowledgeAssetThumbnailMutation,
  useUploadKnowledgeDocumentMutation,
} from '@/features/modules/api/adminKnowledgeApi';
import { IngestUploadProgress } from '@/features/ingest/components/IngestUploadProgress';
import { KnowledgeSplitEditor } from '@/features/modules/components/KnowledgeSplitEditor';
import { KnowledgeLibraryTable } from '@/features/modules/components/KnowledgeLibraryTable';
import {
  KNOWLEDGE_FILE_INPUT_ACCEPT,
  formatKnowledgeFileRejectionError,
  isKnowledgeAcceptedFile,
} from '@/features/ingest/constants/knowledgeAcceptedFileTypes';
import { useKnowledgePdfDocument } from '@/features/modules/hooks/useKnowledgePdfDocument';
import { usePdfPageThumbnail } from '@/features/modules/hooks/usePdfPageThumbnail';
import {
  knowledgeSplitDraftFieldErrors,
  knowledgeSplitDraftHasFieldErrors,
  type KnowledgeSplitDraftFieldErrors,
} from '@/features/modules/utils/knowledgeSplitValidation';
import {
  createEmptyKnowledgeSplitDraft,
  type KnowledgeSplitDraft,
  type KnowledgeUploadMode,
} from '@/features/modules/types/knowledgeLibrary.types';

function isKnowledgeUploadComplete(status: string | undefined): boolean {
  return status === 'completed' || status === 'failed';
}

export const KnowledgeLibraryPage = () => {
  const navigate = useNavigate();

  const [uploadKnowledgeDocument, { isLoading: isUploadingKnowledge }] =
    useUploadKnowledgeDocumentMutation();
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [statusPollIntervalMs, setStatusPollIntervalMs] = useState(0);
  const uploadIdArg = uploadId ?? '';
  const { data: uploadStatusDataPolled, error: uploadStatusErrorPolled } =
    useGetKnowledgeUploadStatusQuery(uploadIdArg, {
      skip: !uploadId,
      pollingInterval: statusPollIntervalMs,
      refetchOnMountOrArgChange: true,
    });

  const uploadStatusDataResolved = uploadStatusDataPolled ?? null;
  const uploadStatusErrorResolved = uploadStatusErrorPolled ?? null;

  const [putKnowledgeAssetThumbnail] = usePutKnowledgeAssetThumbnailMutation();

  const [mode, setMode] = useState<KnowledgeUploadMode>('original');
  const [file, setFile] = useState<File | null>(null);
  const [fileSelectionError, setFileSelectionError] = useState('');

  // Original mode draft.
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalThumbnailFile, setOriginalThumbnailFile] =
    useState<File | null>(null);
  const [originalSuppressAutoThumbnail, setOriginalSuppressAutoThumbnail] =
    useState(false);

  // Split mode draft.
  const [splitDrafts, setSplitDrafts] = useState<KnowledgeSplitDraft[]>([
    createEmptyKnowledgeSplitDraft(),
  ]);

  const {
    pdf: pdfDocument,
    pageCount,
    isLoading: isReadingPdf,
    error: pdfReadError,
  } = useKnowledgePdfDocument(file);

  const hasCustomOriginalThumbnail = Boolean(originalThumbnailFile);
  const isBlankOriginalThumbnail =
    !hasCustomOriginalThumbnail && originalSuppressAutoThumbnail;
  const {
    url: originalAutoThumbnailUrl,
    isRendering: isOriginalThumbRendering,
  } = usePdfPageThumbnail(
    pdfDocument,
    1,
    mode === 'original' &&
      Boolean(file) &&
      !hasCustomOriginalThumbnail &&
      !originalSuppressAutoThumbnail,
  );

  const originalThumbnailValue = hasCustomOriginalThumbnail
    ? originalThumbnailFile
    : originalSuppressAutoThumbnail
      ? null
      : originalAutoThumbnailUrl;

  const initialTabs: TabItem[] = useMemo(
    () => [
      { label: 'Upload Original', value: 'original' },
      { label: 'Split Document', value: 'split' },
    ],
    [],
  );

  const [actionError, setActionError] = useState('');
  const [splitDraftErrors, setSplitDraftErrors] = useState<
    KnowledgeSplitDraftFieldErrors[]
  >([]);

  const uploadInFlight = useMemo(() => {
    if (!uploadId) return false;
    return !isKnowledgeUploadComplete(uploadStatusDataResolved?.status);
  }, [uploadId, uploadStatusDataResolved?.status]);

  useEffect(() => {
    // Poll until completed/failed.
    if (!uploadId) {
      setStatusPollIntervalMs(0);
      return;
    }

    if (isKnowledgeUploadComplete(uploadStatusDataResolved?.status)) {
      setStatusPollIntervalMs(0);
      return;
    }

    setStatusPollIntervalMs(2000);
  }, [uploadId, uploadStatusDataResolved?.status]);

  useEffect(() => {
    if (!uploadStatusErrorResolved) return;
    setActionError(formatRtkQueryError(uploadStatusErrorResolved));
  }, [uploadStatusErrorResolved]);

  const uploadProgressValue = useMemo(() => {
    const v = uploadStatusDataResolved?.progress_percent;
    if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(100, Math.round(v)));
  }, [uploadStatusDataResolved?.progress_percent]);

  const uploadProgressLabel = useMemo(() => {
    if (!uploadId) return 'Upload a PDF to start processing.';
    if (!uploadStatusDataResolved) return 'Loading processing status…';
    if (uploadStatusDataResolved.status === 'queued') return 'Queued…';
    if (uploadStatusDataResolved.status === 'processing')
      return 'Processing knowledge…';
    if (uploadStatusDataResolved.status === 'failed')
      return 'Processing failed.';
    return 'Processing complete.';
  }, [uploadId, uploadStatusDataResolved]);

  const [pendingThumbnailUploads, setPendingThumbnailUploads] = useState<
    Array<{ id: string; thumbnail: File }>
  >([]);
  const [
    thumbnailUploadsCompletedForUploadId,
    setThumbnailUploadsCompletedForUploadId,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadId) return;
    if (!uploadStatusDataResolved) return;
    if (uploadStatusDataResolved.status !== 'completed') return;

    if (thumbnailUploadsCompletedForUploadId === uploadId) return;
    if (pendingThumbnailUploads.length === 0) {
      setThumbnailUploadsCompletedForUploadId(uploadId);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        for (const target of pendingThumbnailUploads) {
          if (cancelled) return;
          await putKnowledgeAssetThumbnail(target).unwrap();
        }
      } catch (err) {
        if (!cancelled) setActionError(formatRtkQueryError(err));
      } finally {
        if (!cancelled) {
          setThumbnailUploadsCompletedForUploadId(uploadId);
          setPendingThumbnailUploads([]);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    pendingThumbnailUploads,
    putKnowledgeAssetThumbnail,
    setPendingThumbnailUploads,
    setThumbnailUploadsCompletedForUploadId,
    thumbnailUploadsCompletedForUploadId,
    uploadId,
    uploadStatusDataResolved,
  ]);

  const clearAllDrafts = useCallback(() => {
    setFile(null);
    setFileSelectionError('');
    setOriginalTitle('');
    setOriginalThumbnailFile(null);
    setOriginalSuppressAutoThumbnail(false);
    setSplitDraftErrors([]);
    setSplitDrafts([createEmptyKnowledgeSplitDraft()]);
  }, []);

  const onModeChange = useCallback((nextMode: string) => {
    const resolved = nextMode === 'split' ? 'split' : 'original';
    setMode(resolved);
    setActionError('');
    setFileSelectionError('');
    setSplitDraftErrors([]);

    // Keep the picked file; clear the mode we're leaving (xor drafts).
    if (resolved === 'original') {
      setSplitDrafts([createEmptyKnowledgeSplitDraft()]);
      setSplitDraftErrors([]);
    } else {
      setOriginalTitle('');
      setOriginalThumbnailFile(null);
      setOriginalSuppressAutoThumbnail(false);
    }
  }, []);

  const modeTabs = useMemo(() => initialTabs, [initialTabs]);

  const livePageFieldErrors = useMemo(
    () =>
      knowledgeSplitDraftFieldErrors(splitDrafts, {
        pageCount,
        requireTitle: false,
      }),
    [pageCount, splitDrafts],
  );

  const displayedSplitErrors = useMemo(() => {
    return splitDrafts.map((_, index) => ({
      title: splitDraftErrors[index]?.title,
      startPage:
        livePageFieldErrors[index]?.startPage ??
        splitDraftErrors[index]?.startPage,
      endPage:
        livePageFieldErrors[index]?.endPage ?? splitDraftErrors[index]?.endPage,
    }));
  }, [livePageFieldErrors, splitDraftErrors, splitDrafts]);

  const canSubmit = useMemo(() => {
    if (!file) return false;
    if (uploadInFlight || isUploadingKnowledge) return false;
    if (mode === 'original') return Boolean(originalTitle.trim());
    // In split mode, allow clicking "Upload" so we can show inline validation
    // errors instead of only disabling the button.
    return true;
  }, [file, isUploadingKnowledge, mode, originalTitle, uploadInFlight]);

  const submitUpload = useCallback(async () => {
    if (!file) {
      setFileSelectionError('Please select a PDF.');
      return;
    }

    setActionError('');
    setFileSelectionError('');
    setSplitDraftErrors([]);

    try {
      if (mode === 'original') {
        const title = originalTitle.trim();
        if (!title) {
          setActionError('Title is required for Upload Original.');
          return;
        }

        const res = await uploadKnowledgeDocument({
          file,
          mode: 'original',
          title,
          thumbnail: originalThumbnailFile,
        }).unwrap();

        setUploadId(res.upload_id);
        return;
      }

      if (splitDrafts.length === 0) {
        setActionError('Please add at least one split.');
        return;
      }

      const splitValidationOptions = {
        pageCount,
        requireTitle: true,
      };

      if (
        knowledgeSplitDraftHasFieldErrors(splitDrafts, splitValidationOptions)
      ) {
        setSplitDraftErrors(
          knowledgeSplitDraftFieldErrors(splitDrafts, splitValidationOptions),
        );
        return;
      }

      const splitsPayload = splitDrafts.map((row) => ({
        title: row.title.trim(),
        start_page: row.startPage,
        end_page: row.endPage,
      }));

      const res = await uploadKnowledgeDocument({
        file,
        mode: 'split',
        splits: splitsPayload,
      }).unwrap();

      setUploadId(res.upload_id);

      const pending: Array<{ id: string; thumbnail: File }> = [];
      for (let i = 0; i < splitDrafts.length; i += 1) {
        const splitRow = splitDrafts[i];
        const assetId = res.asset_ids[i];
        if (!assetId) continue;
        if (!splitRow.thumbnailFile) continue;
        pending.push({ id: assetId, thumbnail: splitRow.thumbnailFile });
      }
      setPendingThumbnailUploads(pending);
    } catch (err) {
      setActionError(formatRtkQueryError(err));
    }
  }, [
    file,
    mode,
    originalThumbnailFile,
    originalTitle,
    pageCount,
    splitDrafts,
    uploadKnowledgeDocument,
  ]);

  // Reset thumbnail upload completion state when a new upload starts.
  useEffect(() => {
    setThumbnailUploadsCompletedForUploadId(null);
  }, [uploadId]);

  const disableInputs = uploadInFlight || isUploadingKnowledge;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            Upload Knowledge
          </h1>
          <p className="mt-1 text-sm text-spice-text-muted">
            Upload PDFs for the Knowledge section and manage library assets.
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

      <Card variant="elevated" className="min-w-0 space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-spice-text-primary">
            Upload
          </div>
          <div className="text-sm text-spice-text-muted">
            Choose upload mode, pick one PDF, and monitor processing progress.
          </div>
        </div>

        <div className="space-y-3 rounded-xl bg-spice-bg-tint/50 p-4 ring-1 ring-spice-border">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-spice-text-medium">
                <span>PDF file</span>
                <Tooltip
                  label="About PDF file upload"
                  content="PDF only. Single file upload."
                />
              </div>
            </div>
            {fileSelectionError ? (
              <div className="text-xs text-spice-semantic-error">
                {fileSelectionError}
              </div>
            ) : null}
          </div>

          <FileDropzone
            files={file ? [file] : []}
            onChange={(next) => {
              setFileSelectionError('');
              setActionError('');
              setSplitDraftErrors([]);
              setOriginalThumbnailFile(null);
              setOriginalSuppressAutoThumbnail(false);
              setFile(next[0] ?? null);
            }}
            accept={KNOWLEDGE_FILE_INPUT_ACCEPT}
            disabled={disableInputs}
            showFileList
            title="Select PDF"
            titleWhenSelected="Replace PDF"
            subtitle="Click to select or drag and drop"
            hideSubtitleWhenSelected
            ariaLabel={file ? 'Replace PDF' : 'Select PDF'}
            validateFile={(picked) =>
              isKnowledgeAcceptedFile(picked)
                ? null
                : formatKnowledgeFileRejectionError(picked)
            }
            onReject={(message) => {
              setFileSelectionError(message);
            }}
          />

          {file && isReadingPdf ? (
            <p className="text-xs text-spice-text-muted" role="status">
              Reading PDF…
            </p>
          ) : null}

          {file && pageCount !== null ? (
            <p className="text-xs text-spice-text-muted" role="status">
              This PDF has{' '}
              <span className="font-semibold text-spice-text-primary">
                {pageCount}
              </span>{' '}
              {pageCount === 1 ? 'page' : 'pages'}.
            </p>
          ) : null}

          {file && pdfReadError ? (
            <p className="text-xs text-spice-semantic-error">{pdfReadError}</p>
          ) : null}

          {file ? (
            <>
              <Tabs items={modeTabs} value={mode} onChange={onModeChange} />

              {mode === 'original' ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
                        Title
                      </div>
                      <input
                        type="text"
                        value={originalTitle}
                        disabled={disableInputs}
                        onChange={(e) => setOriginalTitle(e.target.value)}
                        placeholder="e.g. HTN Referral Guidelines"
                        className="h-10 w-full rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:border-spice-brand-primary/40 focus:ring-2 focus:ring-spice-brand-primary/20"
                      />
                    </div>

                    <div className="w-full shrink-0 space-y-2 sm:w-36">
                      <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
                        Thumbnail
                        {isOriginalThumbRendering &&
                        !hasCustomOriginalThumbnail &&
                        !originalSuppressAutoThumbnail
                          ? ' (loading…)'
                          : hasCustomOriginalThumbnail
                            ? ' (custom)'
                            : isBlankOriginalThumbnail
                              ? ' (blank — backend will generate)'
                              : originalAutoThumbnailUrl
                                ? ' (from PDF)'
                                : ''}
                      </div>
                      <ImagePicker
                        variant="tile"
                        value={originalThumbnailValue}
                        onChange={(next) => {
                          if (next) {
                            setOriginalThumbnailFile(next);
                            setOriginalSuppressAutoThumbnail(false);
                            return;
                          }
                          setOriginalThumbnailFile(null);
                          setOriginalSuppressAutoThumbnail(true);
                        }}
                        disabled={disableInputs}
                        clearable={Boolean(originalThumbnailValue)}
                        accept="image/*"
                        label="Optional — leave blank for backend"
                        labelWhenSelected={
                          hasCustomOriginalThumbnail
                            ? 'Change custom'
                            : 'Replace with custom'
                        }
                        previewAlt="Knowledge thumbnail"
                        frameClassName="aspect-square h-auto w-full"
                      />
                      {isBlankOriginalThumbnail ? (
                        <button
                          type="button"
                          disabled={disableInputs || !pdfDocument}
                          className="text-left text-[11px] font-medium text-spice-brand-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => {
                            setOriginalThumbnailFile(null);
                            setOriginalSuppressAutoThumbnail(false);
                          }}
                        >
                          Use PDF preview
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-spice-text-medium">
                        <span>Page splits</span>
                        <Tooltip
                          label="About page splits"
                          content="Add one or more splits. Thumbnail can use the PDF start page, a custom image, or stay blank for backend generation."
                        />
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      className="h-9 text-xs"
                      disabled={disableInputs}
                      onClick={() => {
                        setSplitDraftErrors([]);
                        setSplitDrafts((prev) => [
                          ...prev,
                          createEmptyKnowledgeSplitDraft(),
                        ]);
                      }}
                    >
                      + Add Split
                    </Button>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {splitDrafts.map((row, idx) => (
                      <KnowledgeSplitEditor
                        key={idx}
                        index={idx}
                        value={row}
                        disabled={disableInputs}
                        canRemove={splitDrafts.length > 1}
                        errors={displayedSplitErrors[idx]}
                        pdfDocument={pdfDocument}
                        pageCount={pageCount}
                        onRemove={() => {
                          if (splitDrafts.length <= 1) return;
                          setSplitDraftErrors([]);
                          setSplitDrafts((prev) =>
                            prev.filter((_, i) => i !== idx),
                          );
                        }}
                        onChange={(next) => {
                          setSplitDraftErrors((prev) => {
                            if (prev.length === 0) return prev;
                            return prev.map((err, i) =>
                              i === idx ? { title: err?.title } : err,
                            );
                          });
                          setSplitDrafts((prev) =>
                            prev.map((r, i) => (i === idx ? next : r)),
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-spice-text-muted">
              Select a PDF to choose upload mode (Original or Split).
            </p>
          )}
        </div>

        {actionError ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {actionError}
          </div>
        ) : null}

        <IngestUploadProgress
          active={isUploadingKnowledge}
          label="Uploading PDF…"
        />

        {uploadId ? (
          <div className="space-y-3 rounded-xl border border-spice-border bg-spice-bg-surface/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
                Processing status
              </div>
              <div className="text-xs text-spice-text-muted">
                Upload ID: <span className="font-mono">{uploadId}</span>
              </div>
            </div>

            <div className="space-y-1.5" role="status" aria-live="polite">
              <div className="flex items-center justify-between gap-2 text-xs text-spice-text-muted">
                <span>{uploadProgressLabel}</span>
                <span className="font-mono">
                  {Math.round(uploadProgressValue)}%
                </span>
              </div>
              <CommonProgressBar value={uploadProgressValue} />
            </div>

            {uploadStatusDataResolved?.status === 'failed' ? (
              <div className="text-xs text-spice-semantic-error">
                {uploadStatusDataResolved.error ??
                  'Processing failed. Please retry.'}
              </div>
            ) : null}

            {uploadStatusDataResolved?.status === 'completed' ? (
              <div className="text-xs text-spice-text-muted">
                Assets are ready. If you selected custom thumbnails, they will
                be applied now.
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            className="h-10 text-sm"
            disabled={disableInputs}
            onClick={() => {
              clearAllDrafts();
              setActionError('');
              setUploadId(null);
              setPendingThumbnailUploads([]);
              setThumbnailUploadsCompletedForUploadId(null);
            }}
          >
            Reset
          </Button>
          <Button
            className="h-10 min-w-[10rem] text-sm"
            disabled={!canSubmit}
            onClick={() => void submitUpload()}
          >
            {uploadInFlight ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </Card>

      <KnowledgeLibraryTable />
    </section>
  );
};
