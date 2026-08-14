import { describe, expect, it } from 'vitest';
import {
  extractFirstIngestFailureTooltipMessage,
  extractIngestBatchFailureTooltipMessage,
  extractIngestFailureTooltipMessage,
} from './extractIngestErrorMessage';

const sourceFailure = {
  source_document_id: 'e170a4fd-ce46-4930-8347-ee3ebfc6ddb2',
  document_label: 'Recording 2026-08-11 162615.pdf',
  status: 'failed',
  error: {
    code: 'extract_failed',
    detail:
      "Stage A: cannot count pages: Failed to open file '/tmp/microcoaching/uploads/ingest_work/.pipeline-7c30c6b5-95ec-4292-835f-d6a9808f4e52.pdf'.",
    message:
      "We couldn't extract content from this file. Try re-exporting it from the original source.",
    failed_stage: 'extract',
  },
  nodes: [
    {
      key: 'thumbnail',
      status: 'failed',
      error: {
        type: 'ThumbnailJobCrashed',
        detail: 'thumbnail worker crashed',
      },
      error_message: "We couldn't generate a preview image for this file.",
    },
    {
      key: 'extract',
      status: 'failed',
      error: {
        type: 'TextExtractionError',
        detail:
          "Stage A: cannot count pages: Failed to open file '/tmp/microcoaching/uploads/ingest_work/.pipeline-7c30c6b5-95ec-4292-835f-d6a9808f4e52.pdf'.",
      },
      error_message:
        "We couldn't extract content from this file. Try re-exporting it from the original source.",
    },
  ],
};

const batchFailure = {
  batch_id: 'eae43326-380a-46db-95dc-eb85419e342c',
  status: 'failed',
  error: null,
  sources: [sourceFailure],
};

describe('extractIngestFailureTooltipMessage', () => {
  it('uses top-level error_message on pipeline nodes', () => {
    expect(extractIngestFailureTooltipMessage(sourceFailure.nodes[0])).toBe(
      "We couldn't generate a preview image for this file.",
    );
  });

  it('uses nested error.message on source rows', () => {
    expect(extractIngestFailureTooltipMessage(sourceFailure)).toBe(
      "We couldn't extract content from this file. Try re-exporting it from the original source.",
    );
  });

  it('does not prefer nested error.detail over error.message on sources', () => {
    expect(extractIngestFailureTooltipMessage(sourceFailure)).not.toContain(
      'Stage A: cannot count pages',
    );
  });

  it('falls back to nested error.detail when message and error_message are absent', () => {
    expect(
      extractIngestFailureTooltipMessage({
        status: 'failed',
        error: {
          detail: 'Stage A: cannot count pages',
        },
      }),
    ).toBe('Stage A: cannot count pages');
  });

  it('falls back to nested error.detail on nodes without error_message', () => {
    expect(
      extractIngestFailureTooltipMessage({
        status: 'failed',
        error: { detail: 'thumbnail worker crashed' },
      }),
    ).toBe('thumbnail worker crashed');
  });
});

describe('extractFirstIngestFailureTooltipMessage', () => {
  it('prefers the source-level message before node messages', () => {
    expect(
      extractFirstIngestFailureTooltipMessage([
        sourceFailure,
        ...(sourceFailure.nodes ?? []),
      ]),
    ).toBe(
      "We couldn't extract content from this file. Try re-exporting it from the original source.",
    );
  });
});

describe('extractIngestBatchFailureTooltipMessage', () => {
  it('reads failed source messages when batch.error is null', () => {
    expect(extractIngestBatchFailureTooltipMessage(batchFailure)).toBe(
      "We couldn't extract content from this file. Try re-exporting it from the original source.",
    );
  });
});
