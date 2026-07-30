import type { KnowledgeSplitDraft } from '@/features/modules/types/knowledgeLibrary.types';

/**
 * Client-side validation for split drafts.
 * Returns a human-readable error message, or `null` when drafts are valid.
 */
export function knowledgeSplitDraftInvalidReason(
  splits: KnowledgeSplitDraft[],
): string | null {
  if (splits.length === 0) return 'Please add at least one split.';

  for (let i = 0; i < splits.length; i += 1) {
    const row = splits[i];

    if (!row.title.trim()) return `Split ${i + 1}: title is required.`;

    if (!Number.isFinite(row.startPage) || row.startPage < 1) {
      return `Split ${i + 1}: start page must be >= 1.`;
    }

    if (!Number.isFinite(row.endPage) || row.endPage < 1) {
      return `Split ${i + 1}: end page must be >= 1.`;
    }

    if (row.startPage > row.endPage) {
      return `Split ${i + 1}: start page must be <= end page.`;
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
): KnowledgeSplitDraftFieldErrors[] {
  return splits.map((row) => {
    const errs: KnowledgeSplitDraftFieldErrors = {};

    if (!row.title.trim()) {
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

    return errs;
  });
}

export function knowledgeSplitDraftHasFieldErrors(
  splits: KnowledgeSplitDraft[],
): boolean {
  const errors = knowledgeSplitDraftFieldErrors(splits);
  return errors.some((e) => Boolean(e.title || e.startPage || e.endPage));
}
