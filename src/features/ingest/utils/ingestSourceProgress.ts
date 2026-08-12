import type {
  AdminV3IngestBatchNode,
  AdminV3IngestBatchSourceStatus,
} from '@/features/ingest/api/adminIngestApi';
import {
  isIngestRunning,
  isIngestSucceeded,
  isTerminalIngestStatus,
} from '@/features/ingest/utils/ingestStatus';

export type IngestDocumentProgressStatus =
  | 'Queued'
  | 'Running'
  | 'Completed'
  | 'Failed'
  | 'Skipped';

export type FlattenedIngestBatchNode = AdminV3IngestBatchNode & {
  path: string;
};

export function flattenIngestBatchNodes(
  nodes: AdminV3IngestBatchNode[],
  prefix = '',
): FlattenedIngestBatchNode[] {
  const rows: FlattenedIngestBatchNode[] = [];
  for (const node of nodes) {
    const path = prefix ? `${prefix}/${node.key}` : node.key;
    rows.push({ ...node, path });
    if (node.children?.length) {
      rows.push(...flattenIngestBatchNodes(node.children, path));
    }
  }
  return rows;
}

function normalizeStatus(status: string | undefined): string {
  return (status ?? '').toLowerCase().trim();
}

function parseInstantMs(value: string | null | undefined): number {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return 0;
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function isIngestStepFinished(status: string | undefined): boolean {
  const s = normalizeStatus(status);
  if (!s) return false;
  if (isIngestSucceeded(status)) return true;
  return (
    s.includes('fail') ||
    s.includes('error') ||
    s.includes('skip') ||
    s.includes('cancel') ||
    s.includes('complete')
  );
}

/** Compact status labels for the collapsed document progress card. */
export function formatIngestDocumentProgressStatus(
  status: string | undefined,
): IngestDocumentProgressStatus {
  const s = normalizeStatus(status);
  if (s.includes('skip')) return 'Skipped';
  if (s.includes('fail') || s.includes('error')) return 'Failed';
  if (isIngestSucceeded(status) || s.includes('complete')) return 'Completed';
  if (isIngestRunning(status)) return 'Running';
  if (
    s.includes('queue') ||
    s === 'pending' ||
    s === 'queued' ||
    s === 'pipeline_queued'
  ) {
    return 'Queued';
  }
  if (isTerminalIngestStatus(status)) return 'Completed';
  return 'Queued';
}

/**
 * Overall document progress from finished pipeline nodes.
 * Returns `null` when percentage is not yet meaningful (no nodes).
 * Completed sources always report 100%.
 */
export function computeIngestSourceProgressPercent(
  source: Pick<AdminV3IngestBatchSourceStatus, 'status' | 'nodes'>,
): number | null {
  if (isIngestSucceeded(source.status)) return 100;

  const nodes = flattenIngestBatchNodes(source.nodes ?? []);
  if (!nodes.length) return null;

  const finished = nodes.filter((node) =>
    isIngestStepFinished(node.status),
  ).length;
  return Math.max(
    0,
    Math.min(100, Math.round((finished / nodes.length) * 100)),
  );
}

/** Running step, else most recently updated/completed step. */
export function getLatestIngestSourceStep(
  nodes: FlattenedIngestBatchNode[],
): FlattenedIngestBatchNode | null {
  if (!nodes.length) return null;

  const running = [...nodes]
    .reverse()
    .find((node) => isIngestRunning(node.status));
  if (running) return running;

  return nodes.reduce<FlattenedIngestBatchNode>((best, node) => {
    const nodeTime = Math.max(
      parseInstantMs(node.completed_at),
      parseInstantMs(node.started_at),
    );
    const bestTime = Math.max(
      parseInstantMs(best.completed_at),
      parseInstantMs(best.started_at),
    );
    if (nodeTime > bestTime) return node;
    if (nodeTime === bestTime && isIngestStepFinished(node.status)) {
      return node;
    }
    return best;
  }, nodes[0]);
}

export function getIngestSourceStepLabel(
  node: FlattenedIngestBatchNode | null | undefined,
): string | null {
  if (!node) return null;
  const title = node.title?.trim();
  if (title) return title;
  const key = node.key?.trim();
  return key || null;
}

export function countGeneratedModulesFromSource(
  source: Pick<AdminV3IngestBatchSourceStatus, 'nodes'> | null | undefined,
): number {
  if (!source) return 0;
  const seen = new Set<string>();
  for (const node of flattenIngestBatchNodes(source.nodes ?? [])) {
    const summary = node.output_summary;
    if (!summary || typeof summary !== 'object') continue;
    const raw = summary.module_id;
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (trimmed) seen.add(trimmed);
  }
  return seen.size;
}

export function hasSimilarityDetectedInSource(
  source: Pick<AdminV3IngestBatchSourceStatus, 'nodes'> | null | undefined,
): boolean {
  if (!source) return false;
  for (const node of flattenIngestBatchNodes(source.nodes ?? [])) {
    if (node.published_module_merge?.was_merge === true) {
      return true;
    }
    const summary = node.output_summary;
    if (summary && typeof summary === 'object') {
      const rec = summary as Record<string, unknown>;
      if (
        rec.has_similarity === true ||
        rec.review_pending === true ||
        rec.similarity_detected === true ||
        rec.was_merge === true
      ) {
        return true;
      }
    }
  }
  return false;
}
