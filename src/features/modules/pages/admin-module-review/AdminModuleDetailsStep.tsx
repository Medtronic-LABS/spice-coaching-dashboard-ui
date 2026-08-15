import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRightIcon, PencilIcon, SaveDraftIcon } from '@/assets/icon';
import {
  Banner,
  Button,
  Card,
  ImagePicker,
  LimitedTextInput,
  Loader,
  Select,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { THUMBNAIL_ACCEPT_SIZE_HINT } from '@/constants/uploadLimits';
import { INGEST_FORM_DEFAULTS } from '@/features/ingest/constants/ingestFormDefaults';
import {
  INGEST_CONTENT_DOMAIN_OPTIONS,
  formatModuleContentDomainLabel,
} from '@/features/ingest/constants/ingestFormOptions';
import { useFetchModuleDomainOptionsQuery } from '@/features/modules/api/adminModulesApi';
import { AdminModuleDraftValidationDialog } from '@/features/modules/components/AdminModuleDraftValidationDialog';
import { ChatbotFaqsOnlyField } from '@/features/modules/components/ChatbotFaqsOnlyField';
import { ModuleTaxonomyField } from '@/features/modules/components/ModuleTaxonomyField';
import { CREATE_MODULE_FORM_PLACEHOLDERS } from '@/features/modules/constants/createModuleFormDefaults';
import { useAdminModuleDraftSaveFeedback } from '@/features/modules/hooks/useAdminModuleDraftSaveFeedback';
import { useAdminModuleReviewEditor } from '@/features/modules/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/modules/hooks/useAdminModuleReviewReadonly';
import { useAdminModuleThumbnailUpload } from '@/features/modules/hooks/useAdminModuleThumbnailUpload';
import { useModulePreview } from '@/features/modules/hooks/useModulePreview';
import { updateDetails } from '@/features/modules/store/adminModuleReviewSlice';
import { navigateToAdminModuleDraftIssue } from '@/features/modules/utils/adminModuleDraftIssueNavigation';
import {
  formatEstimatedMinutesFieldValue,
  getEstimatedMinutesValidationError,
  parseEstimatedMinutesInput,
} from '@/features/modules/utils/estimatedMinutesValidation';
import { formatModuleDomainLabel } from '@/features/modules/utils/moduleListFilters';
import { normalizeModuleTaxonomyLabel } from '@/features/modules/utils/normalizeModuleTaxonomyLabel';
import type { AdminModuleDraftIssue } from '@/features/modules/utils/validateAdminModuleDraftContent';
import { useAppDispatch } from '@/store/hooks';
import { patchLocaleField, readLocaleText } from '@/types/localized';
import { cn } from '@/utils';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

const COMPACT_CONTROL_CLASS =
  'h-8 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-2 text-xs font-semibold text-spice-text-primary';

function SummaryFieldLabel({
  label,
  editable,
}: {
  label: string;
  editable: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-spice-text-muted">
      {label}
      {editable ? (
        <PencilIcon
          className="h-3 w-3 shrink-0 text-spice-brand-primary"
          title={`Edit ${label.toLowerCase()}`}
        />
      ) : null}
    </span>
  );
}

export const AdminModuleDetailsStep = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const { working, isLoading, error, refetch, isSaving, save, formatError } =
    useAdminModuleReviewEditor(moduleId);

  const isReadonly = useAdminModuleReviewReadonly();
  const { data: catalogDomainOptions = [] } = useFetchModuleDomainOptionsQuery(
    {},
  );
  const { registerEditorContext } = useModulePreview();
  const {
    actionError,
    draftIssues,
    draftValidationOpen,
    clearSaveFeedback,
    captureSaveError,
    closeDraftValidation,
  } = useAdminModuleDraftSaveFeedback(formatError);

  const reviewDraftIssue = useCallback(
    (issue: AdminModuleDraftIssue) => {
      navigateToAdminModuleDraftIssue({
        navigate,
        moduleId,
        issue,
        onBeforeNavigate: closeDraftValidation,
      });
    },
    [closeDraftValidation, moduleId, navigate],
  );

  useEffect(() => {
    registerEditorContext({ phase: 'card', index: 0 });
  }, [registerEditorContext]);

  const { uploadError, isUploading, uploadThumbnailFile } =
    useAdminModuleThumbnailUpload(save);

  const domainOptions = useMemo(() => {
    if (!working?.domain || catalogDomainOptions.includes(working.domain)) {
      return catalogDomainOptions;
    }
    return [working.domain, ...catalogDomainOptions];
  }, [catalogDomainOptions, working?.domain]);

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

  const busy = isSaving || isUploading;
  const busyLabel = isUploading ? 'Uploading image…' : 'Saving module…';
  const qualityFlagLabels: string[] = working.quality_flags?.flags ?? [];
  const canEditMetadata = !isReadonly;
  const domainError = normalizeModuleTaxonomyLabel(working.domain)
    ? null
    : 'Domain is required.';
  const estimatedMinutesError = getEstimatedMinutesValidationError(
    working.estimated_minutes,
  );
  const metadataInvalid = Boolean(domainError || estimatedMinutesError);

  return (
    <section className="space-y-4">
      <Loader open={busy} label={busyLabel} />
      {actionError ? <Banner tone="critical">{actionError}</Banner> : null}
      <AdminModuleDraftValidationDialog
        open={draftValidationOpen}
        issues={draftIssues}
        onClose={closeDraftValidation}
        onReviewIssue={reviewDraftIssue}
      />

      <Card variant="elevated" className="space-y-4 p-4">
        <div>
          <div className="text-lg font-semibold text-spice-text-primary">
            Module details
          </div>
          <div className="mt-1 text-xs text-spice-text-muted">
            {formatModuleDomainLabel(working.domain)} · {working.module_type} ·
            v{working.version} · {working.lifecycle_status}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="flex-1 flex flex-col justify-between rounded-xl bg-spice-bg-surface p-4 ring-1 ring-spice-border text-xs min-h-[180px]">
            <div className="flex justify-between items-start gap-3 py-1.5 border-b border-spice-border/40">
              <SummaryFieldLabel label="Domain" editable={canEditMetadata} />
              {canEditMetadata ? (
                <div className="w-[13.5rem] shrink-0">
                  <ModuleTaxonomyField
                    id="admin-module-domain"
                    label="Domain"
                    hideLabel
                    value={working.domain}
                    options={domainOptions}
                    placeholder={CREATE_MODULE_FORM_PLACEHOLDERS.domain}
                    disabled={busy}
                    required
                    inputClassName={COMPACT_CONTROL_CLASS}
                    onChange={(domain) => dispatch(updateDetails({ domain }))}
                  />
                  {domainError ? (
                    <p className="mt-1 text-[11px] text-spice-semantic-error">
                      {domainError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <span className="font-semibold text-spice-text-primary">
                  {formatModuleDomainLabel(working.domain) || '—'}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center gap-3 py-1.5 border-b border-spice-border/40">
              <SummaryFieldLabel
                label="Domain Type"
                editable={canEditMetadata}
              />
              {canEditMetadata ? (
                <Select
                  className={cn(COMPACT_CONTROL_CLASS, 'w-[13.5rem] shrink-0')}
                  options={INGEST_CONTENT_DOMAIN_OPTIONS}
                  value={
                    working.content_domain ??
                    INGEST_FORM_DEFAULTS.content_domain
                  }
                  disabled={busy}
                  aria-label="Domain type"
                  onChange={(value) =>
                    dispatch(
                      updateDetails({
                        content_domain: value,
                      }),
                    )
                  }
                />
              ) : (
                <span className="font-semibold text-spice-text-primary">
                  {formatModuleContentDomainLabel(working.content_domain) ||
                    '—'}
                </span>
              )}
            </div>
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
            <div className="flex justify-between items-start gap-3 py-1.5 border-b border-spice-border/40">
              <SummaryFieldLabel
                label="Estimated minutes"
                editable={canEditMetadata}
              />
              {canEditMetadata ? (
                <div className="w-[13.5rem] shrink-0">
                  <input
                    id="admin-module-estimated-minutes"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    aria-label="Estimated minutes"
                    aria-invalid={Boolean(estimatedMinutesError)}
                    className={cn(
                      COMPACT_CONTROL_CLASS,
                      estimatedMinutesError &&
                        'border-spice-semantic-error ring-1 ring-spice-semantic-error',
                    )}
                    value={formatEstimatedMinutesFieldValue(
                      working.estimated_minutes,
                    )}
                    disabled={busy}
                    onChange={(e) =>
                      dispatch(
                        updateDetails({
                          estimated_minutes: parseEstimatedMinutesInput(
                            e.target.value,
                          ),
                        }),
                      )
                    }
                  />
                  {estimatedMinutesError ? (
                    <p className="mt-1 text-[11px] text-spice-semantic-error">
                      {estimatedMinutesError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <span className="font-semibold text-spice-text-primary">
                  {working.estimated_minutes}{' '}
                  {working.estimated_minutes === 1 ? 'minute' : 'minutes'}
                </span>
              )}
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
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
                Thumbnail
              </div>

              {isReadonly ? (
                working.thumbnail_presigned_url ? (
                  <div className="relative flex h-[180px] w-full items-center justify-center overflow-hidden rounded-lg border border-spice-border bg-spice-bg-tint">
                    <img
                      src={working.thumbnail_presigned_url}
                      alt="Module thumbnail"
                      draggable={false}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-[180px] w-full items-center justify-center rounded-lg border border-dashed border-spice-border bg-spice-bg-tint text-[10px] text-spice-text-muted">
                    No thumbnail
                  </div>
                )
              ) : (
                <ImagePicker
                  variant="tile"
                  value={working.thumbnail_presigned_url ?? null}
                  onChange={(file) => {
                    if (file) void uploadThumbnailFile(file);
                  }}
                  disabled={busy}
                  label="Add thumbnail"
                  labelWhenSelected="Change thumbnail"
                  hint={THUMBNAIL_ACCEPT_SIZE_HINT}
                  previewAlt="Module thumbnail"
                  previewObjectFit="contain"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                />
              )}
            </div>

            {uploadError ? (
              <div className="mt-1 text-[10px] text-spice-semantic-error">
                {uploadError}
              </div>
            ) : null}
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

        <div className="grid gap-3">
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">Title (BN)</span>
            <LimitedTextInput
              id="admin-module-title-bn"
              value={
                isReadonly
                  ? readLocaleText(working.title, 'bn')
                  : (working.title.bn ?? '')
              }
              maxLength={FIELD_LIMITS.moduleTitle}
              disabled={busy || isReadonly}
              onChange={(value) =>
                dispatch(
                  updateDetails({
                    title: patchLocaleField(working.title, 'bn', value),
                  }),
                )
              }
            />
          </label>
        </div>

        <div className="grid gap-3">
          <label className="block space-y-1">
            <span className="text-xs text-spice-text-muted">
              Description (BN)
            </span>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm"
              value={
                isReadonly
                  ? readLocaleText(working.description, 'bn')
                  : (working.description?.bn ?? '')
              }
              disabled={busy || isReadonly}
              onChange={(e) =>
                dispatch(
                  updateDetails({
                    description: patchLocaleField(
                      working.description ?? {},
                      'bn',
                      e.target.value,
                    ),
                  }),
                )
              }
            />
          </label>
        </div>

        <ChatbotFaqsOnlyField
          checked={Boolean(working.chatbot_faqs_only)}
          disabled={busy || isReadonly}
          onChange={(checked) =>
            dispatch(
              updateDetails({
                chatbot_faqs_only: checked,
              }),
            )
          }
        />

        <div className="flex justify-end gap-2">
          {!isReadonly ? (
            <Button
              variant="secondary"
              className="inline-flex h-9 items-center gap-1.5 text-xs"
              disabled={busy || metadataInvalid}
              onClick={async () => {
                clearSaveFeedback();
                if (metadataInvalid) return;
                try {
                  await save();
                } catch (err) {
                  captureSaveError(err);
                }
              }}
            >
              <SaveDraftIcon className="h-3.5 w-3.5" />
              {isSaving ? 'Saving…' : 'Save draft'}
            </Button>
          ) : null}
          <Button
            className="inline-flex h-9 items-center gap-1.5 text-xs"
            disabled={busy || metadataInvalid}
            onClick={() => {
              if (metadataInvalid) return;
              navigate(
                paths.adminModuleReviewLessons.replace(
                  ':moduleId',
                  encodeURIComponent(working.id),
                ),
              );
            }}
          >
            Continue to Lessons
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </section>
  );
};
