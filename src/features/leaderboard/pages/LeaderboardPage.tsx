import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, SearchInput } from '@/components/ui';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { paths, buildPath } from '@/constants/routes';
import { useGetLeaderboardQuery } from '@/features/chw/api/chwApi';
import { DEFAULT_DASHBOARD_PARAMS } from '@/features/home/constants/supervisorDashboard';
import type { LeaderboardItem } from '@/types/supervisor.types';

type LeaderboardRow = LeaderboardItem & {
  points: number;
  modulesDone: string;
  passRate: number;
  attemptsLabel: string;
  avgScore: number;
  trendValue: string;
};

export const LeaderboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = useGetLeaderboardQuery(
    { ...DEFAULT_DASHBOARD_PARAMS, limit: 50 },
    { selectFromResult: ({ data }) => ({ data }) },
  );

  const rows: LeaderboardRow[] = useMemo(() => {
    return (data?.leaderboard ?? []).map((item) => ({
      ...item,
      points: item.score,
      modulesDone: `${item.completion_rate}/100`,
      passRate: item.completion_rate,
      attemptsLabel: '—',
      avgScore: item.completion_rate,
      trendValue:
        item.trend === 'up' ? '+4%' : item.trend === 'down' ? '-3%' : '0%',
    }));
  }, [data?.leaderboard]);

  const columns: Array<ColumnDef<LeaderboardRow>> = useMemo(
    () => [
      {
        key: 'rank',
        header: '',
        render: (row) => (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-spice-bg-tint text-sm font-semibold text-spice-text-medium ring-1 ring-spice-border">
            {row.rank}
          </div>
        ),
      },
      {
        key: 'name',
        header: 'CHW',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-spice-bg-tint text-[10px] font-semibold text-spice-text-medium ring-1 ring-spice-border">
              {row.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase()}
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
        key: 'points',
        header: 'Points',
        render: (row) => (
          <span className="font-semibold text-spice-text-primary">
            {new Intl.NumberFormat().format(row.points)}
          </span>
        ),
      },
      { key: 'modulesDone', header: 'Modules done' },
      {
        key: 'passRate',
        header: 'Pass rate',
        render: (row) => (
          <span className="font-semibold text-spice-text-primary">
            {row.passRate}%
          </span>
        ),
      },
      {
        key: 'attemptsLabel',
        header: 'Attempts',
        render: (row) => (
          <span className="text-xs text-spice-text-medium">
            {row.attemptsLabel}
          </span>
        ),
      },
      {
        key: 'avgScore',
        header: 'Avg. score',
        render: (row) => (
          <span className="font-semibold text-spice-text-primary">
            {row.avgScore}%
          </span>
        ),
      },
      {
        key: 'trendValue',
        header: 'Trend',
        render: (row) => (
          <span
            className={
              row.trend === 'up'
                ? 'text-xs font-semibold text-spice-semantic-success'
                : row.trend === 'down'
                  ? 'text-xs font-semibold text-spice-semantic-error'
                  : 'text-xs font-semibold text-spice-text-muted'
            }
          >
            {row.trendValue}
          </span>
        ),
      },
      {
        key: 'chw_id',
        header: '',
        className: 'text-right',
        render: (row) => (
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() =>
              navigate(buildPath(paths.chwProfileDetail, { id: row.chw_id }))
            }
          >
            Profile
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-spice-text-primary">
          {t('leaderboard.title')}
        </h1>
        <div className="w-72">
          <SearchInput
            value=""
            onChange={() => undefined}
            placeholder="Search modules..."
          />
        </div>
      </div>

      <Card variant="elevated" className="p-0">
        <div className="p-6">
          <Table<LeaderboardRow>
            data={rows}
            columns={columns}
            keyExtractor={(r) => String(r.rank)}
            caption="Leaderboard"
          />
        </div>
      </Card>
    </section>
  );
};
