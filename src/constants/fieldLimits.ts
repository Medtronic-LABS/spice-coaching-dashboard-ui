/** Max input length for short admin labels (Unicode code points). */
export const FIELD_LIMITS = {
  milestoneName: 80,
  moduleTitle: 120,
  cardTitle: 100,
  documentTitle: 200,
} as const;

/** Inline confirmation modals show this many characters before an ellipsis. */
export const DISPLAY_LABEL_MAX_LENGTH = 60;

/** Table/list cells truncate longer labels at this length before an ellipsis. */
export const TABLE_CELL_LABEL_MAX_LENGTH = 50;

/** Fixed-width table column classes for title-like cells. */
export const TABLE_TITLE_COLUMN_CLASS =
  'w-[20rem] min-w-[20rem] max-w-[20rem] overflow-hidden break-all';

export const TABLE_MILESTONE_NAME_COLUMN_CLASS =
  'w-[18rem] min-w-[18rem] max-w-[18rem] overflow-hidden break-all';

export const TABLE_MODULE_LIST_COLUMN_CLASS =
  'w-[16rem] min-w-[16rem] max-w-[16rem] overflow-hidden break-all';

export function fieldLimitExceededMessage(
  label: string,
  maxLength: number,
): string {
  return `${label} must be ${maxLength} characters or fewer.`;
}
