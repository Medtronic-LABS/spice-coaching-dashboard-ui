import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  SectionHeader,
  Button,
  StatusBadge,
  SearchInput,
  Badge,
} from '@/components/ui';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { paths, buildPath } from '@/constants/routes';
import { useGetChwProfilesListQuery } from '@/features/chw-profiles/api/chwProfilesApi';
import type { ChwProfilesListRow } from '@/features/chw-profiles/types/chwProfiles.types';
import {
  deadlineStatusToTone,
  overallStatusToTone,
} from '@/features/chw-profiles/utils/chwProfilesBadges';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${second}`.toUpperCase();
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

export const ChwProfilesListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data, isLoading, isError, refetch } = useGetChwProfilesListQuery({
    page: 1,
    limit: 30,
  });

  const filteredRows = useMemo(() => {
    const rows = data?.data ?? [];
    const q = normalizeQuery(query);
    if (!q) return rows;
    return rows.filter((row) => {
      const haystack = `${row.name} ${row.chw_id}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [data?.data, query]);

  const columns: Array<ColumnDef<ChwProfilesListRow>> = useMemo(
    () => [
      {
        key: 'name',
        header: t('chwProfiles.list.columns.chw'),
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-spice-bg-tint text-xs font-semibold text-spice-text-medium ring-1 ring-spice-border">
              {getInitials(row.name)}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-spice-text-primary">
                {row.name}
              </div>
              <div className="text-xs text-spice-text-muted">{row.chw_id}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'modules_done',
        header: t('chwProfiles.list.columns.modulesDone'),
        render: (row) => {
          const remainingCount = row.modules_total - row.modules_done;
          const remainingLabel =
            remainingCount === 0
              ? t('home.performanceMatrix.allCompleted')
              : t('home.performanceMatrix.remaining', {
                  count: remainingCount,
                });

          return (
            <span className="flex flex-col text-xl font-bold text-spice-text-primary">
              {`${row.modules_done}/${row.modules_total}`}
              <span className="text-xs font-normal text-spice-text-muted">
                {remainingLabel}
              </span>
            </span>
          );
        },
      },
      {
        key: 'deadline_status',
        header: t('chwProfiles.list.columns.deadline'),
        render: (row) => {
          const mapped = deadlineStatusToTone(row.deadline_status);
          return <StatusBadge status={mapped.tone} label={mapped.label} />;
        },
      },
      {
        key: 'pass_rate',
        header: t('chwProfiles.list.columns.passRate'),
        render: (row) => {
          const attempted = row.quiz_passed + row.quiz_failed;
          return (
            <span className="flex flex-col text-xl font-bold text-spice-text-primary">
              {`${(attempted > 0 ? (row.quiz_passed / attempted) * 100 : 0).toFixed(2)}%`}
              <span className="text-xs font-normal text-spice-text-muted">
                {t('chwProfiles.list.attempts', { count: attempted })}
              </span>
            </span>
          );
        },
      },
      {
        key: 'streak',
        header: t('chwProfiles.list.columns.streak'),
        render: (row) => (
          <span className="text-sm font-semibold text-spice-text-primary">
            {t('chwProfiles.list.daysShort', { count: row.streak })}
          </span>
        ),
      },
      {
        key: 'last_active',
        header: t('chwProfiles.list.columns.lastActive'),
        render: (row) => (
          <span className="text-sm text-spice-text-medium">
            {row.last_active}
          </span>
        ),
      },
      {
        key: 'overall_status',
        header: t('chwProfiles.list.columns.status'),
        render: (row) => {
          const mapped = overallStatusToTone(row.overall_status);
          if (mapped.outlined) {
            return (
              <Badge className="bg-transparent text-spice-semantic-error ring-1 ring-inset ring-spice-semantic-error/35">
                {mapped.label}
              </Badge>
            );
          }
          return <StatusBadge status={mapped.tone} label={mapped.label} />;
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
              navigate(buildPath(paths.chwProfileDetail, { id: row.chw_id }));
            }}
          >
            {t('common.view')}
          </Button>
        ),
      },
    ],
    [navigate, t],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-spice-text-primary">
            {t('chwProfiles.list.title')}
          </h2>
          <p className="text-sm text-spice-text-muted">
            {t('chwProfiles.list.subtitle')}
          </p>
        </div>
        <div className="w-full sm:w-72">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t('chwProfiles.list.searchPlaceholder')}
          />
        </div>
      </div>

      <Card variant="elevated">
        <SectionHeader
          title={t('chwProfiles.list.tableTitle')}
          action={
            isError ? (
              <Button variant="secondary" onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            ) : null
          }
        />
        {isLoading ? (
          <div className="rounded-lg border border-spice-border bg-spice-bg-surface p-6 text-sm text-spice-text-medium">
            {t('common.loading')}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-spice-semantic-error/25 bg-spice-semantic-errorBg p-6 text-sm text-spice-semantic-error">
            {t('common.somethingWentWrong')}
          </div>
        ) : (
          <Table<ChwProfilesListRow>
            data={filteredRows}
            columns={columns}
            keyExtractor={(row) => row.chw_id}
            caption={t('chwProfiles.list.tableTitle')}
            emptyMessage={t('chwProfiles.list.empty')}
          />
        )}
      </Card>
    </section>
  );
};
