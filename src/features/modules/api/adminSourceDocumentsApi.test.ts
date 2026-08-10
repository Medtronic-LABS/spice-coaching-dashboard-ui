import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { baseApi } from '@/store/apis/base';
import { mockSourceDocuments } from '@/store/apis/mockData';
import {
  adminSourceDocumentsApi,
  mapSourceDocumentToKnowledgeItem,
  normalizeSourceDocumentActorRef,
} from './adminSourceDocumentsApi';

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
}

describe('adminSourceDocumentsApi', () => {
  it('normalizes the paginated envelope from the catalog endpoint', async () => {
    const store = makeStore();

    const result = await store
      .dispatch(
        adminSourceDocumentsApi.endpoints.fetchSourceDocuments.initiate({
          status: 'ingested',
          limit: 200,
        }),
      )
      .unwrap();

    const ingestedDocs = mockSourceDocuments.filter(
      (doc) => doc.status === 'ingested',
    );
    expect(result.source_documents).toHaveLength(ingestedDocs.length);
    expect(result.total_source_documents).toBe(ingestedDocs.length);
    expect(result.total_pages).toBe(1);
    expect(result.limit).toBe(200);
    expect(result.offset).toBe(0);
    expect(result.source_documents[0]).toEqual({
      id: 'doc-htn-protocol',
      title: 'Hypertension Referral Protocol',
      source_type: 'pdf',
      status: 'ingested',
      content_domain: 'Hypertension',
      authority_label: 'MoH Bangladesh',
      stored_path: 'medtronics-storage/source-documents/doc-htn-protocol.pdf',
      original_filename: 'htn_referral_protocol.pdf',
      description: null,
      thumbnail_storage_path: null,
      thumbnail_presigned_url: null,
      uploaded_date: '2026-04-08T09:00:00Z',
      ingested_at: '2026-04-08T09:00:00Z',
      updated_at: '2026-04-08T09:00:00Z',
      uploaded_by: { id: 1, name: 'ingest-bot' },
      updated_by: null,
      assigned: false,
      sync_published_visible: false,
    });
  });

  it('filters by source_type and reports the filtered totals', async () => {
    const store = makeStore();

    const result = await store
      .dispatch(
        adminSourceDocumentsApi.endpoints.fetchSourceDocuments.initiate({
          source_type: 'video',
          limit: 10,
          offset: 0,
        }),
      )
      .unwrap();

    expect(
      result.source_documents.every((doc) => doc.source_type === 'video'),
    ).toBe(true);
    expect(result.total_source_documents).toBe(
      mockSourceDocuments.filter((doc) => doc.source_type === 'video').length,
    );
  });

  it('matches the q filter against filename or title', async () => {
    const store = makeStore();

    const result = await store
      .dispatch(
        adminSourceDocumentsApi.endpoints.fetchSourceDocuments.initiate({
          q: 'counselling',
        }),
      )
      .unwrap();

    expect(result.source_documents).toHaveLength(1);
    expect(result.source_documents[0].id).toBe('doc-htn-counselling-video');
  });

  it('returns an empty envelope when the catalog filters out every status', async () => {
    const store = makeStore();

    const result = await store
      .dispatch(
        adminSourceDocumentsApi.endpoints.fetchSourceDocuments.initiate({
          status: 'failed',
        }),
      )
      .unwrap();

    expect(result.source_documents).toEqual([]);
    expect(result.total_source_documents).toBe(0);
    expect(result.total_pages).toBe(0);
  });

  it('accepts multiple status values in the request params', async () => {
    const store = makeStore();

    const result = await store
      .dispatch(
        adminSourceDocumentsApi.endpoints.fetchSourceDocuments.initiate({
          status: ['ingested', 'uploaded'],
          source_type: 'video',
        }),
      )
      .unwrap();

    expect(
      result.source_documents.every((doc) =>
        ['ingested', 'uploaded'].includes(doc.status),
      ),
    ).toBe(true);
  });

  it('filters knowledge catalog rows by assigned and uploaded_by', async () => {
    const store = makeStore();

    const assigned = await store
      .dispatch(
        adminSourceDocumentsApi.endpoints.fetchSourceDocuments.initiate({
          sync_published_visible: true,
          assigned: true,
        }),
      )
      .unwrap();

    expect(assigned.source_documents.map((doc) => doc.id)).toEqual([
      'knowledge-asset-1',
    ]);
    expect(assigned.source_documents[0]?.assigned).toBe(true);

    const byUploader = await store
      .dispatch(
        adminSourceDocumentsApi.endpoints.fetchSourceDocuments.initiate({
          sync_published_visible: true,
          uploaded_by: '101',
        }),
      )
      .unwrap();

    expect(byUploader.source_documents.map((doc) => doc.id)).toEqual([
      'knowledge-asset-1',
    ]);
    expect(byUploader.source_documents[0]?.uploaded_by).toEqual({
      id: 101,
      name: 'alice',
    });
  });
});

describe('normalizeSourceDocumentActorRef', () => {
  it('accepts actor objects and rejects invalid values', () => {
    expect(normalizeSourceDocumentActorRef({ id: 1, name: ' alice ' })).toEqual(
      { id: 1, name: 'alice' },
    );
    expect(normalizeSourceDocumentActorRef('alice')).toBeNull();
    expect(normalizeSourceDocumentActorRef({ id: 1, name: '' })).toBeNull();
    expect(normalizeSourceDocumentActorRef(null)).toBeNull();
  });
});

describe('mapSourceDocumentToKnowledgeItem', () => {
  it('exposes uploaded_by.name as the display uploadedBy field', () => {
    const item = mapSourceDocumentToKnowledgeItem({
      id: 'knowledge-asset-1',
      title: 'HTN Referral Guidelines',
      source_type: 'pdf',
      status: 'uploaded',
      content_domain: 'clinical',
      authority_label: '',
      stored_path: 'path.pdf',
      original_filename: 'htn.pdf',
      description: null,
      thumbnail_storage_path: null,
      uploaded_date: '2026-07-10T09:00:00Z',
      ingested_at: '2026-07-10T09:00:00Z',
      updated_at: '2026-07-11T08:15:00Z',
      uploaded_by: { id: 101, name: 'alice' },
      updated_by: { id: 101, name: 'alice' },
      assigned: true,
      sync_published_visible: true,
    });
    expect(item.uploadedBy).toBe('alice');
    expect(item.assigned).toBe(true);
    expect(item.ingested).toBe(false);
  });
});
