import { useParams } from 'react-router-dom';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { Card, StatCard } from '@/components/ui';
import { useGetProgramSupervisorDetailQuery } from '@/features/program-manager/api/programManagerApi';
import type {
  SupervisorModuleRow,
  SupervisorPerformanceRow,
} from '@/features/program-manager/types/programManager.types';

export const SupervisorDetailPage = () => {
  const { id = '' } = useParams();
  const { data } = useGetProgramSupervisorDetailQuery(id);

  const performanceColumns: Array<ColumnDef<SupervisorPerformanceRow>> = [
    {
      key: 'name',
      header: 'CHW',
      render: (row) => `${row.name} (${row.chwId})`,
    },
    { key: 'modulesDone', header: 'Modules' },
    { key: 'passRate', header: 'Pass Rate' },
    { key: 'status', header: 'Status' },
  ];

  const moduleColumns: Array<ColumnDef<SupervisorModuleRow>> = [
    { key: 'module', header: 'Module' },
    { key: 'completed', header: 'Completed' },
    { key: 'passRate', header: 'Pass Rate' },
    { key: 'overdue', header: 'Overdue' },
  ];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-spice-text-primary">
        {data?.name ?? 'Supervisor'}
      </h1>
      <div className="grid gap-4 md:grid-cols-4">
        {(data?.stats ?? []).map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            supportingText={stat.meta}
          />
        ))}
      </div>

      <Card variant="elevated" className="space-y-3">
        <h2 className="text-sm font-semibold text-spice-text-primary">
          CHWs Under This Supervisor
        </h2>
        <Table<SupervisorPerformanceRow>
          data={data?.performanceRows ?? []}
          columns={performanceColumns}
          keyExtractor={(row) => row.chwId}
          caption="CHW performance"
          emptyMessage="No CHWs found."
        />
      </Card>

      <Card variant="elevated" className="space-y-3">
        <h2 className="text-sm font-semibold text-spice-text-primary">
          Module Completion Under This Supervisor
        </h2>
        <Table<SupervisorModuleRow>
          data={data?.moduleRows ?? []}
          columns={moduleColumns}
          keyExtractor={(row) => row.module}
          caption="Module completion"
          emptyMessage="No modules found."
        />
      </Card>
    </section>
  );
};
