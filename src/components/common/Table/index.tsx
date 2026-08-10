import { Fragment } from 'react';
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
  sortBy,
  sortDir,
  onSort,
  renderExpandedRow,
  getRowClassName,
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
            {columns.map((col) => {
              const sortKey = col.sortKey ?? String(col.key);
              const isSortable = Boolean(col.sortable && onSort);
              const isActive = Boolean(sortBy && sortBy === sortKey);
              const isAsc = isActive && sortDir === 'asc';
              const isDesc = isActive && sortDir === 'desc';

              const handleHeaderClick = () => {
                if (!isSortable || !onSort) return;
                const nextDir = isActive && sortDir === 'asc' ? 'desc' : 'asc';
                onSort(sortKey, nextDir);
              };

              return (
                <th
                  key={String(col.key)}
                  scope="col"
                  className={cn(
                    'px-3 py-1.5 font-medium tracking-wider sm:px-6 sm:py-2',
                    isSortable && onSort && 'cursor-pointer select-none group',
                    col.headerClassName,
                  )}
                  onClick={isSortable && onSort ? handleHeaderClick : undefined}
                >
                  <div className="inline-flex items-center gap-1.5">
                    {isSortable && onSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-left uppercase font-medium tracking-wider focus:outline-none focus-visible:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHeaderClick();
                        }}
                      >
                        <span>{col.header}</span>
                        <span className="inline-flex shrink-0 ml-1">
                          {isAsc ? (
                            <svg
                              className="h-3.5 w-3.5 text-spice-brand-primary stroke-[2.5]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 19.5V4.5m0 0l-6.75 6.75M12 4.5l6.75 6.75"
                              />
                            </svg>
                          ) : isDesc ? (
                            <svg
                              className="h-3.5 w-3.5 text-spice-brand-primary stroke-[2.5]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-3.5 w-3.5 text-spice-text-muted/40 group-hover:text-spice-brand-primary transition-colors stroke-[2]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                              />
                            </svg>
                          )}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-spice-border bg-spice-bg-surface">
          {data.length > 0 ? (
            data.map((row) => {
              const rowKey = keyExtractor(row);
              const expandedContent = renderExpandedRow?.(row);

              return (
                <Fragment key={rowKey}>
                  <tr
                    className={cn(
                      'transition-colors',
                      getRowClassName
                        ? getRowClassName(row)
                        : 'hover:bg-spice-semantic-warningBg',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn(
                          'px-3 py-1.5 whitespace-nowrap sm:px-6 sm:py-2',
                          col.className,
                        )}
                      >
                        {col.render
                          ? col.render(row)
                          : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                  {expandedContent ? (
                    <tr className="bg-spice-bg-tint/20">
                      <td
                        colSpan={columns.length}
                        className="p-4 sm:p-5 border-y border-spice-border/50"
                      >
                        {expandedContent}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-spice-text-muted sm:px-6"
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
