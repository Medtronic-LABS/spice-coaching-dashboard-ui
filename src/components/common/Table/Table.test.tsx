import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Table, type ColumnDef } from '.';

interface TestData extends Record<string, unknown> {
  id: string;
  name: string;
}

const columns: ColumnDef<TestData>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name', sortable: true },
];

describe('Table', () => {
  it('renders correctly with data', () => {
    const data: TestData[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];

    render(
      <Table
        data={data}
        columns={columns}
        keyExtractor={(item) => String(item.id)}
      />,
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders an empty state when data is empty', () => {
    render(
      <Table
        data={[]}
        columns={columns}
        keyExtractor={(item) => String(item.id)}
        emptyMessage="No items found"
      />,
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('applies independent header and cell alignment classes', () => {
    const alignedColumns: ColumnDef<TestData>[] = [
      {
        key: 'name',
        header: 'Name',
        headerClassName: 'text-center',
        className: 'text-right',
      },
    ];

    render(
      <Table
        data={[{ id: '1', name: 'Alice' }]}
        columns={alignedColumns}
        keyExtractor={(item) => item.id}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass(
      'text-center',
    );
    expect(screen.getByText('Alice').closest('td')).toHaveClass('text-right');
  });

  it('triggers onSort when sortable column header is clicked', () => {
    const onSortMock = vi.fn();
    render(
      <Table
        data={[{ id: '1', name: 'Alice' }]}
        columns={columns}
        keyExtractor={(item) => item.id}
        onSort={onSortMock}
      />,
    );

    const nameHeader = screen.getByRole('button', { name: /name/i });
    nameHeader.click();
    expect(onSortMock).toHaveBeenCalledWith('name', 'asc');
  });

  it('toggles direction to desc when active asc column header is clicked', () => {
    const onSortMock = vi.fn();
    render(
      <Table
        data={[{ id: '1', name: 'Alice' }]}
        columns={columns}
        keyExtractor={(item) => item.id}
        sortBy="name"
        sortDir="asc"
        onSort={onSortMock}
      />,
    );

    const nameHeader = screen.getByRole('button', { name: /name/i });
    nameHeader.click();
    expect(onSortMock).toHaveBeenCalledWith('name', 'desc');
  });
});
