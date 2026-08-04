import type {
  AdminV3IngestStatusResponse,
  AdminV3IngestStep,
} from '@/features/ingest/api/adminIngestApi';

function normalizeIngestStatus(status: string | undefined): string {
  return (status ?? '').toLowerCase();
}

function moduleIdFromCardDraftStep(step: AdminV3IngestStep): string | null {
  if (step.stage !== 'card_draft') return null;
  const summary = step.output_summary;
  if (!summary || typeof summary !== 'object') return null;
  const raw = summary.module_id;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Prefer top-level `generated_module_count` when the API provides it
 * (ingestion-runs list/detail). Fall back to distinct non-null
 * `card_draft.output_summary.module_id` values from poll payloads.
 */
export function countGeneratedModulesFromIngestStatus(
  status:
    | Pick<AdminV3IngestStatusResponse, 'generated_module_count' | 'steps'>
    | null
    | undefined,
): number {
  if (!status) return 0;
  const topLevel = status.generated_module_count;
  if (
    typeof topLevel === 'number' &&
    Number.isFinite(topLevel) &&
    topLevel >= 0
  ) {
    return Math.floor(topLevel);
  }
  const seen = new Set<string>();
  for (const step of status.steps ?? []) {
    const moduleId = moduleIdFromCardDraftStep(step);
    if (moduleId) seen.add(moduleId);
  }
  return seen.size;
}

export function isTerminalIngestStatus(status: string | undefined): boolean {
  const s = normalizeIngestStatus(status);
  return (
    isIngestSucceeded(status) ||
    s.includes('fail') ||
    s.includes('error') ||
    s.includes('cancel') ||
    s.includes('complete')
  );
}

export function isIngestSucceeded(status: string | undefined): boolean {
  const s = normalizeIngestStatus(status);
  return s === 'succeeded' || s === 'partially_succeeded';
}

export function isIngestRunning(status: string | undefined): boolean {
  const s = normalizeIngestStatus(status);
  return s === 'running' || s.endsWith('_running');
}

export function hasGeneratedIngestModules(
  generatedModuleCount: number | undefined,
): boolean {
  return (
    typeof generatedModuleCount === 'number' &&
    Number.isFinite(generatedModuleCount) &&
    generatedModuleCount > 0
  );
}

export interface IngestStatusOptions {
  /** When true, keep treating the batch as in-progress and continue polling. */
  hasPendingMergeDecisions?: boolean;
}

export function isIngestInProgress(
  sourceDocumentId: string,
  status: string | undefined,
  options?: IngestStatusOptions,
): boolean {
  if (!sourceDocumentId) return false;
  if (options?.hasPendingMergeDecisions) return true;
  if (!status) return true;
  if (isIngestRunning(status)) return true;
  const s = normalizeIngestStatus(status);
  if (s === 'pipeline_queued' || s === 'queued' || s === 'pending') {
    return true;
  }
  return !isTerminalIngestStatus(status);
}

export function shouldPollIngestStatus(
  sourceDocumentId: string,
  status: string | undefined,
  options?: IngestStatusOptions,
): boolean {
  if (!sourceDocumentId) return false;
  if (options?.hasPendingMergeDecisions) return true;
  if (!status) return true;
  return !isTerminalIngestStatus(status);
}

/** True when the batch may show its normal completion UI. */
export function canCompleteIngestFlow(
  status: string | undefined,
  options?: IngestStatusOptions,
): boolean {
  if (options?.hasPendingMergeDecisions) return false;
  return isIngestSucceeded(status);
}
