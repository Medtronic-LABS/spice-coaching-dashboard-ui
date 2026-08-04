import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdminV3IngestBatchSourceStatus,
  AdminV3IngestMergeDecision,
  IngestMergeDecisionChoice,
} from '@/features/ingest/api/adminIngestApi';
import { useSubmitIngestMergeDecisionMutation } from '@/features/ingest/api/adminIngestApi';
import type { MergeDecisionOutcome } from '@/features/ingest/components/IngestMergeReviewModal';
import {
  enrichMergeDecisionsFromBatch,
  getRtkErrorCode,
  getRtkErrorStatus,
  hasPendingMergeDecisions,
  mergeDecisionKey,
  resolveMatchedModuleId,
} from '@/features/ingest/utils/ingestMergeDecisions';

export interface MergeReviewNotification {
  tone: 'success' | 'error' | 'warning';
  message: string;
}

export interface UseIngestMergeReviewOptions {
  batchId: string;
  mergeDecisions: unknown[] | null | undefined;
  sources: readonly AdminV3IngestBatchSourceStatus[] | null | undefined;
  onRefreshStatus: () => void | Promise<unknown>;
}

export function useIngestMergeReview({
  batchId,
  mergeDecisions,
  sources,
  onRefreshStatus,
}: UseIngestMergeReviewOptions) {
  const [submitMergeDecision] = useSubmitIngestMergeDecisionMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [previewModuleId, setPreviewModuleId] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<
    Record<string, MergeDecisionOutcome>
  >({});
  const [submittingKeys, setSubmittingKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [mergeUnavailableKeys, setMergeUnavailableKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [notification, setNotification] =
    useState<MergeReviewNotification | null>(null);
  const previousPendingRef = useRef(false);

  const decisions = useMemo(
    () => enrichMergeDecisionsFromBatch(mergeDecisions, sources),
    [mergeDecisions, sources],
  );
  const reviewRequired = hasPendingMergeDecisions(decisions);

  useEffect(() => {
    if (!reviewRequired) {
      if (previousPendingRef.current) {
        setModalOpen(false);
        setOutcomes({});
        setMergeUnavailableKeys(new Set());
        setNotification(null);
      }
      previousPendingRef.current = false;
      return;
    }
    previousPendingRef.current = true;
  }, [reviewRequired]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const openModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    const allDecided =
      decisions.length === 0 ||
      decisions.every((decision) => outcomes[mergeDecisionKey(decision)]);
    if (!allDecided) return;
    setModalOpen(false);
  }, [decisions, outcomes]);

  const openModulePreview = useCallback(
    (decision: AdminV3IngestMergeDecision) => {
      const moduleId = resolveMatchedModuleId(decision);
      if (!moduleId) {
        setNotification({
          tone: 'error',
          message:
            'Unable to open module preview because matched_module_id was not returned.',
        });
        return;
      }
      setPreviewModuleId(moduleId);
    },
    [],
  );

  const closeModulePreview = useCallback(() => {
    setPreviewModuleId(null);
  }, []);

  const decide = useCallback(
    async (
      decision: AdminV3IngestMergeDecision,
      choice: IngestMergeDecisionChoice,
    ) => {
      if (!batchId) return;
      const key = mergeDecisionKey(decision);
      if (submittingKeys.has(key) || outcomes[key]) return;

      setSubmittingKeys((previous) => {
        const next = new Set(previous);
        next.add(key);
        return next;
      });

      try {
        await submitMergeDecision({
          batchId,
          body: {
            run_id: decision.run_id,
            candidate_id: decision.candidate_id,
            decision: choice,
          },
        }).unwrap();

        setOutcomes((previous) => ({ ...previous, [key]: choice }));
        setNotification({
          tone: 'success',
          message:
            choice === 'accept_merge'
              ? 'Module merged successfully.'
              : 'New module created successfully.',
        });
        await onRefreshStatus();
      } catch (error) {
        const status = getRtkErrorStatus(error);
        const code = getRtkErrorCode(error);

        if (status === 409 || code === 'matched_module_unavailable') {
          setMergeUnavailableKeys((previous) => {
            const next = new Set(previous);
            next.add(key);
            return next;
          });
          setNotification({
            tone: 'warning',
            message:
              'The matched module is no longer available. You can Skip Merge to create a new module.',
          });
          await onRefreshStatus();
          return;
        }

        if (status === 404) {
          setNotification({
            tone: 'error',
            message:
              choice === 'accept_merge'
                ? 'Unable to merge module. Please try again.'
                : 'Unable to create new module. Please try again.',
          });
          await onRefreshStatus();
          return;
        }

        // 200-style no-ops and other soft responses are handled by unwrap;
        // unknown failures still refresh polling and surface a friendly message.
        setNotification({
          tone: 'error',
          message:
            choice === 'accept_merge'
              ? 'Unable to merge module. Please try again.'
              : 'Unable to create new module. Please try again.',
        });
        await onRefreshStatus();
      } finally {
        setSubmittingKeys((previous) => {
          const next = new Set(previous);
          next.delete(key);
          return next;
        });
      }
    },
    [batchId, onRefreshStatus, outcomes, submitMergeDecision, submittingKeys],
  );

  const displayDecisions = useMemo(() => {
    if (decisions.length) return decisions;
    return [];
  }, [decisions]);

  return {
    reviewRequired,
    decisions: displayDecisions,
    modalOpen,
    openModal,
    closeModal,
    previewModuleId,
    openModulePreview,
    closeModulePreview,
    outcomes,
    submittingKeys,
    mergeUnavailableKeys,
    notification,
    decide,
  };
}
