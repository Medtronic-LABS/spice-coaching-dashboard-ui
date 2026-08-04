import { describe, expect, it } from 'vitest';
import {
  allPayloadSourcesAreIngestDuplicates,
  buildIngestOverrideFlags,
  buildOverrideFlags,
  conflictFilenamesFromList,
  conflictsKeptExisting,
  findKeptExistingTargetForSource,
  isOverriddenUploadedSource,
  normalizeUploadResponse,
  parseIngestDuplicateError,
  selectFilesForConflicts,
  sourceDocumentFromDuplicateConflict,
  uploadResponseFromDuplicateConflicts,
  uploadedSourceFromConflict,
} from './parseIngestDuplicateError';

const existingSource = {
  source_document_id: '8cc639e4-d721-4154-98e1-f46db88683fe',
  title: 'Procedure description',
  original_filename: 'Procedure description.pdf',
  ingested_at: '2026-07-28T06:23:32.267627+00:00',
  status: 'uploaded',
};

const conflicts = [
  {
    filename: 'Procedure description.pdf',
    title: 'Procedure description',
    content_sha256:
      '5205d0dd16b95cbcf21751808c0e57a71dabc0a6006656bbe1625185db13c622',
    existing_source_documents: [existingSource],
  },
];

describe('parseIngestDuplicateError', () => {
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

  it('parses RFC7807 top-level duplicate_content on 409', () => {
    const parsed = parseIngestDuplicateError({
      status: 409,
      data: {
        type: 'docs/error-codes.json#duplicate_content',
        title: 'Duplicate Content',
        status: 409,
        detail:
          'One or more files match already-uploaded or already-ingested content; set override to re-upload.',
        code: 'duplicate_content',
        conflicts,
      },
    });
    expect(parsed?.code).toBe('duplicate_content');
    expect(parsed?.message).toContain('already-uploaded');
    expect(parsed?.conflicts[0]?.filename).toBe('Procedure description.pdf');
  });

  it('returns null for non-409 errors', () => {
    expect(
      parseIngestDuplicateError({ status: 400, data: { detail: 'bad' } }),
    ).toBeNull();
  });
});

describe('uploadedSourceFromConflict', () => {
  it('maps existing uploaded source document ids', () => {
    const source = uploadedSourceFromConflict(conflicts[0], 'clinical');
    expect(source?.source_document_id).toBe(existingSource.source_document_id);
    expect(source?.source_type).toBe('pdf');
    expect(source?.content_domain).toBe('clinical');
    expect(source?.status).toBe('uploaded');
  });
});

describe('normalizeUploadResponse', () => {
  it('merges skipped duplicates into ordered sources', () => {
    const payload = {
      files: [
        new File(['a'], 'new.docx'),
        new File(['b'], 'Procedure description.pdf'),
      ],
      content_domains: ['clinical', 'clinical'] as const,
    };
    const response = normalizeUploadResponse(payload, {
      status: 'uploaded',
      sources: [
        {
          source_document_id: '07b62cf7-5c5f-4762-a918-ba7fffdff774',
          title: 'AI Microcoaching Scenarios -V1',
          source_type: 'docx',
          stored_path: 'medtronics-storage/ingest/new.docx',
          content_domain: 'clinical',
          status: 'uploaded',
        },
      ],
      skipped_duplicates: conflicts,
    });

    expect(response.sources).toHaveLength(2);
    expect(response.sources[0]?.source_document_id).toBe(
      '07b62cf7-5c5f-4762-a918-ba7fffdff774',
    );
    expect(response.sources[1]?.source_document_id).toBe(
      existingSource.source_document_id,
    );
  });
});

describe('uploadResponseFromDuplicateConflicts', () => {
  it('builds upload-ready sources from 409 conflicts', () => {
    const payload = {
      files: [new File(['b'], 'Procedure description.pdf')],
    };
    const response = uploadResponseFromDuplicateConflicts(payload, conflicts);
    expect(response.status).toBe('uploaded');
    expect(response.sources).toHaveLength(1);
    expect(response.skipped_duplicates).toEqual(conflicts);
  });
});

describe('buildOverrideFlags', () => {
  it('marks only conflicting files for override', () => {
    const files = [new File(['a'], 'new.pdf'), new File(['b'], 'dup.pdf')];
    const flags = buildOverrideFlags(files, new Set(['dup.pdf']));
    expect(flags).toEqual([false, true]);
  });
});

describe('buildIngestOverrideFlags', () => {
  it('marks duplicate source document ids for override', () => {
    const flags = buildIngestOverrideFlags(
      ['new-id', existingSource.source_document_id],
      conflicts,
    );
    expect(flags).toEqual([false, true]);
  });
});

describe('selectFilesForConflicts', () => {
  it('keeps visibility aligned with selected files', () => {
    const files = [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')];
    const selected = selectFilesForConflicts(
      files,
      [true, false],
      [{ filename: 'b.pdf', title: 'Title B' }],
    );
    expect(selected.files.map((file) => file.name)).toEqual(['b.pdf']);
    expect(selected.syncPublishedVisible).toEqual([false]);
  });
});

describe('conflictFilenamesFromList', () => {
  it('collects filenames', () => {
    expect(
      conflictFilenamesFromList([{ filename: 'a.pdf' }, { filename: 'b.pdf' }]),
    ).toEqual(new Set(['a.pdf', 'b.pdf']));
  });
});

describe('conflictsKeptExisting', () => {
  const duplicateConflicts = [
    conflicts[0]!,
    {
      filename: 'protocol.pdf',
      title: 'Protocol',
      content_sha256: 'def',
      existing_source_documents: [
        {
          source_document_id: 'src-2',
          title: 'Existing Protocol',
          original_filename: 'protocol.pdf',
          ingested_at: '2026-07-16T08:00:00Z',
          status: 'uploaded',
        },
      ],
    },
  ];

  it('returns conflicts that were not selected for re-ingest', () => {
    expect(
      conflictsKeptExisting(duplicateConflicts, ['Procedure description.pdf']),
    ).toEqual([duplicateConflicts[1]]);
  });

  it('returns all conflicts when nothing is selected', () => {
    expect(conflictsKeptExisting(duplicateConflicts, [])).toEqual(
      duplicateConflicts,
    );
  });
});

describe('allPayloadSourcesAreIngestDuplicates', () => {
  const duplicateConflicts = [
    conflicts[0]!,
    {
      filename: 'protocol.pdf',
      title: 'Protocol',
      content_sha256: 'def',
      existing_source_documents: [
        {
          source_document_id: 'src-2',
          title: 'Existing Protocol',
          original_filename: 'protocol.pdf',
          ingested_at: '2026-07-16T08:00:00Z',
          status: 'uploaded',
        },
      ],
    },
  ];

  it('returns true when every payload source is a duplicate conflict', () => {
    expect(
      allPayloadSourcesAreIngestDuplicates(
        [existingSource.source_document_id, 'src-2'],
        duplicateConflicts,
      ),
    ).toBe(true);
  });

  it('returns false when some payload sources are not duplicate conflicts', () => {
    expect(
      allPayloadSourcesAreIngestDuplicates(
        [existingSource.source_document_id, 'src-new'],
        duplicateConflicts,
      ),
    ).toBe(false);
  });
});

describe('sourceDocumentFromDuplicateConflict', () => {
  it('returns existing source document metadata', () => {
    expect(sourceDocumentFromDuplicateConflict(conflicts[0]!)).toEqual({
      sourceDocumentId: existingSource.source_document_id,
      title: existingSource.title,
    });
  });

  it('returns null when no existing source is linked', () => {
    expect(
      sourceDocumentFromDuplicateConflict({
        filename: 'new.pdf',
        title: 'New',
        content_sha256: 'xyz',
        existing_source_documents: [],
      }),
    ).toBeNull();
  });
});

describe('findKeptExistingTargetForSource', () => {
  it('matches uploaded source to kept-existing conflict', () => {
    const source = {
      source_document_id: existingSource.source_document_id,
      title: 'Procedure description',
      source_type: 'pdf' as const,
      stored_path: '',
      status: 'uploaded',
    };
    expect(findKeptExistingTargetForSource(source, conflicts)).toEqual({
      sourceDocumentId: existingSource.source_document_id,
      title: existingSource.title,
    });
  });
});

describe('isOverriddenUploadedSource', () => {
  it('returns true when duplicate was uploaded as a new source', () => {
    const overriddenSource = {
      source_document_id: 'new-source-id',
      title: 'Procedure description',
      source_type: 'pdf' as const,
      stored_path: '/new/path',
      status: 'uploaded',
    };
    expect(
      isOverriddenUploadedSource(
        overriddenSource,
        ['Procedure description.pdf'],
        conflicts,
      ),
    ).toBe(true);
  });

  it('returns false when duplicate reused the existing source', () => {
    const reusedSource = uploadedSourceFromConflict(conflicts[0]!);
    expect(reusedSource).not.toBeNull();
    expect(
      isOverriddenUploadedSource(
        reusedSource!,
        ['Procedure description.pdf'],
        conflicts,
      ),
    ).toBe(false);
  });
});
