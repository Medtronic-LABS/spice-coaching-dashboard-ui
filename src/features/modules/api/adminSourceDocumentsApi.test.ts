import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { baseApi } from '@/store/apis/base';
import { testSourceDocuments } from '@/test-utils/fixtures/moduleFixtures';
import {
  installModuleLibraryFetchMock,
  resetModuleLibraryFixtures,
} from '@/test-utils/installModuleLibraryFetchMock';
import { adminSourceDocumentsApi } from './adminSourceDocumentsApi';

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
}

describe('adminSourceDocumentsApi', () => {
  beforeEach(() => {
    resetModuleLibraryFixtures();
    installModuleLibraryFetchMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

    expect(result.source_documents).toHaveLength(testSourceDocuments.length);
    expect(result.total_source_documents).toBe(testSourceDocuments.length);
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
      original_filename: 'htn_referral_protocol.pdf',
      ingested_at: '2026-04-08T09:00:00Z',
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
      testSourceDocuments.filter((doc) => doc.source_type === 'video').length,
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
});
