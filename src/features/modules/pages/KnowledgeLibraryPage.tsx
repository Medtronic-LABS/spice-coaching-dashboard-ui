import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from '@/assets/icon';
import {
  Button,
  Card,
  FileDropzone,
  ImagePicker,
  LimitedTextInput,
  Tabs,
  Tooltip,
  type TabItem,
} from '@/components/ui';
import {
  FIELD_LIMITS,
  fieldLimitExceededMessage,
} from '@/constants/fieldLimits';
import { paths } from '@/constants/routes';
import { ADMIN_IMAGE_ACCEPT_SIZE_HINT } from '@/constants/uploadLimits';
import { IMAGE_FILE_INPUT_ACCEPT } from '@/utils/acceptedImageFile';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';
import {
  useUploadKnowledgeDocumentMutation,
  type KnowledgeUploadPayload,
} from '@/features/modules/api/adminKnowledgeApi';
import { useUploadAdminFileMutation } from '@/features/modules/api/adminFilesApi';
import { DuplicateIngestConfirmDialog } from '@/features/ingest/components/DuplicateIngestConfirmDialog';
import { IngestUploadProgress } from '@/features/ingest/components/IngestUploadProgress';
import type { IngestDuplicateConflict } from '@/features/ingest/api/adminIngestApi';
import { parseIngestDuplicateError } from '@/features/ingest/utils/parseIngestDuplicateError';
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
import { fileFromObjectUrl } from '@/features/modules/utils/knowledgeThumbnailFile';
import { renderPdfPageToObjectUrl } from '@/features/modules/utils/pdfjsClient';
import {
  createEmptyKnowledgeSplitDraft,
  type KnowledgeSplitDraft,
  type KnowledgeUploadMode,
} from '@/features/modules/types/knowledgeLibrary.types';

async function resolveThumbnailFile(options: {
  customFile: File | null | undefined;
  suppressAuto: boolean;
  autoUrl: string | null;
  filename: string;
}): Promise<File | null> {
  if (options.customFile) return options.customFile;
  if (options.suppressAuto || !options.autoUrl) return null;
  return fileFromObjectUrl(options.autoUrl, options.filename);
}

export const KnowledgeLibraryPage = () => {
  const navigate = useNavigate();

  const [uploadKnowledgeDocument, { isLoading: isUploadingKnowledge }] =
    useUploadKnowledgeDocumentMutation();
  const [uploadAdminFile, { isLoading: isUploadingThumbnail }] =
    useUploadAdminFileMutation();

  const [mode, setMode] = useState<KnowledgeUploadMode>('original');
  const [file, setFile] = useState<File | null>(null);
  const [fileSelectionError, setFileSelectionError] = useState('');

  const [originalTitle, setOriginalTitle] = useState('');
  const [originalThumbnailFile, setOriginalThumbnailFile] =
    useState<File | null>(null);
  const [originalSuppressAutoThumbnail, setOriginalSuppressAutoThumbnail] =
    useState(false);

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
  const [reusedUploadNotice, setReusedUploadNotice] = useState<
    IngestDuplicateConflict[] | null
  >(null);
  const [pendingUploadPayload, setPendingUploadPayload] =
    useState<KnowledgeUploadPayload | null>(null);
  const [duplicateConflicts, setDuplicateConflicts] = useState<
    IngestDuplicateConflict[]
  >([]);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [isConfirmingDuplicate, setIsConfirmingDuplicate] = useState(false);
  const [splitDraftErrors, setSplitDraftErrors] = useState<
    KnowledgeSplitDraftFieldErrors[]
  >([]);

  const clearDuplicateDialog = useCallback(() => {
    setDuplicateDialogOpen(false);
    setDuplicateConflicts([]);
    setPendingUploadPayload(null);
    setIsConfirmingDuplicate(false);
  }, []);

  const clearAllDrafts = useCallback(() => {
    setFile(null);
    setFileSelectionError('');
    setOriginalTitle('');
    setOriginalThumbnailFile(null);
    setOriginalSuppressAutoThumbnail(false);
    setSplitDraftErrors([]);
    setSplitDrafts([createEmptyKnowledgeSplitDraft()]);
    clearDuplicateDialog();
  }, [clearDuplicateDialog]);

  const onModeChange = useCallback((nextMode: string) => {
    const resolved = nextMode === 'split' ? 'split' : 'original';
    setMode(resolved);
    setActionError('');
    setReusedUploadNotice(null);
    setFileSelectionError('');
    setSplitDraftErrors([]);

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

  const isBusy =
    isUploadingKnowledge || isUploadingThumbnail || isConfirmingDuplicate;

  const canSubmit = useMemo(() => {
    if (!file) return false;
    if (isBusy) return false;
    if (mode === 'original') return Boolean(originalTitle.trim());
    return true;
  }, [file, isBusy, mode, originalTitle]);

  const runKnowledgeUpload = useCallback(
    async (payload: KnowledgeUploadPayload) => {
      try {
        await uploadKnowledgeDocument(payload).unwrap();
        setReusedUploadNotice(null);
        clearAllDrafts();
        return true;
      } catch (err) {
        const duplicateDetail = parseIngestDuplicateError(err);
        if (duplicateDetail?.conflicts.length && !payload.overrideDuplicates) {
          setPendingUploadPayload(payload);
          setDuplicateConflicts(duplicateDetail.conflicts);
          setDuplicateDialogOpen(true);
          return false;
        }
        setActionError(formatRtkQueryError(err));
        return false;
      }
    },
    [clearAllDrafts, uploadKnowledgeDocument],
  );

  const submitUpload = useCallback(async () => {
    if (!file) {
      setFileSelectionError('Please select a PDF.');
      return;
    }

    setActionError('');
    setReusedUploadNotice(null);
    setFileSelectionError('');
    setSplitDraftErrors([]);
    clearDuplicateDialog();

    try {
      if (mode === 'original') {
        const title = originalTitle.trim();
        if (!title) {
          setActionError('Title is required for Upload Original.');
          return;
        }
        if (title.length > FIELD_LIMITS.documentTitle) {
          setActionError(
            fieldLimitExceededMessage('Title', FIELD_LIMITS.documentTitle),
          );
          return;
        }

        const thumbnailFile = await resolveThumbnailFile({
          customFile: originalThumbnailFile,
          suppressAuto: originalSuppressAutoThumbnail,
          autoUrl: originalAutoThumbnailUrl,
          filename: `${file.name.replace(/\.pdf$/i, '')}-thumb.png`,
        });
        let thumbnailStoragePath: string | undefined;
        if (thumbnailFile) {
          const uploaded = await uploadAdminFile({
            file: thumbnailFile,
          }).unwrap();
          thumbnailStoragePath = uploaded.storage_path;
        }

        await runKnowledgeUpload({
          file,
          title,
          thumbnailStoragePath,
        });
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

      const splitsPayload = [];
      for (const [index, row] of splitDrafts.entries()) {
        const thumbnailFile = await resolveThumbnailFile({
          customFile: row.thumbnailFile,
          suppressAuto: Boolean(row.suppressAutoThumbnail),
          autoUrl: null,
          filename: `${file.name.replace(/\.pdf$/i, '')}-split-${index + 1}-thumb.png`,
        });
        let thumbnailStoragePath: string | undefined;
        if (thumbnailFile) {
          const uploaded = await uploadAdminFile({
            file: thumbnailFile,
          }).unwrap();
          thumbnailStoragePath = uploaded.storage_path;
        } else if (
          !row.suppressAutoThumbnail &&
          pdfDocument &&
          Number.isFinite(row.startPage)
        ) {
          const autoUrl = await renderPdfPageToObjectUrl(
            pdfDocument,
            row.startPage,
            { maxWidth: 180 },
          );
          try {
            const autoFile = await fileFromObjectUrl(
              autoUrl,
              `${file.name.replace(/\.pdf$/i, '')}-split-${index + 1}-thumb.png`,
            );
            const uploaded = await uploadAdminFile({ file: autoFile }).unwrap();
            thumbnailStoragePath = uploaded.storage_path;
          } finally {
            URL.revokeObjectURL(autoUrl);
          }
        }

        splitsPayload.push({
          title: row.title.trim(),
          start_page: row.startPage,
          end_page: row.endPage,
          ...(thumbnailStoragePath
            ? { thumbnail_storage_path: thumbnailStoragePath }
            : {}),
        });
      }

      await runKnowledgeUpload({
        file,
        splits: splitsPayload,
      });
    } catch (err) {
      setActionError(formatRtkQueryError(err));
    }
  }, [
    clearDuplicateDialog,
    file,
    mode,
    originalAutoThumbnailUrl,
    originalSuppressAutoThumbnail,
    originalThumbnailFile,
    originalTitle,
    pageCount,
    pdfDocument,
    runKnowledgeUpload,
    splitDrafts,
    uploadAdminFile,
  ]);

  const confirmDuplicate = useCallback(
    async (selectedFilenames: string[]) => {
      if (!pendingUploadPayload) return;

      // Skip Upload — keep existing library document(s); do not create a new row.
      if (selectedFilenames.length === 0) {
        setReusedUploadNotice(duplicateConflicts);
        clearAllDrafts();
        return;
      }

      setIsConfirmingDuplicate(true);
      setActionError('');
      try {
        const ok = await runKnowledgeUpload({
          ...pendingUploadPayload,
          overrideDuplicates: true,
        });
        if (!ok) {
          clearDuplicateDialog();
        }
      } finally {
        setIsConfirmingDuplicate(false);
      }
    },
    [
      clearAllDrafts,
      clearDuplicateDialog,
      duplicateConflicts,
      pendingUploadPayload,
      runKnowledgeUpload,
    ],
  );

  const disableInputs = isBusy;

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
            className="inline-flex h-9 items-center gap-1.5 text-xs"
            onClick={() => navigate(paths.moduleLibrary)}
          >
            Module Library
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {reusedUploadNotice?.length ? (
        <div
          className="rounded-lg border border-spice-border bg-spice-bg-tint px-3 py-2 text-xs text-spice-text-medium"
          role="status"
        >
          <span className="font-semibold text-spice-text-primary">
            Already uploaded.
          </span>{' '}
          Reusing existing knowledge document
          {reusedUploadNotice.length === 1 ? '' : 's'}:{' '}
          {reusedUploadNotice
            .map((conflict) => conflict.title || conflict.filename)
            .join(', ')}
          . It remains available in the library below.
        </div>
      ) : null}

      <Card variant="elevated" className="min-w-0 space-y-5 p-4 sm:p-6">
        <div className="text-sm font-semibold text-spice-text-primary">
          Upload
        </div>

        <div className="space-y-3 rounded-xl bg-spice-bg-tint/50 p-4 ring-1 ring-spice-border">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-spice-text-medium">
                <span>
                  PDF file <span className="text-spice-semantic-error">*</span>
                </span>
                <Tooltip
                  label="About PDF file upload"
                  content="PDF only. Single file upload. Max 100 MB."
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
              setReusedUploadNotice(null);
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
                        Title{' '}
                        <span className="text-spice-semantic-error">*</span>
                      </div>
                      <LimitedTextInput
                        id="knowledge-original-title"
                        aria-label="Title"
                        value={originalTitle}
                        disabled={disableInputs}
                        maxLength={FIELD_LIMITS.documentTitle}
                        onChange={setOriginalTitle}
                        placeholder="e.g. HTN Referral Guidelines"
                      />
                    </div>

                    <div className="w-full shrink-0 space-y-2 sm:w-44">
                      <div className="text-xs font-semibold tracking-wide text-spice-text-medium">
                        Thumbnail
                        {isOriginalThumbRendering &&
                        !hasCustomOriginalThumbnail &&
                        !originalSuppressAutoThumbnail
                          ? ' (loading…)'
                          : hasCustomOriginalThumbnail
                            ? ' (custom)'
                            : isBlankOriginalThumbnail
                              ? ' (none)'
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
                        accept={IMAGE_FILE_INPUT_ACCEPT}
                        label="Optional — leave blank for none"
                        labelWhenSelected={
                          hasCustomOriginalThumbnail
                            ? 'Change custom'
                            : 'Replace with custom'
                        }
                        hint={ADMIN_IMAGE_ACCEPT_SIZE_HINT}
                        previewAlt="Knowledge thumbnail"
                        frameClassName="aspect-square h-auto w-full"
                        previewObjectFit="contain"
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
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-spice-text-medium">
                        <span>Page splits</span>
                        <Tooltip
                          label="About page splits"
                          content="Each split becomes its own PDF in the library. Thumbnail can use the PDF start page, a custom image, or stay blank."
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
          active={isBusy}
          label={
            isUploadingThumbnail ? 'Uploading thumbnail…' : 'Uploading PDF…'
          }
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            className="h-9 text-xs"
            disabled={disableInputs}
            onClick={() => {
              clearAllDrafts();
              setActionError('');
              setReusedUploadNotice(null);
            }}
          >
            Reset
          </Button>
          <Button
            className="h-9 text-xs"
            disabled={!canSubmit}
            onClick={() => void submitUpload()}
          >
            {isBusy ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </Card>

      <KnowledgeLibraryTable />

      <DuplicateIngestConfirmDialog
        open={duplicateDialogOpen}
        variant="upload"
        conflicts={duplicateConflicts}
        isConfirming={isConfirmingDuplicate}
        onCancel={clearDuplicateDialog}
        onConfirm={(selectedFilenames) => {
          void confirmDuplicate(selectedFilenames);
        }}
      />
    </section>
  );
};
