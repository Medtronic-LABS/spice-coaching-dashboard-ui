import { Button, Card, SectionHeader, StatusBadge } from '@/components/ui';
import Table from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { statusToBadge } from '@/features/home/utils/supervisorBadges';
import type { CHWPerformanceRow } from '@/types/supervisor.types';
import { useMemo } from 'react';

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
          return (
            <span className="text-left flex flex-col text-xl font-bold">
              {`${row.modules_done}/${row.modules_total}`}
              <span className="text-left text-xs font-normal">{`${row.modules_total - row.modules_done === 0 ? 'All Completed' : `${row.modules_total - row.modules_done} remaining`}`}</span>
            </span>
          );
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
        key: 'quiz_passed',
        header: 'Pass/Fail',
        render: (row) => {
          return (
            <span className="text-left flex flex-col text-xl font-bold">
              {`${((row.quiz_passed / (row.quiz_failed + row.quiz_passed)) * 100).toFixed(2)}%`}
              <span className="text-left text-xs font-normal">{`${row.quiz_failed + row.quiz_passed} attempted - ${row.quiz_failed} fails`}</span>
            </span>
          );
        },
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
      <Table<CHWPerformanceRow>
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.chw_id}
        caption={title}
      />
    </Card>
  );
};
