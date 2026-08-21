import { describe, expect, it } from 'vitest';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import type { KnowledgeSplitDraft } from '@/features/modules/types/knowledgeLibrary.types';
import {
  knowledgeSplitDraftFieldErrors,
  knowledgeSplitDraftHasFieldErrors,
  knowledgeSplitPageMaxDigits,
  KNOWLEDGE_SPLIT_PAGE_FALLBACK_DIGITS,
  parseKnowledgeSplitPageInput,
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

describe('parseKnowledgeSplitPageInput', () => {
  it('caps extra digits to the page-count budget', () => {
    expect(knowledgeSplitPageMaxDigits(5)).toBe(1);
    expect(parseKnowledgeSplitPageInput('999', 5)).toBe(9);
    expect(parseKnowledgeSplitPageInput('12', 12)).toBe(12);
    expect(parseKnowledgeSplitPageInput('123', 12)).toBe(12);
    expect(parseKnowledgeSplitPageInput('', 5)).toBeNaN();
  });

  it('falls back to six digits when page count is unknown', () => {
    expect(knowledgeSplitPageMaxDigits(null)).toBe(
      KNOWLEDGE_SPLIT_PAGE_FALLBACK_DIGITS,
    );
    expect(knowledgeSplitPageMaxDigits(undefined)).toBe(
      KNOWLEDGE_SPLIT_PAGE_FALLBACK_DIGITS,
    );
    expect(knowledgeSplitPageMaxDigits(0)).toBe(
      KNOWLEDGE_SPLIT_PAGE_FALLBACK_DIGITS,
    );
    expect(parseKnowledgeSplitPageInput('1234567', null)).toBe(123456);
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
