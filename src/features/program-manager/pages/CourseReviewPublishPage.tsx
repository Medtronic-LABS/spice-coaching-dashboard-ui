import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, LoadingState } from '@/components/ui';
import { paths } from '@/constants/routes';
import { CourseFlowStepper } from '@/features/program-manager/components/CourseFlowStepper';
import {
  usePublishModuleMutation,
  useSaveModuleAsDraftMutation,
} from '@/features/program-manager/api/moduleCreationPipelineApi';
import {
  useGetCourseDraftQuery,
  usePublishCourseMutation,
  useSaveCourseContentMutation,
  useSaveCourseDraftMutation,
} from '@/features/program-manager/api/programManagerApi';
import { blocksToPlainText } from '@/features/program-manager/utils/richText';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';

export const CourseReviewPublishPage = () => {
  const navigate = useNavigate();
  const { data, refetch } = useGetCourseDraftQuery();
  const [saveCourseDraft, { isLoading: isSavingMockDraft }] =
    useSaveCourseDraftMutation();
  const [saveCourseContent, { isLoading: isSavingContent }] =
    useSaveCourseContentMutation();
  const [publishCourse, { isLoading: isPublishingMock }] =
    usePublishCourseMutation();
  const [publishModule, { isLoading: isPublishingModule }] =
    usePublishModuleMutation();
  const [saveModuleAsDraft, { isLoading: isSavingModuleDraft }] =
    useSaveModuleAsDraftMutation();
  const [actionError, setActionError] = useState('');
  const isReadOnly = Boolean(data?.isReadOnly);
  const isAlreadyPublished = data?.status === 'published';

  if (data?.generationStatus !== 'generated') {
    return (
      <Card variant="elevated" className="space-y-3">
        <div className="text-lg font-semibold text-spice-text-primary">
          Draft is not ready for publish
        </div>
        <p className="text-sm text-spice-text-medium">
          Generate and save module content and quiz first.
        </p>
        <div>
          <Button onClick={() => navigate(paths.courseCreate)}>
            Go to Module Details
          </Button>
        </div>
      </Card>
    );
  }

  const isPublishing =
    isPublishingMock || isPublishingModule || isSavingContent;
  const isSavingDraft = isSavingMockDraft || isSavingModuleDraft;
  const isBusy = isPublishing || isSavingDraft;
  const loaderLabel =
    'Processing document to generate module. Please do not close this tab — it may take a few minutes.';

  return (
    <section className="space-y-4" aria-busy={isBusy}>
      <CourseFlowStepper currentStep="review" isGenerated />
      {isBusy ? (
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card variant="elevated" className="space-y-4">
          <h1 className="text-3xl font-semibold text-spice-text-primary">
            Review & Publish
          </h1>

          <Card variant="bordered" className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-spice-text-primary">
                Module Details
              </h2>
              <Button
                variant="ghost"
                className="h-8 px-2 text-xs"
                onClick={() => navigate(paths.courseCreate)}
              >
                {isReadOnly ? 'View' : 'Edit'}
              </Button>
            </div>
            <div className="text-sm font-semibold text-spice-text-primary">
              {data?.title}
            </div>
            <div className="text-xs text-spice-text-medium">
              {data?.description}
            </div>
            {data?.backendModuleId ? (
              <div className="text-xs text-spice-text-muted">
                Backend module ID: {data.backendModuleId}
              </div>
            ) : null}
          </Card>

          <Card variant="bordered" className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-spice-text-primary">
                Lessons
              </h2>
              <Button
                variant="ghost"
                className="h-8 px-2 text-xs"
                onClick={() => navigate(paths.moduleLessons)}
                // disabled={isReadOnly}
              >
                {isReadOnly ? 'View' : 'Edit'}
              </Button>
            </div>
            {(data?.lessons ?? []).map((lesson, index) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between rounded-lg bg-spice-bg-tint px-3 py-2"
              >
                <span className="text-sm text-spice-text-primary">
                  {index + 1}. {lesson.title}
                </span>
                <span className="text-xs text-spice-text-muted">
                  Lesson {lesson.order}
                </span>
              </div>
            ))}
          </Card>

          <Card variant="bordered" className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-spice-text-primary">
                Quiz
              </h2>
              <Button
                variant="ghost"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  if (isReadOnly) {
                    navigate(paths.moduleQuiz, {
                      state: { viewModuleId: data?.id },
                    });
                  } else {
                    navigate(paths.moduleQuiz);
                  }
                }}
              >
                {isReadOnly ? 'View' : 'Edit'}
              </Button>
            </div>
            {(data?.quiz.questions ?? []).map((question) => (
              <div
                key={question.id}
                className="rounded-lg bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary"
              >
                {blocksToPlainText(question.question)}
              </div>
            ))}
          </Card>
        </Card>

        <Card variant="elevated" className="space-y-4">
          <div className="text-sm font-semibold text-spice-text-primary">
            Module Summary
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-spice-text-muted">Lessons</span>
              <span className="font-semibold text-spice-text-primary">
                {data?.lessons.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-spice-text-muted">Quiz Questions</span>
              <span className="font-semibold text-spice-text-primary">
                {data?.quiz.questions.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-spice-text-muted">Est. completion</span>
              <span className="font-semibold text-spice-text-primary">
                ~{data?.estimateMinutes ?? 0} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-spice-text-muted">Source Document</span>
              <span className="font-semibold text-spice-text-primary">
                {data?.sourceFile}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-spice-brand-primary p-4 text-white">
            <div className="text-base font-semibold">Ready to publish?</div>
            <div className="text-xs text-white/90">
              This module will be added to the library and can be assigned after
              publishing.
            </div>
            {actionError ? (
              <div className="mt-2 rounded-lg bg-white/15 px-3 py-2 text-xs text-white">
                {actionError}
              </div>
            ) : null}
            <div className="mt-3 space-y-2">
              <Button
                variant="secondary"
                className="w-full bg-white text-spice-brand-primary"
                disabled={isPublishing}
                onClick={async () => {
                  setActionError('');
                  try {
                    if (isAlreadyPublished) {
                      navigate(paths.moduleLibrary);
                      return;
                    }
                    if (data?.backendModuleId) {
                      await publishModule({
                        moduleId: data.backendModuleId,
                      }).unwrap();
                      await saveCourseContent({ status: 'published' }).unwrap();
                    } else {
                      await publishCourse({
                        courseId: data?.id ?? 'draft-course',
                      }).unwrap();
                    }
                    await refetch();
                    navigate(paths.modulePublished);
                  } catch (error) {
                    setActionError(formatRtkQueryError(error));
                  }
                }}
              >
                {isPublishing
                  ? 'Publishing...'
                  : isAlreadyPublished
                    ? 'Back to Modules'
                    : 'Publish Module'}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-white ring-1 ring-white/40"
                disabled={isSavingDraft}
                onClick={async () => {
                  setActionError('');
                  try {
                    if (data?.backendModuleId) {
                      await saveModuleAsDraft({
                        moduleId: data.backendModuleId,
                      }).unwrap();
                    } else {
                      await saveCourseDraft().unwrap();
                    }
                    // await refetch();
                    navigate(paths.moduleLibrary);
                  } catch (error) {
                    setActionError(formatRtkQueryError(error));
                  }
                }}
              >
                {isSavingDraft ? 'Saving...' : 'Save as Draft'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
