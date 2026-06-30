import { useCallback, useState } from 'react';
import {
  useIngestDocumentsMutation,
  type AdminV3IngestAcceptedResponse,
  type AdminV3IngestBatchFormPayload,
  type IngestDuplicateConflict,
} from '@/features/module-library/api/adminIngestApi';
import type { DuplicateIngestDialogVariant } from '@/features/module-library/components/DuplicateIngestConfirmDialog';
import {
  buildOverrideFlags,
  conflictFilenamesFromList,
  parseIngestDuplicateError,
  selectFilesForConflicts,
} from '@/features/module-library/utils/parseIngestDuplicateError';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';

export interface UseIngestWithDuplicateHandlingOptions {
  onAccepted: (
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
  onAccepted,
  onError,
}: UseIngestWithDuplicateHandlingOptions) {
  const [ingestDocuments, { isLoading: isUploading }] =
    useIngestDocumentsMutation();
  const [duplicateDialog, setDuplicateDialog] =
    useState<DuplicateDialogState>(closedDialogState);
  const [pendingPayload, setPendingPayload] =
    useState<AdminV3IngestBatchFormPayload | null>(null);
  const [isConfirmingDuplicate, setIsConfirmingDuplicate] = useState(false);
  const [dismissedSkippedNotice, setDismissedSkippedNotice] = useState<
    IngestDuplicateConflict[] | null
  >(null);

  const openSkippedDialog = useCallback(
    (
      conflicts: IngestDuplicateConflict[],
      originalPayload: AdminV3IngestBatchFormPayload,
    ) => {
      const { files, titles } = selectFilesForConflicts(
        originalPayload.files,
        originalPayload.titles,
        conflicts,
      );
      if (!files.length) return;

      setPendingPayload({
        ...originalPayload,
        files,
        titles,
        override_duplicates: files.map(() => true),
      });
      setDuplicateDialog({
        open: true,
        variant: 'skipped',
        conflicts,
      });
    },
    [],
  );

  const handleAccepted = useCallback(
    (
      response: AdminV3IngestAcceptedResponse,
      originalPayload: AdminV3IngestBatchFormPayload,
      isReingest: boolean,
    ) => {
      onAccepted(response, { isReingest });

      if (response.skipped_duplicates?.length && !isReingest) {
        openSkippedDialog(response.skipped_duplicates, originalPayload);
        return;
      }

      setDismissedSkippedNotice(null);
    },
    [onAccepted, openSkippedDialog],
  );

  const submitIngest = useCallback(
    async (payload: AdminV3IngestBatchFormPayload) => {
      setDismissedSkippedNotice(null);
      setPendingPayload(null);
      setDuplicateDialog(closedDialogState);

      try {
        const response = await ingestDocuments(payload).unwrap();
        handleAccepted(response, payload, false);
        return response;
      } catch (error) {
        const duplicateDetail = parseIngestDuplicateError(error);
        if (duplicateDetail) {
          const conflictNames = conflictFilenamesFromList(
            duplicateDetail.conflicts,
          );
          setPendingPayload({
            ...payload,
            override_duplicates: buildOverrideFlags(
              payload.files,
              conflictNames,
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
    [handleAccepted, ingestDocuments, onError],
  );

  const confirmDuplicate = useCallback(async () => {
    if (!pendingPayload) return;

    setIsConfirmingDuplicate(true);
    try {
      const response = await ingestDocuments(pendingPayload).unwrap();
      const isReingest = duplicateDialog.variant === 'skipped';
      handleAccepted(response, pendingPayload, isReingest);
      setPendingPayload(null);
      setDuplicateDialog(closedDialogState);
    } catch (error) {
      const duplicateDetail = parseIngestDuplicateError(error);
      if (duplicateDetail) {
        setDuplicateDialog({
          open: true,
          variant: 'blocked',
          conflicts: duplicateDetail.conflicts,
        });
        if (pendingPayload) {
          const conflictNames = conflictFilenamesFromList(
            duplicateDetail.conflicts,
          );
          setPendingPayload({
            ...pendingPayload,
            override_duplicates: buildOverrideFlags(
              pendingPayload.files,
              conflictNames,
            ),
          });
        }
        return;
      }

      onError(formatRtkQueryError(error));
      setPendingPayload(null);
      setDuplicateDialog(closedDialogState);
    } finally {
      setIsConfirmingDuplicate(false);
    }
  }, [
    duplicateDialog.variant,
    handleAccepted,
    ingestDocuments,
    onError,
    pendingPayload,
  ]);

  const cancelDuplicate = useCallback(() => {
    if (duplicateDialog.variant === 'skipped') {
      setDismissedSkippedNotice(duplicateDialog.conflicts);
    }
    setPendingPayload(null);
    setDuplicateDialog(closedDialogState);
  }, [duplicateDialog.conflicts, duplicateDialog.variant]);

  return {
    submitIngest,
    confirmDuplicate,
    cancelDuplicate,
    duplicateDialog,
    isUploading,
    isConfirmingDuplicate,
    dismissedSkippedNotice,
  };
}
