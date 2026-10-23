import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TablePagination } from '@/components/common/TablePagination';
import { maxDigitsForLimit } from '@/utils/digitLimitedInteger';

const PAGE_SIZE_OPTIONS = [5, 10] as const;

function PaginationHarness({ totalPages }: { totalPages: number }) {
  const [pageInput, setPageInput] = useState('1');

  return (
    <TablePagination
      page={0}
      pageSize={5}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      totalItems={totalPages * 5}
      totalPages={totalPages}
      rangeStart={1}
      rangeEnd={5}
      pageInput={pageInput}
      hasPrevPage={false}
      hasNextPage={totalPages > 1}
      onPageSizeChange={vi.fn()}
      onPageInputChange={setPageInput}
      onCommitPageInput={vi.fn()}
      onPrevPage={vi.fn()}
      onNextPage={vi.fn()}
    />
  );
}

describe('TablePagination', () => {
  it('caps page digits to the total-pages budget', () => {
    render(<PaginationHarness totalPages={5} />);

    const input = screen.getByLabelText('Page number');
    expect(input).toHaveAttribute('maxLength', String(maxDigitsForLimit(5)));

    fireEvent.change(input, { target: { value: '12' } });
    expect(input).toHaveValue('1');
  });

  it('ignores a page after the digit cap that is still out of range', () => {
    render(<PaginationHarness totalPages={5} />);

    const input = screen.getByLabelText('Page number');
    fireEvent.change(input, { target: { value: '99' } });
    expect(input).toHaveValue('1');
  });

  it('keeps two-digit pages when the table has them', () => {
    render(<PaginationHarness totalPages={20} />);

    const input = screen.getByLabelText('Page number');
    expect(input).toHaveAttribute('maxLength', String(maxDigitsForLimit(20)));

    fireEvent.change(input, { target: { value: '12' } });
    expect(input).toHaveValue('12');

    fireEvent.change(input, { target: { value: '21' } });
    expect(input).toHaveValue('12');
  });

  it('renders icon pagination controls with accessible labels', () => {
    render(<PaginationHarness totalPages={3} />);

    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });
});
