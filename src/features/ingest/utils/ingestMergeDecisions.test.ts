import { describe, expect, it } from 'vitest';
import type { AdminV3IngestBatchSourceStatus } from '@/features/ingest/api/adminIngestApi';
import {
  buildMergeDecisionContextFromBatchSources,
  enrichMergeDecisionsFromBatch,
  getRtkErrorCode,
  getRtkErrorStatus,
  hasPendingMergeDecisions,
  mergeDecisionKey,
  normalizeIngestMergeDecision,
  normalizeIngestMergeDecisions,
  resolveMatchedModuleId,
  resolveMergeDecisionTitle,
} from './ingestMergeDecisions';

const sampleSources: AdminV3IngestBatchSourceStatus[] = [
  {
    source_document_id: 'doc-1',
    run_id: 'run-1',
    document_label: 'video.mp4',
    status: 'running',
    started_at: null,
    completed_at: null,
    error: null,
    nodes: [
      {
        key: 'module_identify',
        title: 'Identifying modules',
        description: '',
        status: 'awaiting_input',
        started_at: null,
        completed_at: null,
        error: null,
        children: [
          {
            key: 'chunk',
            title: 'chunk',
            description: '',
            status: 'awaiting_input',
            started_at: null,
            completed_at: null,
            error: null,
            children: [
              {
                key: 'candidate',
                title: 'candidate',
                description: '',
                status: 'awaiting_input',
                candidate_id: 'cand-1',
                proposed_title: 'Candidate title',
                started_at: null,
                completed_at: null,
                error: null,
                children: [
                  {
                    key: 'card_draft',
                    title: 'Waiting for merge decision',
                    description: '',
                    status: 'awaiting_input',
                    activity: 'published_module_merge',
                    started_at: null,
                    completed_at: null,
                    error: null,
                    published_module_merge: {
                      proposed_module_id: 'proposed-mod',
                      proposed_title: 'Existing module title',
                    },
                    output_summary: {
                      candidate_id: 'cand-1',
                      matched_module_id: 'matched-mod',
                      proposed_title: 'Existing module title',
                      awaiting_merge_decision: true,
                    },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

describe('ingestMergeDecisions', () => {
  it('detects pending merge decisions', () => {
    expect(hasPendingMergeDecisions(undefined)).toBe(false);
    expect(hasPendingMergeDecisions([])).toBe(false);
    expect(
      hasPendingMergeDecisions([
        {
          run_id: 'run-1',
          candidate_id: 'cand-1',
          decision_url: '/decision',
        },
      ]),
    ).toBe(true);
  });

  it('normalizes merge decision rows from flexible field names', () => {
    const normalized = normalizeIngestMergeDecision({
      decision_url: '/admin/ingest/batches/b1/merge-decision',
      run_id: 'run-1',
      candidate_id: 'cand-1',
      decision: 'accept_merge',
      proposed_title: 'Hypertension counselling',
      matched_module_id: 'mod-9',
    });

    expect(normalized).toEqual(
      expect.objectContaining({
        run_id: 'run-1',
        candidate_id: 'cand-1',
        decision: 'accept_merge',
        module_title: 'Hypertension counselling',
        matched_module_id: 'mod-9',
      }),
    );
    expect(resolveMergeDecisionTitle(normalized!)).toBe(
      'Hypertension counselling',
    );
    expect(resolveMatchedModuleId(normalized!)).toBe('mod-9');
    expect(mergeDecisionKey(normalized!)).toBe('run-1::cand-1');
  });

  it('uses matched_module_id from output_summary for view module', () => {
    const context = buildMergeDecisionContextFromBatchSources(sampleSources);
    const enriched = enrichMergeDecisionsFromBatch(
      [
        {
          decision_url: '/decision',
          run_id: 'run-1',
          candidate_id: 'cand-1',
          decision: 'accept_merge',
        },
        {
          decision_url: '/decision',
          run_id: 'run-1',
          candidate_id: 'cand-1',
          decision: 'force_create',
        },
      ],
      sampleSources,
    );

    expect(context.get('run-1::cand-1')).toEqual(
      expect.objectContaining({
        matched_module_id: 'matched-mod',
        proposed_module_id: 'proposed-mod',
        proposed_title: 'Existing module title',
      }),
    );
    expect(enriched).toHaveLength(1);
    expect(resolveMatchedModuleId(enriched[0]!)).toBe('matched-mod');
    expect(resolveMergeDecisionTitle(enriched[0]!)).toBe(
      'Existing module title',
    );
  });

  it('returns null for view module when matched_module_id is missing', () => {
    const normalized = normalizeIngestMergeDecision({
      decision_url: '/decision',
      run_id: 'run-2b',
      candidate_id: 'cand-2b',
      proposed_module_id: 'proposed-mod',
    });

    expect(resolveMatchedModuleId(normalized!)).toBeNull();
  });

  it('reads nested matched module objects', () => {
    const normalized = normalizeIngestMergeDecision({
      decision_url: '/decision',
      run_id: 'run-3',
      candidate_id: 'cand-3',
      matched_module: {
        id: 'mod-nested',
        title: 'Nested module title',
      },
    });

    expect(normalized?.matched_module_id).toBe('mod-nested');
    expect(normalized?.module_title).toBe('Nested module title');
  });

  it('drops incomplete merge decision rows', () => {
    expect(
      normalizeIngestMergeDecisions([
        { run_id: 'run-1' },
        { candidate_id: 'cand-1' },
        {
          run_id: 'run-2',
          candidate_id: 'cand-2',
          decision_url: '/x',
          module_title: 'OK',
        },
      ]),
    ).toHaveLength(1);
  });

  it('reads RTK error status and codes', () => {
    expect(
      getRtkErrorStatus({
        status: 409,
        data: { code: 'matched_module_unavailable' },
      }),
    ).toBe(409);
    expect(
      getRtkErrorCode({
        status: 409,
        data: { code: 'matched_module_unavailable' },
      }),
    ).toBe('matched_module_unavailable');
    expect(
      getRtkErrorCode({
        status: 409,
        data: { detail: { code: 'matched_module_unavailable' } },
      }),
    ).toBe('matched_module_unavailable');
  });
});
