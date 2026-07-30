import type { KnowledgeSplitDraft } from '@/features/modules/types/knowledgeLibrary.types';

export interface KnowledgeSplitValidationOptions {
  /** When known, page numbers must be within 1..pageCount. */
  pageCount?: number | null;
  /** When false, skip title-required checks (useful for live page warnings). */
  requireTitle?: boolean;
}

/**
 * Client-side validation for split drafts.
 * Returns a human-readable error message, or `null` when drafts are valid.
 */
export function knowledgeSplitDraftInvalidReason(
  splits: KnowledgeSplitDraft[],
  options: KnowledgeSplitValidationOptions = {},
): string | null {
  const { pageCount = null, requireTitle = true } = options;

  if (splits.length === 0) return 'Please add at least one split.';

  for (let i = 0; i < splits.length; i += 1) {
    const row = splits[i];

    if (requireTitle && !row.title.trim()) {
      return `Split ${i + 1}: title is required.`;
    }

    if (!Number.isFinite(row.startPage) || row.startPage < 1) {
      return `Split ${i + 1}: start page must be >= 1.`;
    }

    if (!Number.isFinite(row.endPage) || row.endPage < 1) {
      return `Split ${i + 1}: end page must be >= 1.`;
    }

    if (row.startPage > row.endPage) {
      return `Split ${i + 1}: start page must be <= end page.`;
    }

    if (typeof pageCount === 'number' && pageCount >= 1) {
      if (row.startPage > pageCount) {
        return `Split ${i + 1}: start page must be ≤ ${pageCount}.`;
      }
      if (row.endPage > pageCount) {
        return `Split ${i + 1}: end page must be ≤ ${pageCount}.`;
      }
    }
  }

  return null;
}

export type KnowledgeSplitDraftFieldErrors = {
  title?: string;
  startPage?: string;
  endPage?: string;
};

/**
 * Split draft errors for inline rendering.
 * Each split returns an object with the fields that are invalid.
 */
export function knowledgeSplitDraftFieldErrors(
  splits: KnowledgeSplitDraft[],
  options: KnowledgeSplitValidationOptions = {},
): KnowledgeSplitDraftFieldErrors[] {
  const { pageCount = null, requireTitle = true } = options;

  return splits.map((row) => {
    const errs: KnowledgeSplitDraftFieldErrors = {};

    if (requireTitle && !row.title.trim()) {
      errs.title = 'Title is required.';
    }

    const start = row.startPage;
    const end = row.endPage;

    const startOk = Number.isFinite(start) && start >= 1;
    const endOk = Number.isFinite(end) && end >= 1;

    if (!startOk) {
      errs.startPage = 'Start page is required.';
      if (Number.isFinite(start) && start < 1) {
        errs.startPage = 'Start page must be >= 1.';
      }
    }

    if (!endOk) {
      errs.endPage = 'End page is required.';
      if (Number.isFinite(end) && end < 1) {
        errs.endPage = 'End page must be >= 1.';
      }
    }

    // Only validate ordering if both are present and >= 1.
    if (startOk && endOk && start > end) {
      errs.endPage = 'End page must be >= start page.';
    }

    if (typeof pageCount === 'number' && pageCount >= 1) {
      if (startOk && start > pageCount) {
        errs.startPage = `Start page must be ≤ ${pageCount}.`;
      }
      if (endOk && end > pageCount) {
        errs.endPage = `End page must be ≤ ${pageCount}.`;
      }
    }

    return errs;
  });
}

export function knowledgeSplitDraftHasFieldErrors(
  splits: KnowledgeSplitDraft[],
  options: KnowledgeSplitValidationOptions = {},
): boolean {
  const errors = knowledgeSplitDraftFieldErrors(splits, options);
  return errors.some((e) => Boolean(e.title || e.startPage || e.endPage));
}
