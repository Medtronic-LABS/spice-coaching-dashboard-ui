import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { Card } from '@/components/ui';
import { useGetProgramRankingsQuery } from '@/features/program-manager/api/programManagerApi';

type Row = {
  id: string;
  supervisor: string;
  completionRate: string;
  passRate: string;
  flags: string;
  rank: string;
};

export const RankingsPage = () => {
  const { data } = useGetProgramRankingsQuery();
  const columns: Array<ColumnDef<Row>> = [
    { key: 'supervisor', header: 'Supervisor' },
    { key: 'completionRate', header: 'Completion' },
    { key: 'passRate', header: 'Pass Rate' },
    { key: 'flags', header: 'Flags' },
    { key: 'rank', header: 'Rank' },
  ];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-spice-text-primary">
        Rankings
      </h1>
      <Card variant="elevated">
        <Table<Row>
          data={data?.rows ?? []}
          columns={columns}
          keyExtractor={(row) => row.id}
          caption="Supervisor rankings"
          emptyMessage="No rankings found."
        />
      </Card>
    </section>
  );
};
