import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, LoadingState } from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  useGetModuleDetailQuery,
  useSetClinicallyReviewedMutation,
} from '@/features/module-library/api/adminModulesApi';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';

export const AdminModulePublishStep = () => {
  const navigate = useNavigate();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const { data, isLoading, isFetching, error, refetch } =
    useGetModuleDetailQuery(moduleId, { skip: !moduleId });
  const [setClinicallyReviewed, { isLoading: isPublishing }] =
    useSetClinicallyReviewedMutation();

  if (isLoading && !data) {
    return (
      <Card variant="elevated" className="p-10">
        <LoadingState label="Loading module…" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card variant="elevated" className="space-y-3 p-6">
        <p className="text-sm text-spice-semantic-error">
          {error ? formatRtkQueryError(error) : 'Module not found.'}
        </p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const busy = isFetching || isPublishing;

  return (
    <section className="space-y-4">
      <Card variant="elevated" className="space-y-4 p-4">
        <div>
          <div className="text-lg font-semibold text-spice-text-primary">
            Review & publish
          </div>
          <div className="mt-1 text-sm text-spice-text-muted">
            {data.title_en ?? data.title_bn ?? 'Untitled module'}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Card variant="bordered" className="space-y-1 p-3">
            <div className="text-[11px] font-semibold tracking-wider text-spice-text-muted">
              Status
            </div>
            <div className="text-xs text-spice-text-medium">
              {data.lifecycle_status}
              {data.clinically_reviewed ? ' · clinically reviewed' : ''}
            </div>
          </Card>
          <Card variant="bordered" className="space-y-1 p-3">
            <div className="text-[11px] font-semibold tracking-wider text-spice-text-muted">
              Content
            </div>
            <div className="text-xs text-spice-text-medium">
              {data.card_count} cards · {data.quiz.length} quiz questions · ~
              {data.estimated_minutes} min
            </div>
          </Card>
        </div>

        {data.quality_flags?.flags?.length ? (
          <Card variant="bordered" className="space-y-2 p-3">
            <div className="text-[11px] font-semibold tracking-wider text-spice-text-muted">
              Quality flags
            </div>
            <ul className="list-inside list-disc text-xs text-spice-text-medium">
              {data.quality_flags.flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            className="h-9 text-xs"
            disabled={busy}
            onClick={() => navigate(paths.moduleLibrary)}
          >
            Back to modules
          </Button>
          <Button
            className="h-9 text-xs"
            disabled={busy || data.clinically_reviewed}
            onClick={async () => {
              await setClinicallyReviewed({
                moduleId: data.id,
                body: { clinically_reviewed: true },
              }).unwrap();
              await refetch();
            }}
          >
            {isPublishing ? 'Publishing…' : 'Publish'}
          </Button>
          {/* <Button
            variant="secondary"
            className="h-9 text-xs text-spice-semantic-error ring-1 ring-spice-semantic-error/30"
            disabled={busy}
            onClick={async () => {
              await retireModule({ moduleId: data.id }).unwrap();
              navigate(paths.moduleLibrary);
            }}
          >
            {isRetiring ? 'Retiring…' : 'Retire'}
          </Button> */}
        </div>
      </Card>
    </section>
  );
};
