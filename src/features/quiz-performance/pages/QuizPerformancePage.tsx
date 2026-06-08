import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  SearchInput,
  StatCard,
  Tabs,
} from '@/components/ui';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import { paths, buildPath } from '@/constants/routes';
import { useGetQuizPerformanceQuery } from '@/features/quiz-performance/api/quizPerformanceApi';
import { DEFAULT_DASHBOARD_PARAMS } from '@/features/home/constants/supervisorDashboard';
import type {
  QuizByChwRow,
  QuizByModuleRow,
  QuizQuestionRow,
} from '@/features/quiz-performance/types/quizPerformance.types';

const pill = (label: string) => (
  <span className="inline-flex items-center rounded-full bg-spice-bg-tint px-2.5 py-1 text-xs font-medium text-spice-text-medium ring-1 ring-spice-border">
    {label}
  </span>
);

export const QuizPerformancePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'module' | 'chw' | 'question'>('module');
  const [query, setQuery] = useState('');

  const { data } = useGetQuizPerformanceQuery(DEFAULT_DASHBOARD_PARAMS, {
    selectFromResult: ({ data }) => ({ data }),
  });

  const byModule: QuizByModuleRow[] = data?.byModule ?? [];
  const byChw: QuizByChwRow[] = data?.byChw ?? [];

  const filteredQuestions = useMemo(() => {
    const questions: QuizQuestionRow[] = data?.questions ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((x) =>
      `${x.question} ${x.module}`.toLowerCase().includes(q),
    );
  }, [data?.questions, query]);

  const moduleColumns: Array<ColumnDef<QuizByModuleRow>> = useMemo(
    () => [
      {
        key: 'module',
        header: 'Module',
        render: (row) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-spice-text-primary">
              {row.module}
            </div>
            <div className="text-xs text-spice-text-muted">{row.category}</div>
          </div>
        ),
      },
      {
        key: 'passRate',
        header: 'Pass rate',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-36 rounded-full bg-spice-bg-tint">
              <div
                className="h-1.5 rounded-full bg-spice-brand-primary"
                style={{
                  width: `${Math.max(0, Math.min(100, row.passRate))}%`,
                }}
              />
            </div>
            <span className="text-sm font-semibold text-spice-text-primary">
              {row.passRate}%
            </span>
          </div>
        ),
      },
      { key: 'attempts', header: 'Attempts' },
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
        key: 'module',
        header: '',
        className: 'text-right',
        render: () => (
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => undefined}
          >
            Details
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-spice-text-primary">
          {t('quizPerformance.title')}
        </h1>
        <div className="w-72">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search modules..."
          />
        </div>
      </div>

      <Tabs
        items={[
          { label: 'By Module', value: 'module' },
          { label: 'By CHW', value: 'chw' },
          { label: 'By Question', value: 'question' },
        ]}
        value={tab}
        onChange={(value) => setTab(value as typeof tab)}
        className="max-w-[460px]"
      />

      {tab === 'module' ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total Attempts"
              value={data?.stats.totalAttempts ?? 0}
              supportingText="across all modules"
            />
            <StatCard
              label="Overall Pass Rate"
              value={`${data?.stats.overallPassRatePct ?? 0}%`}
              supportingText={`${data?.stats.passed ?? 0} passed • ${data?.stats.failed ?? 0} failed`}
              valueClassName="text-spice-brand-primary"
            />
            <StatCard
              label="Avg. Attempts to Pass"
              value={String(data?.stats.avgAttemptsToPass ?? 0)}
              supportingText="per quiz"
            />
            <StatCard
              label="CHWs Below 70%"
              value={data?.stats.chwsBelow70 ?? 0}
              supportingText="need attention"
              valueClassName="text-spice-semantic-error"
            />
          </div>

          <Card variant="elevated">
            <div className="mb-4">
              <div className="text-sm font-semibold text-spice-text-primary">
                Pass Rate by Module
              </div>
              <div className="text-xs text-spice-text-muted">
                Across all 30 CHWs • Sylhet Sadar
              </div>
            </div>
            <Table<QuizByModuleRow>
              data={byModule}
              columns={moduleColumns}
              keyExtractor={(r) => `${r.module}-${r.category}`}
              caption="Pass rate by module"
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card variant="elevated">
              <div className="mb-4 text-sm font-semibold text-spice-text-primary">
                CHW Pass Rate
              </div>
              <div className="space-y-3">
                {byChw.map((c) => (
                  <button
                    key={c.chw_id}
                    type="button"
                    onClick={() =>
                      navigate(
                        buildPath(paths.chwProfileDetail, { id: c.chw_id }),
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-spice-bg-surface px-4 py-3 ring-1 ring-spice-border/70 transition hover:bg-spice-bg-tint"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-spice-bg-tint text-[10px] font-semibold text-spice-text-medium ring-1 ring-spice-border">
                        {c.name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-spice-text-primary">
                          {c.name}
                        </div>
                        <div className="text-xs text-spice-text-muted">
                          {c.chw_id}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-spice-text-primary">
                        {c.passRate}%
                      </div>
                      <div className="text-xs text-spice-text-muted">
                        {c.attempts} attempts
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card variant="elevated">
              <div className="mb-4 text-sm font-semibold text-spice-text-primary">
                Most Failed Questions
              </div>
              <div className="space-y-4">
                {filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl bg-spice-bg-surface p-4 ring-1 ring-spice-border/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-spice-text-muted">
                          {q.module}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-spice-text-primary">
                          {q.question}
                        </div>
                      </div>
                      <Badge className="bg-spice-semantic-errorBg text-spice-semantic-error ring-1 ring-spice-semantic-error/25">
                        {q.failRate}% fail
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {tab === 'chw' ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total CHWs"
              value={data?.stats.totalChws ?? 0}
              supportingText="Sylhet Sadar Upazila"
            />
            <StatCard
              label="Above 70% Pass Rate"
              value={data?.stats.chwsAbove70 ?? 0}
              supportingText="73% of CHWs"
              valueClassName="text-spice-semantic-success"
            />
            <StatCard
              label="Below 70% Pass Rate"
              value={data?.stats.chwsBelow70 ?? 0}
              supportingText="need attention"
              valueClassName="text-spice-semantic-error"
            />
            <StatCard
              label="Highest Pass Rate"
              value={`${data?.stats.highestPassRatePct ?? 0}%`}
              supportingText={data?.stats.highestPassRateChwName ?? ''}
              valueClassName="text-spice-semantic-success"
            />
          </div>
          <Card variant="elevated">
            <div className="mb-4 text-sm font-semibold text-spice-text-primary">
              Pass Rate by Module
            </div>
            <Table<QuizByModuleRow>
              data={byModule}
              columns={moduleColumns}
              keyExtractor={(r) => `${r.module}-${r.category}`}
              caption="Pass rate by module"
            />
          </Card>
        </>
      ) : null}

      {tab === 'question' ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total Questions"
              value={data?.stats.totalQuestions ?? 0}
              supportingText="across 6 modules"
            />
            <StatCard
              label="High Fail Rate (>50%)"
              value={data?.stats.highFailRateQuestions ?? 0}
              supportingText="need content review"
              valueClassName="text-spice-semantic-error"
            />
            <StatCard
              label="Most Failed Module"
              value={data?.stats.mostFailedModule ?? ''}
              supportingText="68% avg fail on Q1"
              valueClassName="text-spice-semantic-error"
            />
            <StatCard
              label="Free Text Completion"
              value={`${data?.stats.freeTextCompletionPct ?? 0}%`}
              supportingText="avg score on open answers"
              valueClassName="text-spice-semantic-success"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {pill('All')}
              {pill('High fail rate')}
              {pill('Hypertension')}
              {pill('Pregnancy')}
            </div>
            <div className="w-72">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search questions..."
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <Card key={q.id} variant="elevated" className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-spice-text-muted">
                        {q.module}
                      </span>
                      <Badge className="bg-spice-bg-tint text-spice-text-medium ring-1 ring-spice-border">
                        {q.typeLabel}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-spice-text-primary">
                      {q.question}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-spice-semantic-error">
                      {q.failRate}%
                    </div>
                    <div className="text-xs text-spice-text-muted">
                      fail rate
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {q.answers.map((a) => (
                    <div key={a.label} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span
                          className={
                            a.isCorrect
                              ? 'font-semibold text-spice-semantic-success'
                              : 'text-spice-text-medium'
                          }
                        >
                          {a.label}
                        </span>
                        <span className="text-spice-text-muted">{a.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-spice-bg-tint">
                        <div
                          className={`h-1.5 rounded-full ${a.isCorrect ? 'bg-spice-semantic-success' : 'bg-spice-semantic-error'}`}
                          style={{
                            width: `${Math.max(0, Math.min(100, a.pct))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-start justify-between gap-3 rounded-xl bg-spice-bg-tint p-4 ring-1 ring-spice-border/70">
                  <div className="text-xs text-spice-text-medium">{q.note}</div>
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={() => undefined}
                  >
                    Edit Lesson
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
};
