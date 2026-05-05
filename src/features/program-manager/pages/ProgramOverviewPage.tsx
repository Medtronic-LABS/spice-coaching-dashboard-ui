import { useNavigate } from 'react-router-dom';
import { Button, Card, StatCard } from '@/components/ui';
import { paths } from '@/constants/routes';
import { useGetProgramOverviewQuery } from '@/features/program-manager/api/programManagerApi';

export const ProgramOverviewPage = () => {
  const navigate = useNavigate();
  const { data } = useGetProgramOverviewQuery();

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-spice-text-primary">
          Program Overview
        </h1>
        <Button variant="secondary" className="h-9 px-4">
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {(data?.kpis ?? []).map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            supportingText={kpi.meta}
          />
        ))}
      </div>

      <Card
        variant="elevated"
        className="flex items-center justify-between gap-3"
      >
        <div>
          <div className="text-xs font-semibold tracking-wider text-spice-brand-primary">
            {data?.insight.title}
          </div>
          <div className="mt-1 text-sm text-spice-text-medium">
            {data?.insight.description}
          </div>
        </div>
        <Button variant="secondary">
          {data?.insight.actionLabel ?? 'View'}
        </Button>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {(data?.supervisors ?? []).map((supervisor) => (
          <Card
            key={supervisor.id}
            variant="elevated"
            className="space-y-4 border border-spice-border"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-spice-bg-tint text-sm font-semibold text-spice-brand-primary ring-1 ring-spice-border">
                  {supervisor.initials}
                </div>
                <div>
                  <div className="font-semibold text-spice-text-primary">
                    {supervisor.name}
                  </div>
                  <div className="text-xs text-spice-text-muted">
                    {supervisor.chws} CHWs
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-spice-text-medium">
                #{supervisor.rank}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-sm font-semibold text-spice-text-primary">
                  {supervisor.completionRate}%
                </div>
                <div className="text-[11px] text-spice-text-muted">
                  Completion
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-spice-text-primary">
                  {supervisor.passRate}%
                </div>
                <div className="text-[11px] text-spice-text-muted">
                  Pass Rate
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-spice-text-primary">
                  {supervisor.flags}
                </div>
                <div className="text-[11px] text-spice-text-muted">Flags</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-spice-text-primary">
                  {supervisor.chws}
                </div>
                <div className="text-[11px] text-spice-text-muted">CHWs</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div
                className={
                  supervisor.trendDirection === 'up'
                    ? 'text-xs font-semibold text-spice-semantic-success'
                    : 'text-xs font-semibold text-spice-semantic-error'
                }
              >
                {supervisor.trend}
              </div>
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(paths.supervisorDetail.replace(':id', supervisor.id))
                }
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
