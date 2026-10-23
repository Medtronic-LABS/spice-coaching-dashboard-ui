import { useEffect, useRef } from 'react';
import type { AdminV3IngestBatchStatusResponse } from '@/features/ingest/api/adminIngestApi';
import { hasPendingMergeDecisions } from '@/features/ingest/utils/ingestMergeDecisions';
import { isTerminalIngestStatus } from '@/features/ingest/utils/ingestStatus';

export interface ClearIngestSessionOnTerminalLeaveOptions {
  batchId: string;
  status: AdminV3IngestBatchStatusResponse | null;
  onClear: (batchId: string, status: AdminV3IngestBatchStatusResponse) => void;
}

/** Clears persisted ingest session data when leaving the page after a terminal batch status. */
export function useClearIngestSessionOnTerminalLeave({
  batchId,
  status,
  onClear,
}: ClearIngestSessionOnTerminalLeaveOptions): void {
  const batchIdRef = useRef(batchId);
  const statusRef = useRef(status);
  const onClearRef = useRef(onClear);

  batchIdRef.current = batchId;
  statusRef.current = status;
  onClearRef.current = onClear;

  useEffect(() => {
    return () => {
      const currentBatchId = batchIdRef.current;
      const currentStatus = statusRef.current;
      if (!currentBatchId || !currentStatus) return;
      if (currentStatus.batch_id !== currentBatchId) return;
      if (hasPendingMergeDecisions(currentStatus.merge_decisions)) return;
      if (!isTerminalIngestStatus(currentStatus.status)) return;
      onClearRef.current(currentBatchId, currentStatus);
    };
  }, []);
}
