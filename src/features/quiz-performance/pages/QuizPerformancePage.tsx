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
import { paths } from '@/constants/routes';
import { useGetQuizPerformanceQuery } from '@/features/quiz-performance/api/quizPerformanceApi';
import { DEFAULT_DASHBOARD_PARAMS } from '@/features/home/constants/supervisorDashboard';
import type {
  QuizByChwRow,
  QuizByModuleRow,
  QuizQuestionRow,
} from '@/features/quiz-performance/types/quizPerformance.types';

const pill = (label: string) => (
  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
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
  const questions: QuizQuestionRow[] = data?.questions ?? [];

  const filteredQuestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((x) =>
      `${x.question} ${x.module}`.toLowerCase().includes(q),
    );
  }, [query, questions]);

  const moduleColumns: Array<ColumnDef<QuizByModuleRow>> = useMemo(
    () => [
      {
        key: 'module',
        header: 'Module',
        render: (row) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">
              {row.module}
            </div>
            <div className="text-xs text-slate-500">{row.category}</div>
          </div>
        ),
      },
      {
        key: 'passRate',
        header: 'Pass rate',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-36 rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-blue-700"
                style={{
                  width: `${Math.max(0, Math.min(100, row.passRate))}%`,
                }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-900">
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
          <span className="font-semibold text-slate-900">{row.avgScore}%</span>
        ),
      },
      {
        key: 'trendValue',
        header: 'Trend',
        render: (row) => (
          <span
            className={
              row.trend === 'up'
                ? 'text-xs font-semibold text-emerald-700'
                : row.trend === 'down'
                  ? 'text-xs font-semibold text-red-700'
                  : 'text-xs font-semibold text-slate-500'
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
        <h1 className="text-2xl font-semibold text-slate-900">
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
            />
          </div>

          <Card variant="elevated">
            <div className="mb-4">
              <div className="text-sm font-semibold text-slate-900">
                Pass Rate by Module
              </div>
              <div className="text-xs text-slate-500">
                Across all 30 CHWs • Sylhet Sadar
              </div>
            </div>
            <Table<QuizByModuleRow>
              data={byModule}
              columns={moduleColumns}
              keyExtractor={(r) => r.module}
              caption="Pass rate by module"
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card variant="elevated">
              <div className="mb-4 text-sm font-semibold text-slate-900">
                CHW Pass Rate
              </div>
              <div className="space-y-3">
                {byChw.map((c) => (
                  <button
                    key={c.chw_id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `${paths.chwProfiles}/${encodeURIComponent(c.chw_id)}`,
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
                        {c.name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-slate-900">
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-500">{c.chw_id}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">
                        {c.passRate}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {c.attempts} attempts
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card variant="elevated">
              <div className="mb-4 text-sm font-semibold text-slate-900">
                Most Failed Questions
              </div>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">{q.module}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {q.question}
                        </div>
                      </div>
                      <Badge className="bg-red-50 text-red-700 ring-1 ring-red-100">
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
            />
            <StatCard
              label="Below 70% Pass Rate"
              value={data?.stats.chwsBelow70 ?? 0}
              supportingText="need attention"
            />
            <StatCard
              label="Highest Pass Rate"
              value={`${data?.stats.highestPassRatePct ?? 0}%`}
              supportingText={data?.stats.highestPassRateChwName ?? ''}
            />
          </div>
          <Card variant="elevated">
            <div className="mb-4 text-sm font-semibold text-slate-900">
              Pass Rate by Module
            </div>
            <Table<QuizByModuleRow>
              data={byModule}
              columns={moduleColumns}
              keyExtractor={(r) => r.module}
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
            />
            <StatCard
              label="Most Failed Module"
              value={data?.stats.mostFailedModule ?? ''}
              supportingText="68% avg fail on Q1"
            />
            <StatCard
              label="Free Text Completion"
              value={`${data?.stats.freeTextCompletionPct ?? 0}%`}
              supportingText="avg score on open answers"
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
                      <span className="text-xs text-slate-500">{q.module}</span>
                      <Badge className="bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                        {q.typeLabel}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {q.question}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {q.failRate}%
                    </div>
                    <div className="text-xs text-slate-500">fail rate</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {q.answers.map((a) => (
                    <div key={a.label} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span
                          className={
                            a.isCorrect
                              ? 'font-semibold text-emerald-700'
                              : 'text-slate-700'
                          }
                        >
                          {a.label}
                        </span>
                        <span className="text-slate-500">{a.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full ${a.isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{
                            width: `${Math.max(0, Math.min(100, a.pct))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
                  <div className="text-xs text-slate-600">{q.note}</div>
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
