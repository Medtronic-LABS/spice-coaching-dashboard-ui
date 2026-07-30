import { describe, expect, it } from 'vitest';
import type { KnowledgeSplitDraft } from '@/features/modules/types/knowledgeLibrary.types';
import {
  knowledgeSplitDraftFieldErrors,
  knowledgeSplitDraftHasFieldErrors,
  knowledgeSplitDraftInvalidReason,
} from './knowledgeSplitValidation';

function splitDraft(
  partial: Partial<KnowledgeSplitDraft> = {},
): KnowledgeSplitDraft {
  return {
    title: 'Valid Split Title',
    startPage: 1,
    endPage: 1,
    thumbnailFile: null,
    suppressAutoThumbnail: false,
    ...partial,
  };
}

describe('knowledgeSplitDraftInvalidReason', () => {
  it('empty splits => error', () => {
    expect(knowledgeSplitDraftInvalidReason([])).toBe(
      'Please add at least one split.',
    );
  });

  it('missing title => error', () => {
    const splits = [splitDraft({ title: '' })];
    expect(knowledgeSplitDraftInvalidReason(splits)).toBe(
      'Split 1: title is required.',
    );
  });

  it('startPage < 1 => error', () => {
    const splits = [splitDraft({ startPage: 0 })];
    expect(knowledgeSplitDraftInvalidReason(splits)).toBe(
      'Split 1: start page must be >= 1.',
    );
  });

  it('endPage < 1 => error', () => {
    const splits = [splitDraft({ endPage: 0 })];
    expect(knowledgeSplitDraftInvalidReason(splits)).toBe(
      'Split 1: end page must be >= 1.',
    );
  });

  it('startPage > endPage => error', () => {
    const splits = [splitDraft({ startPage: 2, endPage: 1 })];
    expect(knowledgeSplitDraftInvalidReason(splits)).toBe(
      'Split 1: start page must be <= end page.',
    );
  });

  it('endPage > pageCount => error', () => {
    const splits = [splitDraft({ startPage: 1, endPage: 10 })];
    expect(knowledgeSplitDraftInvalidReason(splits, { pageCount: 5 })).toBe(
      'Split 1: end page must be ≤ 5.',
    );
  });

  it('startPage > pageCount => error', () => {
    const splits = [splitDraft({ startPage: 8, endPage: 9 })];
    expect(knowledgeSplitDraftInvalidReason(splits, { pageCount: 5 })).toBe(
      'Split 1: start page must be ≤ 5.',
    );
  });

  it('valid splits => returns null', () => {
    const splits = [splitDraft({ title: 'Split 1', startPage: 1, endPage: 1 })];
    expect(
      knowledgeSplitDraftInvalidReason(splits, { pageCount: 5 }),
    ).toBeNull();
  });
});

describe('knowledgeSplitDraftFieldErrors', () => {
  it('live mode skips title but flags end page over pageCount', () => {
    const splits = [splitDraft({ title: '', startPage: 1, endPage: 12 })];
    const errors = knowledgeSplitDraftFieldErrors(splits, {
      pageCount: 5,
      requireTitle: false,
    });
    expect(errors[0]?.title).toBeUndefined();
    expect(errors[0]?.endPage).toBe('End page must be ≤ 5.');
  });

  it('submit mode requires title and page bounds', () => {
    const splits = [splitDraft({ title: '', startPage: 1, endPage: 12 })];
    const errors = knowledgeSplitDraftFieldErrors(splits, {
      pageCount: 5,
      requireTitle: true,
    });
    expect(errors[0]?.title).toBe('Title is required.');
    expect(errors[0]?.endPage).toBe('End page must be ≤ 5.');
  });
});

describe('knowledgeSplitDraftHasFieldErrors', () => {
  it('returns false for valid drafts within pageCount', () => {
    expect(
      knowledgeSplitDraftHasFieldErrors([splitDraft()], { pageCount: 5 }),
    ).toBe(false);
  });

  it('returns true when requireTitle is false but page is out of range', () => {
    expect(
      knowledgeSplitDraftHasFieldErrors(
        [splitDraft({ title: '', endPage: 9 })],
        { pageCount: 5, requireTitle: false },
      ),
    ).toBe(true);
  });
});
