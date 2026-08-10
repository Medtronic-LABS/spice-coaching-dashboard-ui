import { Button, Select } from '@/components/ui';
import { cn } from '@/utils';

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  totalItems: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  pageInput: string;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPageSizeChange: (pageSize: number) => void;
  onPageInputChange: (raw: string) => void;
  onCommitPageInput: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  rowsLabel?: string;
  pageLabel?: string;
  rowsPerPageAriaLabel?: string;
  pageNumberAriaLabel?: string;
  className?: string;
}

export const TablePagination = ({
  pageSize,
  pageSizeOptions,
  totalItems,
  totalPages,
  rangeStart,
  rangeEnd,
  pageInput,
  hasPrevPage,
  hasNextPage,
  onPageSizeChange,
  onPageInputChange,
  onCommitPageInput,
  onPrevPage,
  onNextPage,
  rowsLabel = 'Rows',
  pageLabel = 'Page',
  rowsPerPageAriaLabel = 'Rows per page',
  pageNumberAriaLabel = 'Page number',
  className,
}: TablePaginationProps) => {
  const hasRows = rangeEnd >= rangeStart && rangeStart > 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-spice-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-spice-text-muted">
        <label className="inline-flex items-center gap-2">
          <span className="whitespace-nowrap font-medium text-spice-text-medium">
            {rowsLabel}
          </span>
          <Select
            aria-label={rowsPerPageAriaLabel}
            className="h-8 w-[4.5rem] px-2 text-xs"
            value={String(pageSize)}
            options={pageSizeOptions.map((size) => ({
              label: String(size),
              value: String(size),
            }))}
            onChange={(value) => {
              const next = Number.parseInt(value, 10);
              if (!Number.isFinite(next) || next <= 0) return;
              onPageSizeChange(next);
            }}
          />
        </label>

        <label className="inline-flex items-center gap-2">
          <span className="whitespace-nowrap font-medium text-spice-text-medium">
            {pageLabel}
          </span>
          <input
            type="number"
            min={1}
            max={totalPages > 0 ? totalPages : 1}
            step={1}
            inputMode="numeric"
            aria-label={pageNumberAriaLabel}
            className="h-8 w-14 rounded-md border border-spice-border-mid bg-spice-bg-surface px-2 text-center text-xs font-semibold text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/25"
            value={pageInput}
            onChange={(e) => onPageInputChange(e.target.value)}
            onBlur={onCommitPageInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
          />
          <span className="whitespace-nowrap">
            of{' '}
            <span className="font-semibold text-spice-text-medium">
              {Math.max(totalPages, 1)}
            </span>
          </span>
        </label>

        {hasRows ? (
          <span className="whitespace-nowrap">
            Showing{' '}
            <span className="font-semibold text-spice-text-medium">
              {rangeStart}
            </span>
            –
            <span className="font-semibold text-spice-text-medium">
              {rangeEnd}
            </span>
            {totalItems > 0 ? (
              <>
                {' '}
                of{' '}
                <span className="font-semibold text-spice-text-medium">
                  {totalItems}
                </span>
              </>
            ) : null}
          </span>
        ) : (
          <span>No results on this page</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          className="h-8 px-3 text-xs"
          disabled={!hasPrevPage}
          onClick={onPrevPage}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          className="h-8 px-3 text-xs"
          disabled={!hasNextPage}
          onClick={onNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
