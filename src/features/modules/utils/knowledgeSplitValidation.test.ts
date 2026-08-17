import { describe, expect, it } from 'vitest';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import type { KnowledgeSplitDraft } from '@/features/modules/types/knowledgeLibrary.types';
import {
  knowledgeSplitDraftFieldErrors,
  knowledgeSplitDraftHasFieldErrors,
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

  it('flags start page below 1', () => {
    const errors = knowledgeSplitDraftFieldErrors([
      splitDraft({ startPage: 0, endPage: 1 }),
    ]);
    expect(errors[0]?.startPage).toBe('Start page must be >= 1.');
  });

  it('flags end page below 1', () => {
    const errors = knowledgeSplitDraftFieldErrors([
      splitDraft({ startPage: 1, endPage: 0 }),
    ]);
    expect(errors[0]?.endPage).toBe('End page must be >= 1.');
  });

  it('flags start page greater than end page', () => {
    const errors = knowledgeSplitDraftFieldErrors([
      splitDraft({ startPage: 3, endPage: 1 }),
    ]);
    expect(errors[0]?.endPage).toBe('End page must be >= start page.');
  });

  it('flags start page above pageCount', () => {
    const errors = knowledgeSplitDraftFieldErrors(
      [splitDraft({ startPage: 8, endPage: 9 })],
      { pageCount: 5 },
    );
    expect(errors[0]?.startPage).toBe('Start page must be ≤ 5.');
    expect(errors[0]?.endPage).toBe('End page must be ≤ 5.');
  });

  it('flags titles over the document title limit', () => {
    const errors = knowledgeSplitDraftFieldErrors([
      splitDraft({ title: 'A'.repeat(FIELD_LIMITS.documentTitle + 1) }),
    ]);
    expect(errors[0]?.title).toBe('Title must be 200 characters or fewer.');
  });

  it('returns empty field errors for valid drafts', () => {
    const errors = knowledgeSplitDraftFieldErrors(
      [splitDraft({ title: 'Split 1', startPage: 1, endPage: 1 })],
      { pageCount: 5 },
    );
    expect(errors[0]).toEqual({});
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

  it('returns true when title is required and missing', () => {
    expect(
      knowledgeSplitDraftHasFieldErrors([splitDraft({ title: '' })], {
        requireTitle: true,
      }),
    ).toBe(true);
  });
});
