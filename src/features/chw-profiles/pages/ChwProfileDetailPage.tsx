import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { useGetChwDetailQuery } from '@/features/chw-profiles/api/chwProfilesApi';
import type {
  ChwModuleProgressItem,
  ChwQuizHistoryItem,
} from '@/features/chw-profiles/types/chwProfiles.types';
import {
  moduleStatusToTone,
  quizStatusToTone,
} from '@/features/chw-profiles/utils/chwProfilesBadges';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${second}`.toUpperCase();
}

export const ChwProfileDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const chwId = params.id;

  const { data, isLoading, isError, refetch } = useGetChwDetailQuery(
    { chwId: chwId ?? '' },
    { skip: !chwId },
  );

  const modulesColumns: Array<ColumnDef<ChwModuleProgressItem>> = useMemo(
    () => [
      { key: 'title', header: t('chwProfiles.detail.modules.columns.title') },
      {
        key: 'status',
        header: t('chwProfiles.detail.modules.columns.status'),
        render: (row) => {
          const mapped = moduleStatusToTone(row.status);
          return <StatusBadge status={mapped.tone} label={mapped.label} />;
        },
      },
      {
        key: 'pass_rate',
        header: t('chwProfiles.detail.modules.columns.passRate'),
        className: 'text-right',
        render: (row) => (
          <span className="font-semibold text-slate-900">{`${row.pass_rate}%`}</span>
        ),
      },
      {
        key: 'attempts',
        header: t('chwProfiles.detail.modules.columns.attempts'),
        className: 'text-right',
      },
      {
        key: 'due_date',
        header: t('chwProfiles.detail.modules.columns.dueDate'),
        className: 'text-right',
      },
    ],
    [t],
  );

  const quizColumns: Array<ColumnDef<ChwQuizHistoryItem>> = useMemo(
    () => [
      { key: 'title', header: t('chwProfiles.detail.quiz.columns.title') },
      {
        key: 'score',
        header: t('chwProfiles.detail.quiz.columns.score'),
        className: 'text-right',
        render: (row) => (
          <span className="font-semibold text-slate-900">{`${row.score}%`}</span>
        ),
      },
      {
        key: 'date',
        header: t('chwProfiles.detail.quiz.columns.date'),
        className: 'text-right',
      },
      {
        key: 'status',
        header: t('chwProfiles.detail.quiz.columns.status'),
        className: 'text-right',
        render: (row) => {
          const mapped = quizStatusToTone(row.status);
          return <StatusBadge status={mapped.tone} label={mapped.label} />;
        },
      },
    ],
    [t],
  );

  if (!chwId) {
    return (
      <ErrorState
        title={t('chwProfiles.detail.missingIdTitle')}
        description={t('chwProfiles.detail.missingIdDescription')}
        action={
          <Button variant="secondary" onClick={() => navigate('/chw-profiles')}>
            {t('chwProfiles.detail.backToList')}
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return <LoadingState label={t('chwProfiles.detail.loading')} />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        title={t('chwProfiles.detail.errorTitle')}
        description={t('common.pleaseTryAgain')}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/chw-profiles')}
            >
              {t('chwProfiles.detail.backToList')}
            </Button>
            <Button onClick={() => refetch()}>{t('common.retry')}</Button>
          </div>
        }
      />
    );
  }

  const performance = data.performance;
  const meta = data.meta;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {t('chwProfiles.detail.title')}
          </h2>
          <p className="text-sm text-slate-500">
            {t('chwProfiles.detail.subtitle')}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/chw-profiles')}>
          {t('chwProfiles.detail.backToList')}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
        <Card variant="elevated" className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700">
              {getInitials(data.name)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-slate-900">
                {data.name}
              </div>
              <div className="text-sm text-slate-500">{data.chw_id}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status="success" label={t('status.onTrack')} />
                <Badge className="bg-yellow-100 text-yellow-800">
                  {t('chwProfiles.detail.streakBadge', {
                    days: performance.application_days,
                  })}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">
                {t('chwProfiles.detail.meta.joined')}
              </span>
              <span className="font-medium text-slate-900">{meta.joined}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">
                {t('chwProfiles.detail.meta.lastActive')}
              </span>
              <span className="font-medium text-slate-900">
                {meta.last_active}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">
                {t('chwProfiles.detail.meta.totalPoints')}
              </span>
              <span className="font-medium text-slate-900">
                {t('chwProfiles.detail.points', { count: meta.total_points })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">
                {t('chwProfiles.detail.meta.leaderboardRank')}
              </span>
              <span className="font-medium text-slate-900">
                #{meta.leaderboard_rank}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">
                {t('chwProfiles.detail.meta.badges')}
              </span>
              <span className="font-medium text-slate-900">
                {t('chwProfiles.detail.badgesCount', { count: meta.badges })}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button onClick={() => {}}>
              {t('chwProfiles.detail.actions.assign')}
            </Button>
            <Button variant="secondary" onClick={() => {}}>
              {t('chwProfiles.detail.actions.flag')}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card variant="bordered" className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-slate-500">
                {t('chwProfiles.detail.metrics.modulesDone')}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {`${performance.modules_completed}/${performance.modules_total}`}
              </p>
              <p className="text-xs text-slate-500">
                {t('chwProfiles.detail.metrics.allComplete')}
              </p>
            </Card>
            <Card variant="bordered" className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-slate-500">
                {t('chwProfiles.detail.metrics.applicationKnowledge')}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {t('chwProfiles.detail.daysValue', {
                  count: performance.application_days,
                })}
              </p>
              <p className="text-xs text-slate-500">
                {t('chwProfiles.detail.metrics.bestLabel')}
              </p>
            </Card>
            <Card variant="bordered" className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-slate-500">
                {t('chwProfiles.detail.metrics.passRate')}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {`${performance.quiz_accuracy}%`}
              </p>
              <p className="text-xs text-slate-500">
                {t('chwProfiles.detail.metrics.accuracyLabel')}
              </p>
            </Card>
            <Card variant="bordered" className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-slate-500">
                {t('chwProfiles.detail.metrics.totalAttempts')}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {performance.total_attempts}
              </p>
              <p className="text-xs text-slate-500">
                {t('chwProfiles.detail.metrics.attemptsLabel')}
              </p>
            </Card>
          </div>

          <Card variant="elevated">
            <SectionHeader title={t('chwProfiles.detail.modules.title')} />
            <Table<ChwModuleProgressItem>
              data={data.modules}
              columns={modulesColumns}
              keyExtractor={(row) => `${row.title}-${row.due_date}`}
              emptyMessage={t('chwProfiles.detail.modules.empty')}
              caption={t('chwProfiles.detail.modules.title')}
            />
          </Card>

          <Card variant="elevated">
            <SectionHeader title={t('chwProfiles.detail.quiz.title')} />
            <Table<ChwQuizHistoryItem>
              data={data.quiz_history}
              columns={quizColumns}
              keyExtractor={(row) => `${row.title}-${row.date}`}
              emptyMessage={t('chwProfiles.detail.quiz.empty')}
              caption={t('chwProfiles.detail.quiz.title')}
            />
          </Card>
        </div>
      </div>
    </section>
  );
};
