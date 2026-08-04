import type {
  AdminV3IngestBatchNode,
  AdminV3IngestBatchSourceStatus,
  AdminV3IngestMergeDecision,
  IngestMergeDecisionChoice,
} from '@/features/ingest/api/adminIngestApi';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readOptionalString(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

/** Read an id from either a flat string field or a nested `{ id | module_id }` object. */
function readModuleId(
  record: Record<string, unknown>,
  flatKeys: string[],
  nestedKeys: string[],
): string | null {
  const flat = readOptionalString(record, flatKeys);
  if (flat) return flat;

  for (const key of nestedKeys) {
    const nested = record[key];
    if (!isRecord(nested)) continue;
    const nestedId = readOptionalString(nested, [
      'id',
      'module_id',
      'matched_module_id',
      'published_module_id',
    ]);
    if (nestedId) return nestedId;
  }
  return null;
}

function readModuleTitle(
  record: Record<string, unknown>,
  flatKeys: string[],
  nestedKeys: string[],
): string | null {
  const flat = readOptionalString(record, flatKeys);
  if (flat) return flat;

  for (const key of nestedKeys) {
    const nested = record[key];
    if (!isRecord(nested)) continue;
    const nestedTitle = readOptionalString(nested, [
      'title',
      'module_title',
      'proposed_title',
      'name',
    ]);
    if (nestedTitle) return nestedTitle;
  }
  return null;
}

export interface MergeDecisionNodeContext {
  matched_module_id: string | null;
  proposed_module_id: string | null;
  proposed_title: string | null;
  module_title: string | null;
}

export function mergeDecisionKey(
  decision: Pick<AdminV3IngestMergeDecision, 'run_id' | 'candidate_id'>,
): string {
  return `${decision.run_id}::${decision.candidate_id}`;
}

export function hasPendingMergeDecisions(
  mergeDecisions: readonly unknown[] | null | undefined,
): boolean {
  return Array.isArray(mergeDecisions) && mergeDecisions.length > 0;
}

export function normalizeIngestMergeDecision(
  value: unknown,
): AdminV3IngestMergeDecision | null {
  if (!isRecord(value)) return null;

  const runId = readOptionalString(value, ['run_id']);
  const candidateId = readOptionalString(value, ['candidate_id']);
  if (!runId || !candidateId) return null;

  const decisionRaw = readOptionalString(value, ['decision']);
  const decision: IngestMergeDecisionChoice | string | null =
    decisionRaw === 'accept_merge' || decisionRaw === 'force_create'
      ? decisionRaw
      : decisionRaw;

  const proposedModuleId = readOptionalString(value, ['proposed_module_id']);
  const matchedModuleId = readModuleId(
    value,
    [
      'matched_module_id',
      'published_module_id',
      'existing_module_id',
      'target_module_id',
      'module_id',
    ],
    [
      'matched_module',
      'published_module',
      'existing_module',
      'target_module',
      'module',
    ],
  );

  const moduleTitle = readModuleTitle(
    value,
    ['module_title', 'proposed_title', 'matched_module_title', 'title'],
    [
      'matched_module',
      'published_module',
      'existing_module',
      'target_module',
      'module',
    ],
  );

  return {
    decision_url: readOptionalString(value, ['decision_url']) ?? '',
    run_id: runId,
    candidate_id: candidateId,
    decision,
    module_title: moduleTitle,
    proposed_title: readOptionalString(value, ['proposed_title']),
    matched_module_title: readOptionalString(value, ['matched_module_title']),
    title: readOptionalString(value, ['title']),
    proposed_module_id: proposedModuleId,
    matched_module_id: matchedModuleId,
    published_module_id: readOptionalString(value, ['published_module_id']),
    existing_module_id: readOptionalString(value, ['existing_module_id']),
    module_id: readOptionalString(value, ['module_id']),
  };
}

export function normalizeIngestMergeDecisions(
  value: unknown,
): AdminV3IngestMergeDecision[] {
  if (!Array.isArray(value)) return [];
  const rows: AdminV3IngestMergeDecision[] = [];
  for (const item of value) {
    const normalized = normalizeIngestMergeDecision(item);
    if (normalized) rows.push(normalized);
  }
  return rows;
}

function readCandidateIdFromNode(
  node: AdminV3IngestBatchNode,
  parentCandidateId: string | null,
): string | null {
  if (typeof node.candidate_id === 'string' && node.candidate_id.trim()) {
    return node.candidate_id.trim();
  }
  const inputSummary = node.input_summary;
  if (isRecord(inputSummary)) {
    const fromInput = readOptionalString(inputSummary, ['candidate_id']);
    if (fromInput) return fromInput;
  }
  const outputSummary = node.output_summary;
  if (isRecord(outputSummary)) {
    const fromOutput = readOptionalString(outputSummary, ['candidate_id']);
    if (fromOutput) return fromOutput;
  }
  return parentCandidateId;
}

function readMergeContextFromNode(
  node: AdminV3IngestBatchNode,
): MergeDecisionNodeContext | null {
  const outputSummary = node.output_summary;
  if (!isRecord(outputSummary)) return null;

  const matchedModuleId = readOptionalString(outputSummary, [
    'matched_module_id',
  ]);
  if (!matchedModuleId) return null;

  const publishedMerge = isRecord(node.published_module_merge)
    ? node.published_module_merge
    : null;

  const proposedTitle =
    readOptionalString(outputSummary, ['proposed_title']) ??
    (typeof node.proposed_title === 'string'
      ? node.proposed_title.trim()
      : null) ??
    readOptionalString(publishedMerge ?? {}, ['proposed_title']);

  return {
    matched_module_id: matchedModuleId,
    proposed_module_id:
      readOptionalString(publishedMerge ?? {}, ['proposed_module_id']) ??
      readOptionalString(outputSummary, ['proposed_module_id']),
    proposed_title: proposedTitle,
    module_title: proposedTitle,
  };
}

function walkBatchNodesForMergeContext(
  nodes: AdminV3IngestBatchNode[],
  runId: string,
  parentCandidateId: string | null,
  contextByKey: Map<string, MergeDecisionNodeContext>,
): void {
  for (const node of nodes) {
    const candidateId = readCandidateIdFromNode(node, parentCandidateId);
    const nodeContext = readMergeContextFromNode(node);

    if (nodeContext && candidateId) {
      const key = mergeDecisionKey({
        run_id: runId,
        candidate_id: candidateId,
      });
      contextByKey.set(key, nodeContext);
    }

    if (node.children?.length) {
      walkBatchNodesForMergeContext(
        node.children,
        runId,
        candidateId,
        contextByKey,
      );
    }
  }
}

/** Build lookup of merge metadata from card_draft `output_summary.matched_module_id`. */
export function buildMergeDecisionContextFromBatchSources(
  sources: readonly AdminV3IngestBatchSourceStatus[] | null | undefined,
): Map<string, MergeDecisionNodeContext> {
  const contextByKey = new Map<string, MergeDecisionNodeContext>();
  if (!sources?.length) return contextByKey;

  for (const source of sources) {
    walkBatchNodesForMergeContext(
      source.nodes ?? [],
      source.run_id,
      null,
      contextByKey,
    );
  }

  return contextByKey;
}

function mergeDecisionWithContext(
  decision: AdminV3IngestMergeDecision,
  context: MergeDecisionNodeContext | undefined,
): AdminV3IngestMergeDecision {
  if (!context) return decision;

  return {
    ...decision,
    matched_module_id:
      context.matched_module_id ?? decision.matched_module_id ?? null,
    proposed_module_id:
      context.proposed_module_id ?? decision.proposed_module_id ?? null,
    proposed_title: context.proposed_title ?? decision.proposed_title ?? null,
    module_title:
      context.module_title ??
      decision.module_title ??
      context.proposed_title ??
      decision.proposed_title ??
      null,
  };
}

/** Dedupe API rows and enrich with node `output_summary` for view-module metadata. */
export function enrichMergeDecisionsFromBatch(
  mergeDecisions: unknown[] | null | undefined,
  sources: readonly AdminV3IngestBatchSourceStatus[] | null | undefined,
): AdminV3IngestMergeDecision[] {
  const contextByKey = buildMergeDecisionContextFromBatchSources(sources);
  const deduped = new Map<string, AdminV3IngestMergeDecision>();

  for (const decision of normalizeIngestMergeDecisions(mergeDecisions)) {
    const key = mergeDecisionKey(decision);
    if (!deduped.has(key)) {
      deduped.set(
        key,
        mergeDecisionWithContext(decision, contextByKey.get(key)),
      );
    }
  }

  return [...deduped.values()];
}

export function resolveMergeDecisionTitle(
  decision: AdminV3IngestMergeDecision,
): string {
  return (
    decision.module_title?.trim() ||
    decision.proposed_title?.trim() ||
    decision.matched_module_title?.trim() ||
    decision.title?.trim() ||
    decision.candidate_id
  );
}

/** Existing published module to preview via GET /admin/modules/{id}. */
export function resolveMatchedModuleId(
  decision: AdminV3IngestMergeDecision,
): string | null {
  return decision.matched_module_id?.trim() || null;
}

export function isIngestMergeDecisionChoice(
  value: unknown,
): value is IngestMergeDecisionChoice {
  return value === 'accept_merge' || value === 'force_create';
}

export function getRtkErrorStatus(error: unknown): number | null {
  if (!isRecord(error)) return null;
  const status = error.status;
  return typeof status === 'number' ? status : null;
}

export function getRtkErrorCode(error: unknown): string | null {
  if (!isRecord(error)) return null;
  const data = error.data;
  if (!isRecord(data)) return null;
  if (typeof data.code === 'string' && data.code.trim()) return data.code;
  const detail = data.detail;
  if (
    isRecord(detail) &&
    typeof detail.code === 'string' &&
    detail.code.trim()
  ) {
    return detail.code;
  }
  return null;
}
