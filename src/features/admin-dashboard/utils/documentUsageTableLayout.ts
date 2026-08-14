/** Shared layout props for document-usage dashboard tables. */
export const DOCUMENT_USAGE_TABLE_PROPS = {
  className: 'table-fixed w-full',
  containerClassName: 'min-w-[32rem]',
} as const;

export const DOC_TABLE_CELL = {
  compact: 'px-2 sm:px-3',
  truncate: 'min-w-0 overflow-hidden',
  nowrap: 'whitespace-nowrap',
} as const;
