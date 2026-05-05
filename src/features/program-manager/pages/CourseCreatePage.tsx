import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, LoadingState } from '@/components/ui';
import { paths } from '@/constants/routes';
import { CourseFlowStepper } from '@/features/program-manager/components/CourseFlowStepper';
import { useCreateModuleFromDocumentMutation } from '@/features/program-manager/api/moduleCreationPipelineApi';
import {
  useGetCourseDraftQuery,
  useSaveCourseContentMutation,
  useSeedCourseDraftFromPipelineMutation,
} from '@/features/program-manager/api/programManagerApi';
import { useGetModuleDetailQuery } from '@/features/module-library/api/adminModulesApi';
import type {
  ModuleCreationDifficultyLevel,
  ModuleCreationDocType,
} from '@/features/program-manager/types/modulePipeline.types';
import { mapModulePipelineToCourseDraft } from '@/features/program-manager/utils/mapModulePipelineToCourseDraft';
import { mapAdminModuleDetailToCourseDraft } from '@/features/program-manager/utils/mapAdminModuleDetailToCourseDraft';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';

type LocationState = { viewModuleId?: string };

export const CourseCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const viewModuleId = state.viewModuleId;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data, refetch } = useGetCourseDraftQuery();
  const [createModuleFromDocument, { isLoading: isPipelineLoading }] =
    useCreateModuleFromDocumentMutation();
  const [seedCourseDraftFromPipeline, { isLoading: isSeedingDraft }] =
    useSeedCourseDraftFromPipelineMutation();
  const [saveCourseContent, { isLoading: isSaving }] =
    useSaveCourseContentMutation();
  const { data: moduleDetail, isFetching: isFetchingModuleDetail } =
    useGetModuleDetailQuery(viewModuleId ?? '', { skip: !viewModuleId });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generateError, setGenerateError] = useState('');
  const [form, setForm] = useState({
    title: '',
    topic: '',
    description: '',
    estimatedTime: 15,
  });
  const [pipelineMeta] = useState<{
    doc_type: ModuleCreationDocType;
    difficulty_level: ModuleCreationDifficultyLevel;
    version: number;
  }>({
    doc_type: 'sop_pdf',
    difficulty_level: 'moderate',
    version: 1,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      title: data.title,
      topic: data.topic,
      description: data.description,
      estimatedTime: data.moduleDetails.estimatedTime,
    });
  }, [data]);

  const isReadOnly = useMemo(
    () => Boolean(viewModuleId) || Boolean(data?.isReadOnly),
    [data?.isReadOnly, viewModuleId],
  );

  useEffect(() => {
    // If we arrived at create flow without a module to view, ensure we are not stuck in read-only mode.
    if (viewModuleId) return;
    if (!data?.isReadOnly) return;
    void saveCourseContent({ isReadOnly: false })
      .unwrap()
      .then(() => refetch());
  }, [data?.isReadOnly, refetch, saveCourseContent, viewModuleId]);

  useEffect(() => {
    if (!viewModuleId || !moduleDetail) return;
    const draft = mapAdminModuleDetailToCourseDraft(moduleDetail);
    void seedCourseDraftFromPipeline(draft)
      .unwrap()
      .then(() => refetch())
      .catch(() => undefined);
  }, [moduleDetail, refetch, seedCourseDraftFromPipeline, viewModuleId]);

  const isGenerating =
    isPipelineLoading || isSeedingDraft || isFetchingModuleDetail;
  const loaderLabel = isFetchingModuleDetail
    ? 'Loading module details...'
    : 'Processing document to generate module. Please do not close this tab — it may take a few minutes.';

  return (
    <section className="space-y-4" aria-busy={isGenerating}>
      <CourseFlowStepper
        currentStep="details"
        isGenerated={data?.generationStatus === 'generated'}
      />
      <h1 className="text-3xl font-semibold text-spice-brand-pm">
        {isReadOnly ? 'View Learning Module' : 'Create a Learning Module'}
      </h1>
      <p className="text-sm text-spice-text-muted">
        {isReadOnly
          ? 'Review the module details across steps. Editing is disabled.'
          : 'Define module details, upload a clinical PDF, and generate draft lessons and quiz from the admin module-creation pipeline. Generation may take up to about 15 minutes — a full-screen loader will appear while it runs.'}
      </p>

      {isGenerating ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-spice-text-primary/45 p-4 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
        >
          <Card
            variant="elevated"
            className="w-full max-w-md border-spice-border shadow-lg"
          >
            <LoadingState label={loaderLabel} />
          </Card>
        </div>
      ) : null}

      <Card variant="elevated" className="space-y-4">
        {/* {isReadOnly ? (
          <div className="rounded-xl border border-spice-border bg-spice-bg-tint px-4 py-3 text-sm text-spice-text-medium">
            You’re viewing an existing module. Upload and editing controls are disabled.
          </div>
        ) : null} */}
        <div className="grid gap-4 md:grid-cols-2">
          {isReadOnly && (
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-spice-text-muted">
                Module Title
              </label>
              <input
                className="h-11 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none"
                value={form.title}
                disabled={isReadOnly}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold tracking-wider text-spice-text-muted">
              Topic
            </label>
            <input
              className="h-11 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none"
              value={form.topic}
              disabled={isReadOnly}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  topic: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols">
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-spice-text-muted">
              Description
            </label>
            <textarea
              className="min-h-[140px] w-full rounded-xl border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm text-spice-text-primary outline-none"
              value={form.description}
              disabled={isReadOnly}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>
        </div>

        {/* {!isReadOnly ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-spice-text-muted">
                Doc type
              </label>
              <select
                className="h-11 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none"
                value={pipelineMeta.doc_type}
                onChange={(event) =>
                  setPipelineMeta((current) => ({
                    ...current,
                    doc_type: event.target.value as ModuleCreationDocType,
                  }))
                }
              >
                <option value="sop_pdf">sop_pdf</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-spice-text-muted">
                Difficulty
              </label>
              <select
                className="h-11 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none"
                value={pipelineMeta.difficulty_level}
                onChange={(event) =>
                  setPipelineMeta((current) => ({
                    ...current,
                    difficulty_level: event.target
                      .value as ModuleCreationDifficultyLevel,
                  }))
                }
              >
                <option value="easy">easy</option>
                <option value="moderate">moderate</option>
                <option value="hard">hard</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-spice-text-muted">
                Version
              </label>
              <input
                type="number"
                min={1}
                className="h-11 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none"
                value={pipelineMeta.version}
                onChange={(event) =>
                  setPipelineMeta((current) => ({
                    ...current,
                    version: Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>
        ) : null} */}

        {!isReadOnly ? (
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              className="rounded-xl border-2 border-spice-brand-pm bg-spice-bg-surface p-5 text-left"
            >
              <div className="text-xs font-semibold text-spice-brand-pm">
                Recommended
              </div>
              <div className="mt-2 text-lg font-semibold text-spice-text-primary">
                Upload a Document
              </div>
              <div className="mt-1 text-xs text-spice-text-muted">
                AI-generated from PDF (admin pipeline)
              </div>
            </button>
            <button
              type="button"
              className="rounded-xl border border-spice-border bg-spice-bg-surface p-5 text-left"
            >
              <div className="mt-5 text-lg font-semibold text-spice-text-primary">
                Build Manually
              </div>
              <div className="mt-1 text-xs text-spice-text-muted">
                Full control with custom content
              </div>
            </button>
          </div>
        ) : null}

        {!isReadOnly ? (
          <div className="rounded-xl border border-dashed border-spice-border-mid bg-spice-bg-tint p-8 text-center">
            <div className="text-sm font-semibold text-spice-text-primary">
              Drop your clinical document here
            </div>
            <div className="text-xs text-spice-text-muted">
              PDF (multipart upload to module-creation pipeline)
            </div>
            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setGenerateError('');
                }}
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <Button
                className="ml-2"
                disabled={isGenerating || !selectedFile || !form.topic.trim()}
                onClick={async () => {
                  setGenerateError('');
                  if (!selectedFile) return;
                  try {
                    const pipeline = await createModuleFromDocument({
                      file: selectedFile,
                      topic: form.topic.trim(),
                      doc_type: pipelineMeta.doc_type,
                      difficulty_level: pipelineMeta.difficulty_level,
                      estimated_time_minutes: form.estimatedTime,
                      version: pipelineMeta.version,
                      // module_title: form.title.trim() || undefined,
                      module_description: form.description.trim() || undefined,
                    }).unwrap();
                    const draft = mapModulePipelineToCourseDraft(pipeline, {
                      sourceFileName: selectedFile.name,
                      title: form.title,
                      topic: form.topic,
                      description: form.description,
                      estimatedTimeMinutes: form.estimatedTime,
                    });
                    await seedCourseDraftFromPipeline(draft).unwrap();
                    await refetch();
                  } catch (error) {
                    setGenerateError(formatRtkQueryError(error));
                  }
                }}
              >
                {isGenerating ? 'Generating...' : 'Upload & Generate'}
              </Button>
            </div>
            <div className="mt-4 text-xs text-spice-text-medium">
              {selectedFile ? selectedFile.name : 'No file selected'}
            </div>
            {generateError ? (
              <div className="mt-3 rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
                {generateError}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          {!isReadOnly ? (
            <Button
              variant="secondary"
              disabled={isSaving}
              onClick={async () => {
                await saveCourseContent({
                  title: form.title,
                  topic: form.topic,
                  description: form.description,
                  moduleDetails: data?.moduleDetails
                    ? {
                        ...data.moduleDetails,
                        estimatedTime: form.estimatedTime,
                      }
                    : undefined,
                  estimateMinutes: form.estimatedTime,
                });
                await refetch();
              }}
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
          ) : null}
          <Button
            disabled={data?.generationStatus !== 'generated'}
            onClick={() => navigate(paths.courseLessons)}
          >
            Continue to Lessons
          </Button>
        </div>
      </Card>
    </section>
  );
};
