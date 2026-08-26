import { useMemo } from 'react';
import {
  Banner,
  Button,
  Card,
  LimitedTextInput,
  Modal,
  ModalActionBar,
  Tooltip,
} from '@/components/ui';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { BadgeImageUploadField } from '@/features/badges/components/BadgeImageUploadField';
import {
  BadgeModuleMultiSelect,
  type PublishedModuleOption,
} from '@/features/badges/components/BadgeModuleMultiSelect';

const FIELD_CLASS =
  'h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm';

const MILESTONE_FORM_INFO =
  'Upload a milestone image and map published learning modules. The sequence is assigned automatically when created; use Rearrange Milestone to reorder milestones on the roadmap.';

const PUBLISHED_MODULES_INFO =
  'Select one or more published modules to map to this milestone. Only active, eligible modules are listed; chatbot FAQ-only modules cannot be mapped.';

export type BadgeFormMode = 'create' | 'view' | 'edit';

export type BadgeFormState = {
  name: string;
  moduleIds: string[];
  imageStoragePath: string;
  imageObjectName: string;
  imagePreviewUrl: string;
  /** True when a new image was uploaded in this edit/create session. */
  imageChanged: boolean;
  /** True while a newly selected image is still uploading (or failed and awaiting retry). */
  imagePendingUpload: boolean;
};

export interface BadgeFormModalProps {
  open: boolean;
  mode: BadgeFormMode;
  form: BadgeFormState;
  /** Stable key so the image field resets when switching milestones. */
  imageResetKey: string;
  formError: string;
  isSaving: boolean;
  pickerModules: PublishedModuleOption[];
  modulesLoading: boolean;
  moduleSearchQuery: string;
  onModuleSearchChange: (value: string) => void;
  modulesHasMore?: boolean;
  onModulesLoadMore?: () => void;
  modulesLoadingMore?: boolean;
  modulesLoadError?: boolean;
  onModulesLoadMoreRetry?: () => void;
  onFormChange: (
    next: BadgeFormState | ((prev: BadgeFormState) => BadgeFormState),
  ) => void;
  onClose: () => void;
  onSubmit: () => void;
  onEditFromView: () => void;
  onFormError: (message: string) => void;
}

export function BadgeFormModal({
  open,
  mode,
  form,
  imageResetKey,
  formError,
  isSaving,
  pickerModules,
  modulesLoading,
  moduleSearchQuery,
  onModuleSearchChange,
  modulesHasMore = false,
  onModulesLoadMore,
  modulesLoadingMore = false,
  modulesLoadError = false,
  onModulesLoadMoreRetry,
  onFormChange,
  onClose,
  onSubmit,
  onEditFromView,
  onFormError,
}: BadgeFormModalProps) {
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const title =
    mode === 'view'
      ? 'View milestone'
      : mode === 'edit'
        ? 'Edit milestone'
        : 'Create milestone';

  const moduleOptions = useMemo(() => {
    if (!isViewMode) return pickerModules;
    const byId = new Map(pickerModules.map((module) => [module.id, module]));
    return form.moduleIds
      .map((id) => byId.get(id))
      .filter((module): module is PublishedModuleOption => Boolean(module));
  }, [form.moduleIds, isViewMode, pickerModules]);

  return (
    <Modal
      open={open}
      labelledBy="badge-form-modal-title"
      contentClassName="max-w-4xl"
      onClose={() => {
        if (isSaving) return;
        onClose();
      }}
    >
      <Card
        variant="elevated"
        className="w-full space-y-5 border-spice-border p-6 pr-12 shadow-lg sm:p-7 sm:pr-14"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-spice-border pb-4">
          <div>
            <h2
              id="badge-form-modal-title"
              className="inline-flex items-center gap-2 text-lg font-semibold text-spice-text-primary"
            >
              {title}
              <Tooltip
                label="About milestone form"
                content={MILESTONE_FORM_INFO}
                placement="bottom"
              />
            </h2>
          </div>
          {isViewMode ? (
            <span className="rounded-full bg-spice-bg-tint px-3 py-1 text-xs font-medium text-spice-text-primary">
              Viewing
            </span>
          ) : isEditMode ? (
            <span className="rounded-full bg-spice-brand-primary/10 px-3 py-1 text-xs font-medium text-spice-brand-primary">
              Editing
            </span>
          ) : null}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-spice-text-primary">
            Milestone name <span className="text-spice-semantic-error">*</span>
          </span>
          <LimitedTextInput
            id="badge-form-name"
            value={form.name}
            maxLength={FIELD_LIMITS.milestoneName}
            placeholder="e.g. Safe Motherhood Champion"
            disabled={isViewMode || isSaving}
            inputClassName={FIELD_CLASS}
            onChange={(name) => onFormChange((prev) => ({ ...prev, name }))}
          />
        </label>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="w-full max-w-[13rem] shrink-0">
            <BadgeImageUploadField
              key={imageResetKey}
              resetKey={imageResetKey}
              required={mode === 'create'}
              disabled={isSaving || isViewMode}
              value={{
                storagePath: form.imageStoragePath,
                objectName: form.imageObjectName,
                previewUrl: form.imagePreviewUrl,
              }}
              onUploaded={(uploaded) => {
                onFormError('');
                onFormChange((prev) => ({
                  ...prev,
                  imageStoragePath: uploaded.storagePath,
                  imageObjectName: uploaded.objectName,
                  imagePreviewUrl: uploaded.previewUrl,
                  imageChanged: true,
                  imagePendingUpload: false,
                }));
              }}
              onPendingUploadChange={(pending) => {
                onFormChange((prev) => ({
                  ...prev,
                  imagePendingUpload: pending,
                  // Treat “pending” as not yet changed until Upload completes.
                  imageChanged: pending ? false : prev.imageChanged,
                }));
                onFormError('');
              }}
              onError={onFormError}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-spice-text-primary">
                Published modules{' '}
                <span className="text-spice-semantic-error">*</span>
                <Tooltip
                  label="About published modules"
                  content={PUBLISHED_MODULES_INFO}
                  placement="bottom"
                />
              </span>
              <span className="text-xs text-spice-text-muted">
                {form.moduleIds.length} selected
              </span>
            </div>
            <BadgeModuleMultiSelect
              options={moduleOptions}
              selectedIds={form.moduleIds}
              onChange={(moduleIds) =>
                onFormChange((prev) => ({ ...prev, moduleIds }))
              }
              disabled={isViewMode || isSaving}
              showSearch={!isViewMode}
              searchValue={moduleSearchQuery}
              onSearchChange={onModuleSearchChange}
              isLoading={modulesLoading && !isViewMode}
              emptyMessage={
                isViewMode
                  ? 'No modules mapped to this milestone.'
                  : modulesLoadError
                    ? 'Failed to load published modules.'
                    : 'No assignable published modules match your search.'
              }
              hasMore={isViewMode ? false : modulesHasMore}
              onLoadMore={isViewMode ? undefined : onModulesLoadMore}
              isLoadingMore={isViewMode ? false : modulesLoadingMore}
              loadMoreError={isViewMode ? false : modulesLoadError}
              onLoadMoreRetry={isViewMode ? undefined : onModulesLoadMoreRetry}
            />
          </div>
        </div>

        {formError ? <Banner tone="critical">{formError}</Banner> : null}

        {isViewMode ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-spice-border pt-4">
            <Button className="h-9 text-xs" onClick={onEditFromView}>
              Edit
            </Button>
          </div>
        ) : (
          <ModalActionBar
            className="border-t border-spice-border px-0 pb-0 pt-4"
            confirmLabel={isEditMode ? 'Update' : 'Add'}
            cancelDisabled={isSaving}
            confirmDisabled={isSaving || form.imagePendingUpload}
            onCancel={onClose}
            onConfirm={onSubmit}
          />
        )}
      </Card>
    </Modal>
  );
}
