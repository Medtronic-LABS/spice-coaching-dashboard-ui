import { describe, expect, it } from 'vitest';
import type {
  AdminV3IngestBatchNode,
  AdminV3IngestBatchSourceStatus,
} from '@/features/ingest/api/adminIngestApi';
import {
  computeIngestSourceProgressPercent,
  countGeneratedModulesFromSource,
  countReviewPendingModulesFromSource,
  flattenIngestBatchNodes,
  getVisibleIngestBatchNodes,
  shouldHideIngestBatchNodeFromStatus,
  formatIngestDocumentProgressStatus,
  getIngestSourceStepLabel,
  getLatestIngestSourceStep,
} from '@/features/ingest/utils/ingestSourceProgress';

function makeSource(
  overrides: Partial<AdminV3IngestBatchSourceStatus> = {},
): AdminV3IngestBatchSourceStatus {
  return {
    source_document_id: 'doc-1',
    run_id: 'run-1',
    document_label: 'HTN',
    status: 'running',
    started_at: '2026-07-15T08:00:00Z',
    completed_at: null,
    error: null,
    nodes: [],
    ...overrides,
  };
}

describe('ingestSourceProgress', () => {
  it('flattens nested pipeline nodes with path keys', () => {
    const nodes: AdminV3IngestBatchNode[] = [
      {
        key: 'parent',
        title: 'Parent',
        status: 'running',
        children: [
          {
            key: 'child',
            title: 'Child',
            status: 'pending',
            children: [],
          },
        ],
      },
    ];

    expect(flattenIngestBatchNodes(nodes).map((node) => node.path)).toEqual([
      'parent',
      'parent/child',
    ]);
  });

  it('maps source statuses to compact progress labels', () => {
    expect(formatIngestDocumentProgressStatus('pipeline_queued')).toBe(
      'Queued',
    );
    expect(formatIngestDocumentProgressStatus('running')).toBe('Running');
    expect(formatIngestDocumentProgressStatus('succeeded')).toBe('Completed');
    expect(formatIngestDocumentProgressStatus('pipeline_failed')).toBe(
      'Failed',
    );
    expect(formatIngestDocumentProgressStatus('skipped')).toBe('Skipped');
  });

  it('returns null progress when nodes are not available yet', () => {
    expect(computeIngestSourceProgressPercent(makeSource())).toBeNull();
  });

  it('computes progress from finished nodes and forces 100% on success', () => {
    const nodes: AdminV3IngestBatchNode[] = [
      {
        key: 'extract',
        title: 'Extract',
        status: 'succeeded',
        children: [],
      },
      {
        key: 'transcribe',
        title: 'Transcribe',
        status: 'running',
        children: [],
      },
      {
        key: 'generate',
        title: 'Generate',
        status: 'pending',
        children: [],
      },
    ];

    expect(computeIngestSourceProgressPercent(makeSource({ nodes }))).toBe(33);

    expect(
      computeIngestSourceProgressPercent(
        makeSource({ status: 'succeeded', nodes }),
      ),
    ).toBe(100);
  });

  it('hides skipped thumbnail nodes from visible pipeline steps', () => {
    const nodes: AdminV3IngestBatchNode[] = [
      {
        key: 'extract',
        title: 'Extract content',
        status: 'succeeded',
        children: [],
      },
      {
        key: 'thumbnail',
        title: 'Generating thumbnail',
        status: 'skipped',
        children: [],
      },
      {
        key: 'transcribe',
        title: 'Transcribe',
        status: 'running',
        children: [],
      },
    ];

    expect(getVisibleIngestBatchNodes(nodes).map((node) => node.key)).toEqual([
      'extract',
      'transcribe',
    ]);
    expect(shouldHideIngestBatchNodeFromStatus(nodes[1])).toBe(true);
    expect(shouldHideIngestBatchNodeFromStatus(nodes[0])).toBe(false);
    expect(computeIngestSourceProgressPercent(makeSource({ nodes }))).toBe(50);
  });

  it('prefers the running step as the latest step', () => {
    const nodes = flattenIngestBatchNodes([
      {
        key: 'extract',
        title: 'Extract',
        status: 'succeeded',
        completed_at: '2026-07-15T08:01:00Z',
        children: [],
      },
      {
        key: 'transcribe',
        title: 'Transcribe',
        status: 'running',
        started_at: '2026-07-15T08:02:00Z',
        children: [],
      },
    ]);

    const latest = getLatestIngestSourceStep(nodes);
    expect(getIngestSourceStepLabel(latest)).toBe('Transcribe');
  });

  it('falls back to the most recently updated finished step', () => {
    const nodes = flattenIngestBatchNodes([
      {
        key: 'extract',
        title: 'Extract',
        status: 'succeeded',
        completed_at: '2026-07-15T08:01:00Z',
        children: [],
      },
      {
        key: 'transcribe',
        title: 'Transcribe',
        status: 'succeeded',
        completed_at: '2026-07-15T08:03:00Z',
        children: [],
      },
    ]);

    const latest = getLatestIngestSourceStep(nodes);
    expect(getIngestSourceStepLabel(latest)).toBe('Transcribe');
  });

  it('counts only card_draft module ids for generated modules', () => {
    const source = makeSource({
      nodes: [
        {
          key: 'transcribe',
          title: 'Transcribe',
          status: 'succeeded',
          output_summary: { module_id: 'mod-noise' },
          children: [],
        },
        {
          key: 'card_draft',
          title: 'Draft A',
          status: 'succeeded',
          output_summary: { module_id: 'mod-a' },
          children: [],
        },
        {
          key: 'card_draft',
          title: 'Draft B',
          status: 'succeeded',
          output_summary: { module_id: 'mod-b' },
          children: [],
        },
      ],
    });

    expect(countGeneratedModulesFromSource(source)).toBe(2);
  });

  it('counts only review-pending card_draft modules', () => {
    const source = makeSource({
      nodes: [
        {
          key: 'card_draft',
          title: 'Draft A',
          status: 'succeeded',
          output_summary: { module_id: 'mod-a' },
          children: [],
        },
        {
          key: 'card_draft',
          title: 'Draft B',
          status: 'succeeded',
          output_summary: {
            module_id: 'mod-b',
            has_similarity: true,
          },
          children: [],
        },
        {
          key: 'card_draft',
          title: 'Draft C',
          status: 'succeeded',
          output_summary: {
            module_id: 'mod-c',
            matched_module_id: 'existing-1',
          },
          children: [],
        },
      ],
    });

    expect(countReviewPendingModulesFromSource(source)).toBe(2);
  });
});
