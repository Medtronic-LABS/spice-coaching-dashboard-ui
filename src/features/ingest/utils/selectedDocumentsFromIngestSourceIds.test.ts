import { describe, expect, it } from 'vitest';
import { selectedDocumentsFromIngestSourceIds } from './selectedDocumentsFromIngestSourceIds';

describe('selectedDocumentsFromIngestSourceIds', () => {
  it('uses session source_document_id and kept existing sources', () => {
    expect(
      selectedDocumentsFromIngestSourceIds({
        session: {
          batch_id: 'batch-1',
          source_document_id: 'doc-1',
          title: 'Hypertension Guide',
          kept_existing_sources: [
            {
              source_document_id: 'doc-existing',
              title: 'Existing Guide',
              filename: 'existing.pdf',
            },
          ],
        },
      }),
    ).toEqual([
      {
        id: 'doc-1',
        title: 'Hypertension Guide',
        originalFilename: null,
        sourceType: 'pdf',
        status: 'ingesting',
      },
      {
        id: 'doc-existing',
        title: 'Existing Guide',
        originalFilename: 'existing.pdf',
        sourceType: 'pdf',
        status: 'ingested',
      },
    ]);
  });

  it('merges batch status sources onto previous selection', () => {
    expect(
      selectedDocumentsFromIngestSourceIds({
        previous: [
          {
            id: 'doc-1',
            title: 'Hypertension Guide',
            originalFilename: 'hypertension.pdf',
            sourceType: 'pdf',
            status: 'uploaded',
          },
        ],
        statusSources: [
          {
            source_document_id: 'doc-1',
            run_id: 'run-1',
            document_label: 'Hypertension Guide',
            status: 'running',
            started_at: null,
            completed_at: null,
            error: null,
            nodes: [],
          },
          {
            source_document_id: 'doc-2',
            run_id: 'run-2',
            document_label: 'Diabetes Guide',
            status: 'running',
            started_at: null,
            completed_at: null,
            error: null,
            nodes: [],
          },
        ],
      }).map((doc) => doc.id),
    ).toEqual(['doc-1', 'doc-2']);
  });
});
