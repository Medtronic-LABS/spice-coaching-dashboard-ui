import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Loader } from '@/components/ui';
import { paths } from '@/constants/routes';
import { useAdminModuleReviewEditor } from '@/features/module-library/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/module-library/hooks/useAdminModuleReviewReadonly';
import { useAdminModuleThumbnailUpload } from '@/features/module-library/hooks/useAdminModuleThumbnailUpload';
import { updateDetails } from '@/features/module-library/store/adminModuleReviewSlice';
import { useAppDispatch } from '@/store/hooks';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

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

  const {
    fileInputRef,
    uploadError,
    isUploading,
    openFilePicker,
    handleImageUpload,
  } = useAdminModuleThumbnailUpload(save);

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

  const busy = isFetching || isSaving || isUploading;
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

        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="flex-1 flex flex-col justify-between rounded-xl bg-spice-bg-surface p-4 ring-1 ring-spice-border text-xs min-h-[180px]">
            <div className="flex justify-between items-center py-1.5 border-b border-spice-border/40">
              <span className="text-spice-text-muted font-medium">Status</span>
              <span className="font-semibold capitalize text-spice-text-primary">
                {working.lifecycle_status}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-spice-border/40">
              <span className="text-spice-text-muted font-medium">Cards</span>
              <span className="font-semibold text-spice-text-primary">
                {working.card_count}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-spice-border/40">
              <span className="text-spice-text-muted font-medium">
                Estimated minutes
              </span>
              <span className="font-semibold text-spice-text-primary">
                {working.estimated_minutes}{' '}
                {working.estimated_minutes === 1 ? 'minute' : 'minutes'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-spice-border/40">
              <span className="text-spice-text-muted font-medium">
                Quiz questions
              </span>
              <span className="font-semibold text-spice-text-primary">
                {working.quiz.length}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-spice-border/40">
              <span className="text-spice-text-muted font-medium">Created</span>
              <span className="font-semibold text-spice-text-primary">
                {formatDisplayDateTime(working.created_at)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-spice-border/40">
              <span className="text-spice-text-muted font-medium">
                Published
              </span>
              <span className="font-semibold text-spice-text-primary">
                {working.published_at
                  ? formatDisplayDateTime(working.published_at)
                  : 'N/A'}
              </span>
            </div>
          </div>

          <div className="w-full md:w-[300px] h-[250px] flex-shrink-0 flex flex-col justify-between rounded-xl bg-spice-bg-surface p-4 ring-1 ring-spice-border">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
                  Thumbnail
                </div>
                {working.thumbnail_presigned_url && !isReadonly && (
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={busy}
                    className="p-1 rounded-md text-spice-text-muted hover:text-spice-text-primary hover:bg-spice-bg-tint transition-colors"
                    title="Change thumbnail"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {working.thumbnail_presigned_url ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-spice-border bg-spice-bg-tint">
                  <img
                    src={working.thumbnail_presigned_url}
                    alt="Module thumbnail"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy || isReadonly}
                  onClick={openFilePicker}
                  className="flex h-[180px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-spice-border bg-spice-bg-tint hover:bg-spice-border p-2 text-center cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  <svg
                    className="mx-auto h-6 w-6 text-spice-text-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="mt-1 block text-[10px] font-medium text-spice-text-muted">
                    Add thumbnail
                  </span>
                </button>
              )}
            </div>

            {!isReadonly && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
            )}

            {uploadError && (
              <div className="mt-1 text-[10px] text-spice-semantic-error">
                {uploadError}
              </div>
            )}
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
