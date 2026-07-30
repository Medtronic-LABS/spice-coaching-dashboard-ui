import { describe, expect, it } from 'vitest';
import type { KnowledgeSplitDraft } from '@/features/modules/types/knowledgeLibrary.types';
import { knowledgeSplitDraftInvalidReason } from './knowledgeSplitValidation';

function splitDraft(
  partial: Partial<KnowledgeSplitDraft> = {},
): KnowledgeSplitDraft {
  return {
    title: 'Valid Split Title',
    startPage: 1,
    endPage: 1,
    thumbnailFile: null,
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

  it('valid splits => returns null', () => {
    const splits = [splitDraft({ title: 'Split 1', startPage: 1, endPage: 1 })];
    expect(knowledgeSplitDraftInvalidReason(splits)).toBeNull();
  });
});
