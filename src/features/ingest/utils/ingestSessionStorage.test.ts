import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearActiveIngestSession,
  mergeKeptExistingIngestSources,
  readActiveIngestSession,
  readKeptExistingIngestSourceIds,
  writeActiveIngestSession,
} from './ingestSessionStorage';

describe('ingestSessionStorage kept existing sources', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('persists kept existing sources with the active ingest session', () => {
    writeActiveIngestSession({
      batch_id: 'batch-1',
      kept_existing_sources: [
        {
          source_document_id: 'doc-existing',
          title: 'Existing Guide',
          filename: 'existing.pdf',
        },
      ],
    });

    expect(readActiveIngestSession()).toEqual({
      batch_id: 'batch-1',
      kept_existing_sources: [
        {
          source_document_id: 'doc-existing',
          title: 'Existing Guide',
          filename: 'existing.pdf',
        },
      ],
    });
    expect(readKeptExistingIngestSourceIds()).toEqual(
      new Set(['doc-existing']),
    );
  });

  it('merges kept existing sources by source document id', () => {
    expect(
      mergeKeptExistingIngestSources(
        [
          {
            source_document_id: 'doc-a',
            title: 'A',
            filename: 'a.pdf',
          },
        ],
        [
          {
            source_document_id: 'doc-a',
            filename: 'a-renamed.pdf',
          },
          {
            source_document_id: 'doc-b',
            title: 'B',
          },
        ],
      ),
    ).toEqual([
      {
        source_document_id: 'doc-a',
        title: 'A',
        filename: 'a-renamed.pdf',
      },
      {
        source_document_id: 'doc-b',
        title: 'B',
        filename: undefined,
      },
    ]);
  });

  it('clears kept existing sources with the active ingest session', () => {
    writeActiveIngestSession({
      batch_id: 'batch-1',
      kept_existing_sources: [
        { source_document_id: 'doc-existing', title: 'Existing Guide' },
      ],
    });

    clearActiveIngestSession();

    expect(readActiveIngestSession()).toBeNull();
    expect(readKeptExistingIngestSourceIds()).toEqual(new Set());
  });
});
