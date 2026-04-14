import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Table, { type ColumnDef } from '.';

interface TestData extends Record<string, unknown> {
  id: string;
  name: string;
}

const columns: ColumnDef<TestData>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
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
});
