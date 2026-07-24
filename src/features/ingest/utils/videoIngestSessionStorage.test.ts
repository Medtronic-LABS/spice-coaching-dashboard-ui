import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearActiveVideoIngestSessions,
  mergeActiveVideoIngestSessions,
  pruneActiveVideoIngestSession,
  readActiveVideoIngestSessions,
  writeActiveVideoIngestSessions,
} from './videoIngestSessionStorage';

const STORAGE_KEY = 'adminV3ActiveVideoIngests';

describe('videoIngestSessionStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('returns an empty list when nothing is stored', () => {
    expect(readActiveVideoIngestSessions()).toEqual([]);
  });

  it('writes and reads sessions', () => {
    writeActiveVideoIngestSessions([
      { source_document_id: 'doc-1', title: 'a.mp4' },
      { source_document_id: 'doc-2' },
    ]);

    expect(readActiveVideoIngestSessions()).toEqual([
      { source_document_id: 'doc-1', title: 'a.mp4' },
      { source_document_id: 'doc-2' },
    ]);
  });

  it('ignores malformed JSON and non-array values', () => {
    window.sessionStorage.setItem(STORAGE_KEY, '{not-json');
    expect(readActiveVideoIngestSessions()).toEqual([]);

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 'x' }));
    expect(readActiveVideoIngestSessions()).toEqual([]);
  });

  it('filters out invalid session entries', () => {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { source_document_id: 'doc-1', title: 'ok.mp4' },
        { title: 'missing-id' },
        null,
        'string',
      ]),
    );

    expect(readActiveVideoIngestSessions()).toEqual([
      { source_document_id: 'doc-1', title: 'ok.mp4' },
    ]);
  });

  it('clears the session storage key', () => {
    writeActiveVideoIngestSessions([{ source_document_id: 'doc-1' }]);
    clearActiveVideoIngestSessions();
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(readActiveVideoIngestSessions()).toEqual([]);
  });

  it('merges accepted sources and dedupes by source_document_id', () => {
    writeActiveVideoIngestSessions([
      { source_document_id: 'doc-1', title: 'old.mp4' },
      { source_document_id: 'doc-2', title: 'keep.mp4' },
    ]);

    const merged = mergeActiveVideoIngestSessions([
      {
        source_document_id: 'doc-1',
        title: 'new.mp4',
        source_type: 'video',
        stored_path: '',
        poll_url: '',
      },
      {
        source_document_id: 'doc-3',
        title: 'third.mp4',
        source_type: 'video',
        stored_path: '',
        poll_url: '',
      },
    ]);

    expect(merged).toEqual([
      { source_document_id: 'doc-1', title: 'new.mp4' },
      { source_document_id: 'doc-2', title: 'keep.mp4' },
      { source_document_id: 'doc-3', title: 'third.mp4' },
    ]);
    expect(readActiveVideoIngestSessions()).toEqual(merged);
  });

  it('does not prune sessions for non-terminal statuses', () => {
    writeActiveVideoIngestSessions([
      { source_document_id: 'doc-1', title: 'a.mp4' },
    ]);

    expect(pruneActiveVideoIngestSession('doc-1', 'running')).toEqual([
      { source_document_id: 'doc-1', title: 'a.mp4' },
    ]);
    expect(readActiveVideoIngestSessions()).toHaveLength(1);
  });

  it('prunes a terminal session and clears storage when empty', () => {
    writeActiveVideoIngestSessions([
      { source_document_id: 'doc-1', title: 'a.mp4' },
    ]);

    expect(pruneActiveVideoIngestSession('doc-1', 'succeeded')).toEqual([]);
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('prunes one terminal session and keeps the rest', () => {
    writeActiveVideoIngestSessions([
      { source_document_id: 'doc-1', title: 'a.mp4' },
      { source_document_id: 'doc-2', title: 'b.mp4' },
    ]);

    expect(pruneActiveVideoIngestSession('doc-1', 'failed')).toEqual([
      { source_document_id: 'doc-2', title: 'b.mp4' },
    ]);
    expect(readActiveVideoIngestSessions()).toEqual([
      { source_document_id: 'doc-2', title: 'b.mp4' },
    ]);
  });

  it('ignores prune when sourceDocumentId is empty', () => {
    writeActiveVideoIngestSessions([{ source_document_id: 'doc-1' }]);
    expect(pruneActiveVideoIngestSession('', 'succeeded')).toEqual([
      { source_document_id: 'doc-1' },
    ]);
  });
});
