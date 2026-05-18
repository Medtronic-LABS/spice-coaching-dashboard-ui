import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, LoadingState } from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  useEditModuleMutation,
  useGetModuleDetailQuery,
} from '@/features/module-library/api/adminModulesApi';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export const AdminModuleDetailsStep = () => {
  const navigate = useNavigate();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const { data, isLoading, isFetching, error, refetch } =
    useGetModuleDetailQuery(moduleId, { skip: !moduleId });
  const [editModule, { isLoading: isSaving }] = useEditModuleMutation();

  const [actionError, setActionError] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionBn, setDescriptionBn] = useState('');

  useEffect(() => {
    if (!data) return;
    setTitleBn((prev) => (prev ? prev : (data.title_bn ?? '')));
    setTitleEn((prev) => (prev ? prev : (data.title_en ?? '')));
    setDescriptionBn((prev) => (prev ? prev : (data.description_bn ?? '')));
  }, [data]);

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

  const busy = isFetching || isSaving;

  return (
    <section className="space-y-4">
      {actionError ? (
        <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
          {actionError}
        </div>
      ) : null}

      <Card variant="elevated" className="space-y-4 p-4">
        <div>
          <div className="text-lg font-semibold text-spice-text-primary">
            Module details
          </div>
          <div className="mt-1 text-xs text-spice-text-muted">
            {data.domain} · {data.module_type} · v{data.version} ·{' '}
            {data.lifecycle_status}
          </div>
        </div>

        <div className="grid gap-3 rounded-xl bg-spice-bg-surface p-3 ring-1 ring-spice-border md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
              Identifiers
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-spice-text-muted">Module ID</div>
              <div className="col-span-2 break-all text-spice-text-primary">
                {data.id}
              </div>
              <div className="text-spice-text-muted">Family ID</div>
              <div className="col-span-2 break-all text-spice-text-primary">
                {data.module_family_id}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
              Status
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-spice-text-muted">Lifecycle</div>
              <div className="col-span-2 text-spice-text-primary">
                {data.lifecycle_status}
              </div>
              <div className="text-spice-text-muted">Clinically reviewed</div>
              <div className="col-span-2 text-spice-text-primary">
                {data.clinically_reviewed ? 'Yes' : 'No'}
              </div>
              <div className="text-spice-text-muted">Visibility window</div>
              <div className="col-span-2 text-spice-text-primary">
                {data.has_visibility_window ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
              Counts
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-spice-text-muted">Cards</div>
              <div className="col-span-2 text-spice-text-primary">
                {data.card_count}
              </div>
              <div className="text-spice-text-muted">Estimated minutes</div>
              <div className="col-span-2 text-spice-text-primary">
                {data.estimated_minutes}
              </div>
              <div className="text-spice-text-muted">Quiz questions</div>
              <div className="col-span-2 text-spice-text-primary">
                {data.quiz.length}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
              Timestamps
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-spice-text-muted">Created</div>
              <div className="col-span-2 text-spice-text-primary">
                {formatDateTime(data.created_at)}
              </div>
              <div className="text-spice-text-muted">Published</div>
              <div className="col-span-2 text-spice-text-primary">
                {formatDateTime(data.published_at)}
              </div>
            </div>
          </div>
        </div>

        {data.quality_flags?.flags?.length ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-spice-text-primary">
              Quality flags
            </div>
            <div className="flex flex-wrap gap-2">
              {data.quality_flags.flags.map((flag) => (
                <span
                  key={flag}
                  className="rounded-full bg-spice-bg-tint px-2 py-1 text-[11px] font-semibold text-spice-text-medium ring-1 ring-spice-border"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">Title (BN)</span>
            <input
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">Title (EN)</span>
            <input
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-spice-text-muted">
            Description (BN)
          </span>
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm"
            value={descriptionBn}
            onChange={(e) => setDescriptionBn(e.target.value)}
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            className="h-9 text-xs"
            disabled={busy}
            onClick={async () => {
              setActionError('');
              try {
                await editModule({
                  moduleId: data.id,
                  body: {
                    title_bn: titleBn || undefined,
                    title_en: titleEn || undefined,
                    description_bn: descriptionBn || undefined,
                    module_json: { cards: data.cards, quiz: data.quiz },
                  },
                }).unwrap();
                await refetch();
              } catch (err) {
                setActionError(formatRtkQueryError(err));
              }
            }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            className="h-9 text-xs"
            disabled={busy}
            onClick={() =>
              navigate(
                paths.adminModuleReviewLessons.replace(
                  ':moduleId',
                  encodeURIComponent(data.id),
                ),
              )
            }
          >
            Continue to Lessons
          </Button>
        </div>
      </Card>
    </section>
  );
};
