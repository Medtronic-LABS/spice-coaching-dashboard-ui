import * as React from 'react';

type KeyOf<T> = Extract<keyof T, string>;

export type ColumnDef<T extends object> = {
  key: KeyOf<T>;
  header: React.ReactNode;
  headerClassName?: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
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
};
