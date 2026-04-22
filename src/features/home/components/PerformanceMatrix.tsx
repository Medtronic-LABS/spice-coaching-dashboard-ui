import { Button, Card, SectionHeader, StatusBadge } from '@/components/ui';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { statusToBadge } from '@/features/home/utils/supervisorBadges';
import type { CHWPerformanceRow } from '@/types/supervisor.types';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface PerformanceMatrixProps {
  title?: string;
  subtitle?: string;
  rows: CHWPerformanceRow[];
  onRowClick?: (row: CHWPerformanceRow) => void;
}

export const PerformanceMatrix = ({
  title,
  subtitle,
  rows,
  onRowClick,
}: PerformanceMatrixProps) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('home.performanceMatrix.title');

  const columns: Array<ColumnDef<CHWPerformanceRow>> = useMemo(
    () => [
      { key: 'name', header: t('home.performanceMatrix.columns.name') },
      {
        key: 'modules_done',
        header: t('home.performanceMatrix.columns.modulesDone'),
        className: 'text-right',
        render: (row) => {
          const remainingCount = row.modules_total - row.modules_done;
          const remainingLabel =
            remainingCount === 0
              ? t('home.performanceMatrix.allCompleted')
              : t('home.performanceMatrix.remaining', {
                  count: remainingCount,
                });

          return (
            <span className="text-left flex flex-col text-xl font-bold">
              {`${row.modules_done}/${row.modules_total}`}
              <span className="text-left text-xs font-normal">
                {remainingLabel}
              </span>
            </span>
          );
        },
      },
      {
        key: 'deadline_status',
        header: t('home.performanceMatrix.columns.deadlineStatus'),
        render: (row) => {
          const mapped = statusToBadge(row.deadline_status);
          return <StatusBadge status={mapped.badge} label={mapped.label} />;
        },
      },
      {
        key: 'quiz_passed',
        header: t('home.performanceMatrix.columns.passFail'),
        render: (row) => {
          const attempted = row.quiz_failed + row.quiz_passed;
          const pct =
            attempted === 0
              ? '0.00'
              : ((row.quiz_passed / attempted) * 100).toFixed(2);

          return (
            <span className="text-left flex flex-col text-xl font-bold">
              {`${pct}%`}
              <span className="text-left text-xs font-normal">
                {t('home.performanceMatrix.attemptedFails', {
                  attempted,
                  fails: row.quiz_failed,
                })}
              </span>
            </span>
          );
        },
      },
      {
        key: 'overall_status',
        header: t('home.performanceMatrix.columns.overallStatus'),
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
            {t('common.view')}
          </Button>
        ),
      },
    ],
    [onRowClick, t],
  );

  return (
    <Card variant="elevated">
      <SectionHeader title={resolvedTitle} subtitle={subtitle} />
      <Table<CHWPerformanceRow>
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.chw_id}
        caption={resolvedTitle}
      />
    </Card>
  );
};
