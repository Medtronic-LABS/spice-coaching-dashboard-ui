import { describe, expect, it } from 'vitest';
import {
  buildKnowledgeUploadFormData,
  normalizeKnowledgeUploadersResponse,
} from './adminKnowledgeApi';

describe('normalizeKnowledgeUploadersResponse', () => {
  it('maps SourceDocumentActorRef rows to combobox value/label', () => {
    expect(
      normalizeKnowledgeUploadersResponse({
        uploaders: [
          { id: 101, name: 'alice' },
          { id: 102, name: ' bob ' },
          { id: 103, name: '' },
          { value: 'legacy', label: 'legacy' },
          null,
        ],
      }),
    ).toEqual({
      uploaders: [
        { value: '101', label: 'alice' },
        { value: '102', label: 'bob' },
      ],
    });
  });

  it('returns an empty list for invalid envelopes', () => {
    expect(normalizeKnowledgeUploadersResponse(null)).toEqual({
      uploaders: [],
    });
    expect(normalizeKnowledgeUploadersResponse({})).toEqual({ uploaders: [] });
  });
});

describe('buildKnowledgeUploadFormData', () => {
  it('includes override_duplicates only when requested', () => {
    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });

    const withOverride = buildKnowledgeUploadFormData({
      file,
      title: 'Doc',
      overrideDuplicates: true,
    });
    expect(withOverride.get('override_duplicates')).toBe('true');
    expect(withOverride.get('title')).toBe('Doc');

    const withoutOverride = buildKnowledgeUploadFormData({
      file,
      title: 'Doc',
    });
    expect(withoutOverride.get('override_duplicates')).toBeNull();
  });
});
