import { cn } from '@/utils';
import type { TableProps } from './Table.types';

export type { ColumnDef, TableProps } from './Table.types';

export function Table<T extends object>({
  data,
  columns,
  keyExtractor,
  containerClassName,
  className,
  emptyMessage = 'No data available',
  caption,
  ...tableProps
}: TableProps<T>) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-lg border border-slate-200',
        containerClassName,
      )}
    >
      <table
        className={cn('w-full text-left text-sm text-slate-700', className)}
        {...tableProps}
      >
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-slate-50 text-xs uppercase text-slate-700">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                className="px-6 py-3 font-medium tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.length > 0 ? (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="transition-colors hover:bg-slate-50"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn('px-6 py-4 whitespace-nowrap', col.className)}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
