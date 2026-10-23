/** Shared layout props for document-usage dashboard tables. */
export const DOCUMENT_USAGE_TABLE_PROPS = {
  /** min-width lives on the table so the outer container can shrink and scroll. */
  className: 'table-fixed w-full min-w-[32rem]',
} as const;

export const DOC_TABLE_CELL = {
  compact: 'px-2 sm:px-3',
  truncate: 'min-w-0 overflow-hidden',
  nowrap: 'whitespace-nowrap',
  /** Allow long cell text to wrap within the column instead of overlapping. */
  wrap: 'min-w-0 break-words whitespace-normal',
} as const;
