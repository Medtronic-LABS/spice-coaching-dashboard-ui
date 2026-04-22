import {
  Button,
  Card,
  SearchInput,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { statusToBadge } from '@/features/home/utils/supervisorBadges';
import type { CHWPerformanceRow } from '@/types/supervisor.types';
import { useMemo, useState } from 'react';
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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'flagged' | 'overdue'>('all');

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery = q.length === 0 || row.name.toLowerCase().includes(q);
      const isOverdue = row.deadline_status === 'delayed';
      const isFlagged =
        row.overall_status === 'delayed' || row.deadline_status === 'delayed';

      const matchesFilter =
        filter === 'all' ? true : filter === 'overdue' ? isOverdue : isFlagged;

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, rows]);

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
            <span className="flex flex-col text-sm font-semibold text-slate-900">
              {`${row.modules_done}/${row.modules_total}`}
              <span className="text-xs font-normal text-slate-500">
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
            <span className="flex flex-col text-sm font-semibold text-slate-900">
              {`${pct}%`}
              <span className="text-xs font-normal text-slate-500">
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t('home.dashboard.performance.searchPlaceholder')}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          {(
            [
              {
                value: 'all',
                label: t('home.dashboard.performance.filters.all'),
              },
              {
                value: 'flagged',
                label: t('home.dashboard.performance.filters.flagged'),
              },
              {
                value: 'overdue',
                label: t('home.dashboard.performance.filters.overdue'),
              },
            ] as const
          ).map((item) => {
            const isActive = item.value === filter;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={[
                  'h-8 rounded-full px-3 text-xs font-semibold ring-1 transition',
                  isActive
                    ? 'bg-blue-50 text-blue-700 ring-blue-200'
                    : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
                ].join(' ')}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <Table<CHWPerformanceRow>
        data={filteredRows}
        columns={columns}
        keyExtractor={(row) => row.chw_id}
        caption={resolvedTitle}
      />
    </Card>
  );
};
