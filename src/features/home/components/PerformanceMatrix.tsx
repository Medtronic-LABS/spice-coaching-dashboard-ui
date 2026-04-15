import { Button, Card, SectionHeader, StatusBadge } from '@/components/ui';
import Table from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import type {
  CHWPerformanceRow,
  SupervisorStatus,
} from '@/types/supervisor.types';
import { useMemo } from 'react';

type BadgeStatus = 'success' | 'warning' | 'critical' | 'info' | 'neutral';

function statusToBadge(status: SupervisorStatus | 'in_progress'): {
  badge: BadgeStatus;
  label: string;
} {
  switch (status) {
    case 'on_track':
      return { badge: 'success', label: 'On track' };
    case 'due_soon':
      return { badge: 'warning', label: 'Due soon' };
    case 'delayed':
      return { badge: 'critical', label: 'Delayed' };
    case 'inactive':
      return { badge: 'neutral', label: 'Inactive' };
    case 'in_progress':
      return { badge: 'info', label: 'In progress' };
    default:
      return { badge: 'neutral', label: 'Unknown' };
  }
}

export interface PerformanceMatrixProps {
  title?: string;
  subtitle?: string;
  rows: CHWPerformanceRow[];
  onRowClick?: (row: CHWPerformanceRow) => void;
}

export const PerformanceMatrix = ({
  title = 'Performance matrix',
  subtitle,
  rows,
  onRowClick,
}: PerformanceMatrixProps) => {
  const columns: Array<ColumnDef<CHWPerformanceRow>> = useMemo(
    () => [
      { key: 'name', header: 'Name' },
      {
        key: 'modules_done',
        header: 'Modules done',
        className: 'text-right',
        render: (row) => {
          return `${row.modules_done}/${row.modules_total}`;
        },
      },
      {
        key: 'deadline_status',
        header: 'Deadline status',
        render: (row) => {
          const mapped = statusToBadge(row.deadline_status);
          return <StatusBadge status={mapped.badge} label={mapped.label} />;
        },
      },
      {
        key: 'pass_count',
        header: 'Pass/Fail',
        render: (row) => `${row.pass_count}/${row.fail_count}`,
        className: 'text-right',
      },
      {
        key: 'overall_status',
        header: 'Overall status',
        render: (row) => {
          const mapped = statusToBadge(row.overall_status);
          return <StatusBadge status={mapped.badge} label={mapped.label} />;
        },
      },
      {
        key: 'chw_id',
        header: '',
        className: 'text-right',
        render: (row) => (
          <Button
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              onRowClick?.(row);
            }}
            disabled={!onRowClick}
          >
            View
          </Button>
        ),
      },
    ],
    [onRowClick],
  );

  return (
    <Card variant="elevated">
      <SectionHeader title={title} subtitle={subtitle} />
      <Table
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.chw_id}
        caption={title}
      />
    </Card>
  );
};
