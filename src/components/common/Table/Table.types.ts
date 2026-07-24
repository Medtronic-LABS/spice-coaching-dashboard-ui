import * as React from 'react';

type KeyOf<T> = Extract<keyof T, string>;

export type ColumnDef<T extends object> = {
  key: KeyOf<T>;
  header: React.ReactNode;
  headerClassName?: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
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
};
