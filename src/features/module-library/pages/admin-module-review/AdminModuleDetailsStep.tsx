import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Loader } from '@/components/ui';
import { paths } from '@/constants/routes';
import { useAdminModuleReviewEditor } from '@/features/module-library/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/module-library/hooks/useAdminModuleReviewReadonly';
import { updateDetails } from '@/features/module-library/store/adminModuleReviewSlice';
import { useAppDispatch } from '@/store/hooks';

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export const AdminModuleDetailsStep = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const {
    working,
    isLoading,
    isFetching,
    error,
    refetch,
    isSaving,
    save,
    formatError,
  } = useAdminModuleReviewEditor(moduleId);

  const [actionError, setActionError] = useState('');
  const isReadonly = useAdminModuleReviewReadonly();

  if (isLoading && !working) {
    return <Loader label="Loading module…" />;
  }

  if (error || !working) {
    return (
      <Card variant="elevated" className="space-y-3 p-6">
        <p className="text-sm text-spice-semantic-error">
          {error ? formatError(error) : 'Module not found.'}
        </p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const busy = isFetching || isSaving;
  const qualityFlagLabels: string[] = working.quality_flags?.flags ?? [];

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
            {working.domain} · {working.module_type} · v{working.version} ·{' '}
            {working.lifecycle_status}
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
                {working.id}
              </div>
              <div className="text-spice-text-muted">Family ID</div>
              <div className="col-span-2 break-all text-spice-text-primary">
                {working.module_family_id}
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
                {working.lifecycle_status}
              </div>
              <div className="text-spice-text-muted">Clinically reviewed</div>
              <div className="col-span-2 text-spice-text-primary">
                {working.clinically_reviewed ? 'Yes' : 'No'}
              </div>
              <div className="text-spice-text-muted">Visibility window</div>
              <div className="col-span-2 text-spice-text-primary">
                {working.has_visibility_window ? 'Yes' : 'No'}
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
                {working.card_count}
              </div>
              <div className="text-spice-text-muted">Estimated minutes</div>
              <div className="col-span-2 text-spice-text-primary">
                {working.estimated_minutes}
              </div>
              <div className="text-spice-text-muted">Quiz questions</div>
              <div className="col-span-2 text-spice-text-primary">
                {working.quiz.length}
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
                {formatDateTime(working.created_at)}
              </div>
              <div className="text-spice-text-muted">Published</div>
              <div className="col-span-2 text-spice-text-primary">
                {formatDateTime(working.published_at)}
              </div>
            </div>
          </div>
        </div>

        {qualityFlagLabels.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-spice-text-primary">
              Quality flags
            </div>
            <div className="flex flex-wrap gap-2">
              {qualityFlagLabels.map((flag) => (
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
              value={working.title_bn ?? ''}
              disabled={busy || isReadonly}
              onChange={(e) =>
                dispatch(
                  updateDetails({
                    title_bn: e.target.value,
                  }),
                )
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">Title (EN)</span>
            <input
              className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
              value={working.title_en ?? ''}
              disabled={busy || isReadonly}
              onChange={(e) =>
                dispatch(
                  updateDetails({
                    title_en: e.target.value,
                  }),
                )
              }
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">
              Description (BN)
            </span>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm"
              value={working.description_bn ?? ''}
              disabled={busy || isReadonly}
              onChange={(e) =>
                dispatch(
                  updateDetails({
                    description_bn: e.target.value,
                  }),
                )
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">
              Description (EN)
            </span>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm"
              value={working.description_en ?? ''}
              disabled={busy || isReadonly}
              onChange={(e) =>
                dispatch(
                  updateDetails({
                    description_en: e.target.value,
                  }),
                )
              }
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          {!isReadonly ? (
            <Button
              variant="secondary"
              className="h-9 text-xs"
              disabled={busy || isReadonly}
              onClick={async () => {
                setActionError('');
                try {
                  await save();
                } catch (err) {
                  setActionError(formatError(err));
                }
              }}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          ) : null}
          <Button
            className="h-9 text-xs"
            disabled={busy}
            onClick={() =>
              navigate(
                paths.adminModuleReviewLessons.replace(
                  ':moduleId',
                  encodeURIComponent(working.id),
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
