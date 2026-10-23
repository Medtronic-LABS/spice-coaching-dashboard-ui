import * as React from 'react';

type KeyOf<T> = Extract<keyof T, string>;

export type ColumnDef<T extends object> = {
  /** Row field key, or any string when using a custom `render`. */
  key: KeyOf<T> | (string & {});
  header: React.ReactNode;
  headerClassName?: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  /** Optional `<col>` class for reliable widths in `table-fixed` layouts. */
  colClassName?: string;
};

export type TableProps<T extends object> = Omit<
  React.TableHTMLAttributes<HTMLTableElement>,
  'children'
> & {
  data: T[];
  columns: Array<ColumnDef<T>>;
  keyExtractor: (row: T) => string | number;
  containerClassName?: string;
  emptyMessage?: React.ReactNode;
  caption?: React.ReactNode;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (sortKey: string, sortDir: 'asc' | 'desc') => void;
  /** Optional second row under each data row (e.g. expand/compare panels). */
  renderExpandedRow?: (row: T) => React.ReactNode | null | undefined;
  getRowClassName?: (row: T) => string | undefined;
  /** `compact` keeps dashboard tables dense; `comfortable` matches module library. */
  density?: 'compact' | 'comfortable';
  /** When true and `data` is empty, shows `loadingMessage` instead of `emptyMessage`. */
  isLoading?: boolean;
  loadingMessage?: React.ReactNode;
  /** When set, replaces table body rows with a centered query error state. */
  queryError?: unknown;
  queryErrorTitle?: string;
  onRetryQuery?: () => void;
};
