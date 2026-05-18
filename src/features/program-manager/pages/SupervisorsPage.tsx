import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { Button, Card, SearchInput } from '@/components/ui';
import { paths } from '@/constants/routes';
import { useGetProgramSupervisorsQuery } from '@/features/program-manager/api/programManagerApi';

type Row = {
  id: string;
  name: string;
  location: string;
  chws: number;
  completionRate: number;
  passRate: number;
  flags: number;
};

export const SupervisorsPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data } = useGetProgramSupervisorsQuery();

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source = data?.supervisors ?? [];
    if (!normalized) return source;
    return source.filter((item) =>
      `${item.name} ${item.location}`.toLowerCase().includes(normalized),
    );
  }, [data?.supervisors, query]);

  const columns: Array<ColumnDef<Row>> = [
    { key: 'name', header: 'Supervisor', render: (row) => row.name },
    { key: 'location', header: 'Location' },
    { key: 'chws', header: 'CHWs' },
    {
      key: 'completionRate',
      header: 'Completion',
      render: (row) => `${row.completionRate}%`,
    },
    {
      key: 'passRate',
      header: 'Pass Rate',
      render: (row) => `${row.passRate}%`,
    },
    { key: 'flags', header: 'Flags' },
    {
      key: 'id',
      header: '',
      className: 'text-right',
      render: (row) => (
        <Button
          variant="ghost"
          onClick={() =>
            navigate(paths.supervisorDetail.replace(':id', row.id))
          }
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-spice-text-primary">
          Supervisors
        </h1>
        <div className="w-72">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search supervisors..."
          />
        </div>
      </div>
      <Card variant="elevated">
        <Table<Row>
          data={rows}
          columns={columns}
          keyExtractor={(row) => row.id}
          caption="Supervisor list"
          emptyMessage="No supervisors found."
        />
      </Card>
    </section>
  );
};
