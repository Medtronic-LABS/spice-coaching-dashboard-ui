import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { Card } from '@/components/ui';
import { useGetProgramEscalationsQuery } from '@/features/program-manager/api/programManagerApi';

type Row = {
  id: string;
  chwName: string;
  supervisor: string;
  reason: string;
  severity: 'High' | 'Medium' | 'Low';
  updatedAt: string;
};

export const EscalationsPage = () => {
  const { data } = useGetProgramEscalationsQuery();
  const columns: Array<ColumnDef<Row>> = [
    { key: 'chwName', header: 'CHW' },
    { key: 'supervisor', header: 'Supervisor' },
    { key: 'reason', header: 'Reason' },
    { key: 'severity', header: 'Severity' },
    { key: 'updatedAt', header: 'Updated' },
  ];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-spice-text-primary">
        Escalations
      </h1>
      <Card variant="elevated">
        <Table<Row>
          data={data?.rows ?? []}
          columns={columns}
          keyExtractor={(row) => row.id}
          caption="Escalations"
          emptyMessage="No escalations found."
        />
      </Card>
    </section>
  );
};
