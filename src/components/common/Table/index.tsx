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
        'w-full overflow-x-auto rounded-lg border border-spice-border bg-spice-bg-surface',
        containerClassName,
      )}
    >
      <table
        className={cn(
          'w-full text-left text-sm text-spice-text-medium',
          className,
        )}
        {...tableProps}
      >
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-spice-bg-tint text-xs uppercase text-spice-text-medium">
          <tr>
            {columns.map((col, colIndex) => (
              <th
                key={`${String(col.key)}-${colIndex}`}
                scope="col"
                className="px-6 py-3 font-medium tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-spice-border bg-spice-bg-surface">
          {data.length > 0 ? (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="transition-colors hover:bg-spice-semantic-warningBg"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={`${String(col.key)}-${colIndex}`}
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
                className="px-6 py-8 text-center text-spice-text-muted"
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
