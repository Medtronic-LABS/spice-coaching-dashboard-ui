import { useCallback, useState } from 'react';
import {
  useStartIngestBatchMutation,
  useUploadIngestFilesMutation,
  type AdminV3IngestAcceptedResponse,
  type AdminV3IngestStartPayload,
  type AdminV3IngestUploadPayload,
  type AdminV3IngestUploadResponse,
  type IngestDuplicateConflict,
} from '@/features/ingest/api/adminIngestApi';
import type { DuplicateIngestDialogVariant } from '@/features/ingest/components/DuplicateIngestConfirmDialog';
import {
  buildIngestOverrideFlags,
  conflictFilenamesFromList,
  conflictsKeptExisting,
  normalizeUploadResponse,
  parseIngestDuplicateError,
  selectFilesForConflicts,
  selectSourceDocumentIdsForConflicts,
  selectSourcesForDuplicateIngestRetry,
  uploadResponseFromDuplicateConflicts,
} from '@/features/ingest/utils/parseIngestDuplicateError';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';

export interface UseIngestWithDuplicateHandlingOptions {
  onUploaded?: (
    response: AdminV3IngestUploadResponse,
    context: {
      isReupload: boolean;
      overriddenFilenames: string[];
      duplicateConflicts: IngestDuplicateConflict[];
    },
  ) => void;
  onAccepted?: (
    response: AdminV3IngestAcceptedResponse,
    context: { isReingest: boolean },
  ) => void;
  onError: (message: string) => void;
}

interface DuplicateDialogState {
  open: boolean;
  variant: DuplicateIngestDialogVariant;
  conflicts: IngestDuplicateConflict[];
}

const closedDialogState: DuplicateDialogState = {
  open: false,
  variant: 'blocked',
  conflicts: [],
};

export function useIngestWithDuplicateHandling({
  onUploaded,
  onAccepted,
  onError,
}: UseIngestWithDuplicateHandlingOptions) {
  const [uploadIngestFiles, { isLoading: isUploading }] =
    useUploadIngestFilesMutation();
  const [startIngestBatch, { isLoading: isStartingIngest }] =
    useStartIngestBatchMutation();
  const [duplicateDialog, setDuplicateDialog] =
    useState<DuplicateDialogState>(closedDialogState);
  const [pendingUploadPayload, setPendingUploadPayload] =
    useState<AdminV3IngestUploadPayload | null>(null);
  const [pendingStartPayload, setPendingStartPayload] =
    useState<AdminV3IngestStartPayload | null>(null);
  const [isConfirmingDuplicate, setIsConfirmingDuplicate] = useState(false);
  const [reusedUploadNotice, setReusedUploadNotice] = useState<
    IngestDuplicateConflict[] | null
  >(null);
  const [keptExistingIngestNotice, setKeptExistingIngestNotice] = useState<
    IngestDuplicateConflict[] | null
  >(null);

  const emitUploaded = useCallback(
    (
      payload: AdminV3IngestUploadPayload,
      response: AdminV3IngestUploadResponse,
      isReupload: boolean,
      overriddenFilenames: string[] = [],
      duplicateConflicts: IngestDuplicateConflict[] = [],
    ) => {
      const normalized = normalizeUploadResponse(payload, response);
      if (normalized.skipped_duplicates?.length) {
        setReusedUploadNotice(normalized.skipped_duplicates);
      } else {
        setReusedUploadNotice(null);
      }
      onUploaded?.(normalized, {
        isReupload,
        overriddenFilenames,
        duplicateConflicts,
      });
    },
    [onUploaded],
  );

  const uploadFiles = useCallback(
    async (payload: AdminV3IngestUploadPayload) => {
      setPendingStartPayload(null);
      setPendingUploadPayload(null);
      setKeptExistingIngestNotice(null);
      setDuplicateDialog(closedDialogState);

      try {
        const response = await uploadIngestFiles(payload).unwrap();
        emitUploaded(payload, response, false);
        return normalizeUploadResponse(payload, response);
      } catch (error) {
        const duplicateDetail = parseIngestDuplicateError(error);
        if (duplicateDetail?.conflicts.length) {
          setPendingUploadPayload(payload);
          setDuplicateDialog({
            open: true,
            variant: 'upload',
            conflicts: duplicateDetail.conflicts,
          });
          return null;
        }

        onError(formatRtkQueryError(error));
        return null;
      }
    },
    [emitUploaded, onError, uploadIngestFiles],
  );

  const handleIngestAccepted = useCallback(
    (
      response: AdminV3IngestAcceptedResponse,
      originalPayload: AdminV3IngestStartPayload,
      isReingest: boolean,
    ) => {
      onAccepted?.(response, { isReingest });
      if (!response.skipped_duplicates?.length || isReingest) {
        return;
      }
      const skippedSourceIds = selectSourceDocumentIdsForConflicts(
        originalPayload.source_document_ids,
        response.skipped_duplicates,
      );
      setDuplicateDialog({
        open: true,
        variant: 'skipped',
        conflicts: response.skipped_duplicates,
      });
      setPendingStartPayload({
        ...originalPayload,
        // Already-queued non-duplicates must not be sent again.
        source_document_ids: skippedSourceIds.length
          ? skippedSourceIds
          : originalPayload.source_document_ids,
        override_duplicates: buildIngestOverrideFlags(
          skippedSourceIds.length
            ? skippedSourceIds
            : originalPayload.source_document_ids,
          response.skipped_duplicates,
        ),
      });
    },
    [onAccepted],
  );

  const startIngest = useCallback(
    async (payload: AdminV3IngestStartPayload) => {
      setDuplicateDialog(closedDialogState);
      setPendingStartPayload(null);
      setPendingUploadPayload(null);
      setKeptExistingIngestNotice(null);

      try {
        const response = await startIngestBatch(payload).unwrap();
        handleIngestAccepted(response, payload, false);
        return response;
      } catch (error) {
        const duplicateDetail = parseIngestDuplicateError(error);
        if (duplicateDetail) {
          setPendingStartPayload({
            ...payload,
            override_duplicates: buildIngestOverrideFlags(
              payload.source_document_ids,
              duplicateDetail.conflicts,
            ),
          });
          setDuplicateDialog({
            open: true,
            variant: 'blocked',
            conflicts: duplicateDetail.conflicts,
          });
          return null;
        }

        onError(formatRtkQueryError(error));
        return null;
      }
    },
    [handleIngestAccepted, onError, startIngestBatch],
  );

  const confirmUploadDuplicate = useCallback(
    async (selectedFilenames: string[]) => {
      if (!pendingUploadPayload) return;

      const selectedSet = conflictFilenamesFromList(
        selectedFilenames.map((filename) => ({ filename })),
      );
      const conflicts = duplicateDialog.conflicts;
      const conflictNames = conflictFilenamesFromList(conflicts);
      const reusedConflicts = conflicts.filter(
        (conflict) => !selectedSet.has(conflict.filename),
      );

      setIsConfirmingDuplicate(true);
      try {
        // Upload non-duplicates always; re-upload only selected duplicates.
        // Unselected duplicates reuse the existing source (no re-upload).
        const indexesToUpload = pendingUploadPayload.files
          .map((file, index) => ({ file, index }))
          .filter(
            ({ file }) =>
              selectedSet.has(file.name) || !conflictNames.has(file.name),
          );

        // Every file was an unselected duplicate — reuse existing sources only.
        if (indexesToUpload.length === 0) {
          const reused = uploadResponseFromDuplicateConflicts(
            pendingUploadPayload,
            conflicts,
          );
          emitUploaded(pendingUploadPayload, reused, true, [], conflicts);
          setPendingUploadPayload(null);
          setDuplicateDialog(closedDialogState);
          return;
        }

        const filesToUpload = indexesToUpload.map(({ file }) => file);
        const selectedConflicts = conflicts.filter((conflict) =>
          selectedSet.has(conflict.filename),
        );
        const selectedVisibility = selectFilesForConflicts(
          pendingUploadPayload.files,
          pendingUploadPayload.sync_published_visible,
          [
            ...selectedConflicts,
            ...pendingUploadPayload.files
              .filter((file) => !conflictNames.has(file.name))
              .map((file) => ({
                filename: file.name,
                title: file.name,
              })),
          ],
        );

        const overrideFlags = indexesToUpload.map(({ file }) =>
          selectedSet.has(file.name),
        );

        const contentDomains = indexesToUpload
          .map(
            ({ index }) =>
              pendingUploadPayload.content_domains?.[index] ??
              pendingUploadPayload.content_domains?.[0],
          )
          .filter(
            (domain): domain is NonNullable<typeof domain> =>
              domain !== undefined,
          );

        const overrideResponse = await uploadIngestFiles({
          files: filesToUpload,
          titles: indexesToUpload.map(
            ({ file, index }) =>
              pendingUploadPayload.titles?.[index] ?? file.name,
          ),
          ...(pendingUploadPayload.descriptions?.length
            ? {
                descriptions: indexesToUpload.map(
                  ({ index }) =>
                    pendingUploadPayload.descriptions?.[index] ?? null,
                ),
              }
            : {}),
          ...(contentDomains.length === filesToUpload.length
            ? { content_domains: contentDomains }
            : {}),
          ...(selectedVisibility.syncPublishedVisible?.length
            ? {
                sync_published_visible: selectedVisibility.syncPublishedVisible,
              }
            : {}),
          override_duplicates: overrideFlags,
        }).unwrap();

        emitUploaded(
          pendingUploadPayload,
          {
            status: 'uploaded',
            sources: overrideResponse.sources,
            skipped_duplicates: reusedConflicts.length
              ? reusedConflicts
              : overrideResponse.skipped_duplicates,
          },
          true,
          selectedFilenames,
          conflicts,
        );
        setPendingUploadPayload(null);
        setDuplicateDialog(closedDialogState);
      } catch (error) {
        const duplicateDetail = parseIngestDuplicateError(error);
        if (duplicateDetail?.conflicts.length) {
          setDuplicateDialog({
            open: true,
            variant: 'upload',
            conflicts: duplicateDetail.conflicts,
          });
          return;
        }

        onError(formatRtkQueryError(error));
        setPendingUploadPayload(null);
        setDuplicateDialog(closedDialogState);
      } finally {
        setIsConfirmingDuplicate(false);
      }
    },
    [
      duplicateDialog.conflicts,
      emitUploaded,
      onError,
      pendingUploadPayload,
      uploadIngestFiles,
    ],
  );

  const confirmIngestDuplicate = useCallback(
    async (selectedFilenames: string[]) => {
      if (!pendingStartPayload) return;

      const keptExistingConflicts = conflictsKeptExisting(
        duplicateDialog.conflicts,
        selectedFilenames,
      );
      const { sourceDocumentIds, overrideDuplicates } =
        selectSourcesForDuplicateIngestRetry(
          pendingStartPayload.source_document_ids,
          duplicateDialog.conflicts,
          selectedFilenames,
        );

      // Nothing left to queue: keep existing for unselected duplicates.
      if (sourceDocumentIds.length === 0) {
        setKeptExistingIngestNotice(
          keptExistingConflicts.length ? keptExistingConflicts : null,
        );
        setPendingStartPayload(null);
        setDuplicateDialog(closedDialogState);
        return;
      }

      const nextPayload: AdminV3IngestStartPayload = {
        ...pendingStartPayload,
        source_document_ids: sourceDocumentIds,
        override_duplicates: overrideDuplicates,
      };

      setIsConfirmingDuplicate(true);
      try {
        const response = await startIngestBatch(nextPayload).unwrap();
        const isReingest = duplicateDialog.variant === 'skipped';
        handleIngestAccepted(response, nextPayload, isReingest);
        setKeptExistingIngestNotice(
          keptExistingConflicts.length ? keptExistingConflicts : null,
        );
        setPendingStartPayload(null);
        setDuplicateDialog(closedDialogState);
      } catch (error) {
        const duplicateDetail = parseIngestDuplicateError(error);
        if (duplicateDetail) {
          setDuplicateDialog({
            open: true,
            variant: 'blocked',
            conflicts: duplicateDetail.conflicts,
          });
          setPendingStartPayload({
            ...nextPayload,
            override_duplicates: buildIngestOverrideFlags(
              nextPayload.source_document_ids,
              duplicateDetail.conflicts,
            ),
          });
          return;
        }

        onError(formatRtkQueryError(error));
        setPendingStartPayload(null);
        setDuplicateDialog(closedDialogState);
      } finally {
        setIsConfirmingDuplicate(false);
      }
    },
    [
      duplicateDialog.conflicts,
      duplicateDialog.variant,
      handleIngestAccepted,
      onError,
      pendingStartPayload,
      startIngestBatch,
    ],
  );

  const confirmDuplicate = useCallback(
    async (selectedFilenames: string[]) => {
      if (pendingUploadPayload) {
        await confirmUploadDuplicate(selectedFilenames);
        return;
      }
      await confirmIngestDuplicate(selectedFilenames);
    },
    [confirmIngestDuplicate, confirmUploadDuplicate, pendingUploadPayload],
  );

  const cancelDuplicate = useCallback(() => {
    setPendingUploadPayload(null);
    setPendingStartPayload(null);
    setDuplicateDialog(closedDialogState);
  }, []);

  return {
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
  };
}
