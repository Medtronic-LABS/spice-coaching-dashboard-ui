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

  it('merges batch status sources onto previous selection by id', () => {
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

  it('matches catalog filenames with underscores to batch document labels', () => {
    expect(
      selectedDocumentsFromIngestSourceIds({
        previous: [
          {
            id: 'catalog-pptx',
            title: 'UHIS RMNCH Training Module Clinical EN',
            originalFilename:
              'UHIS_RMNCH_Training_Module_Clinical_EN_18_Apr (1) (1).pptx',
            sourceType: 'pptx',
            status: 'ingested',
          },
        ],
        acceptedSources: [
          {
            source_document_id: 'batch-pptx',
            run_id: 'run-1',
            title: 'UHIS RMNCH Training Module Clinical EN 18 Apr (1) (1)',
            source_type: 'pptx',
            stored_path: '/docs/training.pptx',
          },
        ],
        statusSources: [
          {
            source_document_id: 'batch-pptx',
            run_id: 'run-1',
            document_label:
              'UHIS_RMNCH_Training_Module_Clinical_EN_18_Apr (1) (1).pptx',
            status: 'running',
            started_at: null,
            completed_at: null,
            error: null,
            nodes: [],
          },
        ],
      }).map((doc) => doc.id),
    ).toEqual(['batch-pptx']);
  });

  it('does not duplicate a re-ingested catalog row when the batch uses another source id', () => {
    expect(
      selectedDocumentsFromIngestSourceIds({
        previous: [
          {
            id: 'catalog-pptx',
            title: 'UHIS RMNCH Training Module Clinical EN',
            originalFilename: 'UHIS_RMNCH_Training_Module_Clinical_EN.pptx',
            sourceType: 'pptx',
            status: 'ingested',
            uploadedAt: '2026-08-17T09:36:26.000Z',
          },
          {
            id: 'doc-hep',
            title: 'Hepatitis CHW Guide',
            originalFilename: 'Hepatitis_CHW_Guide.docx',
            sourceType: 'docx',
            status: 'ingested',
            uploadedAt: '2026-08-17T09:33:19.000Z',
          },
        ],
        keptExistingSources: [
          {
            source_document_id: 'doc-hep',
            title: 'Hepatitis CHW Guide',
            filename: 'Hepatitis_CHW_Guide.docx',
          },
        ],
        acceptedSources: [
          {
            source_document_id: 'batch-pptx',
            run_id: 'run-1',
            title: 'UHIS RMNCH Training Module Clinical EN',
            source_type: 'pptx',
            stored_path: '/docs/training.pptx',
          },
        ],
        statusSources: [
          {
            source_document_id: 'batch-pptx',
            run_id: 'run-1',
            document_label: 'UHIS RMNCH Training Module Clinical EN',
            status: 'running',
            started_at: null,
            completed_at: null,
            error: null,
            nodes: [],
          },
        ],
      }),
    ).toEqual([
      {
        id: 'doc-hep',
        title: 'Hepatitis CHW Guide',
        originalFilename: 'Hepatitis_CHW_Guide.docx',
        sourceType: 'pdf',
        status: 'ingested',
        uploadedAt: '2026-08-17T09:33:19.000Z',
      },
      {
        id: 'batch-pptx',
        title: 'UHIS RMNCH Training Module Clinical EN',
        originalFilename: 'UHIS RMNCH Training Module Clinical EN',
        sourceType: 'pptx',
        status: 'running',
      },
    ]);
  });
});
