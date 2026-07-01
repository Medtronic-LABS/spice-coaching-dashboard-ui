import { describe, expect, it } from 'vitest';
import {
  buildOverrideFlags,
  conflictFilenamesFromList,
  parseIngestDuplicateError,
  selectFilesForConflicts,
} from './parseIngestDuplicateError';

describe('parseIngestDuplicateError', () => {
  const conflicts = [
    {
      filename: 'guide.pdf',
      title: 'guide',
      content_sha256: 'abc',
      existing_source_documents: [],
    },
  ];

  it('parses FastAPI detail wrapper on 409', () => {
    const parsed = parseIngestDuplicateError({
      status: 409,
      data: {
        detail: {
          code: 'duplicate_content',
          message: 'duplicate',
          conflicts,
        },
      },
    });
    expect(parsed?.code).toBe('duplicate_content');
    expect(parsed?.conflicts).toHaveLength(1);
  });

  it('returns null for non-409 errors', () => {
    expect(
      parseIngestDuplicateError({ status: 400, data: { detail: 'bad' } }),
    ).toBeNull();
  });
});

describe('buildOverrideFlags', () => {
  it('marks only conflicting files for override', () => {
    const files = [new File(['a'], 'new.pdf'), new File(['b'], 'dup.pdf')];
    const flags = buildOverrideFlags(files, new Set(['dup.pdf']));
    expect(flags).toEqual([false, true]);
  });
});

describe('selectFilesForConflicts', () => {
  it('keeps titles aligned with selected files', () => {
    const files = [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')];
    const selected = selectFilesForConflicts(
      files,
      ['Title A', 'Title B'],
      [{ filename: 'b.pdf', title: 'Title B' }],
    );
    expect(selected.files.map((file) => file.name)).toEqual(['b.pdf']);
    expect(selected.titles).toEqual(['Title B']);
  });
});

describe('conflictFilenamesFromList', () => {
  it('collects filenames', () => {
    expect(
      conflictFilenamesFromList([{ filename: 'a.pdf' }, { filename: 'b.pdf' }]),
    ).toEqual(new Set(['a.pdf', 'b.pdf']));
  });
});
