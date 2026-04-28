import { useTranslation } from 'react-i18next';
import { Button, Card, SearchInput, StatCard } from '@/components/ui';
import { useGetReportsQuery } from '@/features/reports/api/reportsApi';
import { DEFAULT_DASHBOARD_PARAMS } from '@/features/home/constants/supervisorDashboard';
import type { ReportCard } from '@/features/reports/types/reports.types';

export const ReportsPage = () => {
  const { t } = useTranslation();
  const { data } = useGetReportsQuery(DEFAULT_DASHBOARD_PARAMS, {
    selectFromResult: ({ data }) => ({ data }),
  });

  const available: ReportCard[] = data?.available ?? [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          {t('reports.title')}
        </h1>
        <div className="w-72">
          <SearchInput
            value=""
            onChange={() => undefined}
            placeholder="Search modules..."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Active CHWs"
          value={data?.stats.activeChws ?? 0}
          supportingText={data?.stats.locationLabel ?? ''}
        />
        <StatCard
          label="Modules Published"
          value={data?.stats.modulesPublished ?? 0}
          supportingText={`${data?.stats.modulesTotal ?? 0} total (${data?.stats.modulesDrafts ?? 0} drafts)`}
        />
        <StatCard
          label="Overall Pass Rate"
          value={data?.stats.overallPassRateLabel ?? '0%'}
          supportingText={data?.stats.overallPassRateMeta ?? ''}
        />
        <StatCard
          label="Avg. Completion"
          value={data?.stats.avgCompletionLabel ?? '0%'}
          supportingText={data?.stats.avgCompletionMeta ?? ''}
        />
      </div>

      <Card variant="elevated">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Available Reports
            </h3>
            <p className="text-sm text-slate-500">
              Download or preview reports for your Upazila
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {available.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  {r.title}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {r.description}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>{r.cadenceLabel}</span>
                  <span>{r.formatsLabel}</span>
                </div>
              </div>
              <Button className="h-9 px-4" onClick={() => undefined}>
                {r.actionLabel}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h4 className="text-sm font-semibold text-slate-900">
            Generate Custom Report
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Create a custom report with specific date range and filters
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(data?.customCards ?? []).map((c) => (
              <button
                key={c.title}
                type="button"
                onClick={() => undefined}
                className="rounded-2xl bg-white p-6 text-left ring-1 ring-slate-200/70 transition hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {c.title}
                </div>
                <div className="mt-2 text-xs text-slate-500">{c.subtitle}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
};
