import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { Card } from '@/components/ui';
import { useGetProgramChwRosterQuery } from '@/features/program-manager/api/programManagerApi';

type Row = {
  id: string;
  name: string;
  supervisor: string;
  modules: string;
  passRate: string;
  status: string;
};

export const ChwRosterPage = () => {
  const { data } = useGetProgramChwRosterQuery();
  const columns: Array<ColumnDef<Row>> = [
    { key: 'name', header: 'CHW', render: (row) => `${row.name} (${row.id})` },
    { key: 'supervisor', header: 'Supervisor' },
    { key: 'modules', header: 'Modules' },
    { key: 'passRate', header: 'Pass Rate' },
    { key: 'status', header: 'Status' },
  ];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-spice-text-primary">
        CHW Roster
      </h1>
      <Card variant="elevated">
        <Table<Row>
          data={data?.rows ?? []}
          columns={columns}
          keyExtractor={(row) => row.id}
          caption="CHW roster"
          emptyMessage="No CHWs found."
        />
      </Card>
    </section>
  );
};
