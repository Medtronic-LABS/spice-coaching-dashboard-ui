import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Loader, ModulePublishedSuccessModal } from '@/components/ui';
import { paths } from '@/constants/routes';
import { ModuleReviewPublishView } from '@/features/module-library/components/ModuleReviewPublishView';
import { CourseFlowStepper } from '@/features/program-manager/components/CourseFlowStepper';
import { usePublishModuleMutation } from '@/features/program-manager/api/moduleCreationPipelineApi';
import {
  usePublishCourseMutation,
  useSaveCourseContentMutation,
} from '@/features/program-manager/api/programManagerApi';
import { useCourseModuleEditor } from '@/features/program-manager/hooks/useCourseModuleEditor';
import { blocksToPlainText } from '@/features/program-manager/utils/richText';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';

export const CourseReviewPublishPage = () => {
  const navigate = useNavigate();
  const {
    working,
    isDirty,
    isLoading,
    refetch,
    isSaving,
    saveAllForLeave,
    formatError,
  } = useCourseModuleEditor();
  const [saveCourseContent, { isLoading: isSavingContent }] =
    useSaveCourseContentMutation();
  const [publishCourse, { isLoading: isPublishingMock }] =
    usePublishCourseMutation();
  const [publishModule, { isLoading: isPublishingModule }] =
    usePublishModuleMutation();
  const [actionError, setActionError] = useState('');
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const isReadOnly = Boolean(working?.isReadOnly);
  const isAlreadyPublished = working?.status === 'published';

  const goToModuleLibrary = useCallback(() => {
    setPublishSuccessOpen(false);
    navigate(paths.moduleLibrary);
  }, [navigate]);

  const publishSummary = useMemo(
    () =>
      working
        ? {
            title: working.title,
            topic: working.topic,
            lessonCount: working.lessons.length,
            quizCount: working.quiz.questions.length,
            estimateMinutes: working.estimateMinutes,
            sourceFileName: working.sourceFile,
          }
        : null,
    [working],
  );

  if (working?.generationStatus !== 'generated') {
    return (
      <Card variant="elevated" className="space-y-3">
        <div className="text-lg font-semibold text-spice-text-primary">
          Draft is not ready for publish
        </div>
        <p className="text-sm text-spice-text-medium">
          Generate and save module content and quiz first.
        </p>
        <div>
          <button
            type="button"
            className="text-sm font-semibold text-spice-brand-primary"
            onClick={() => navigate(paths.moduleCreate)}
          >
            Go to Module Details
          </button>
        </div>
      </Card>
    );
  }

  const isPublishing =
    isPublishingMock || isPublishingModule || isSavingContent;
  const isBusy = isPublishing || isSaving;
  const loaderLabel =
    'Saving module. Please do not close this tab — it may take a moment.';

  const lessonRows = (working?.lessons ?? []).map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    mediaTags: [] as string[],
  }));

  const quizRows = (working?.quiz.questions ?? []).map((question) => ({
    id: String(question.id),
    question: blocksToPlainText(question.question),
    answerSet:
      question.correctAnswers.length > 0 &&
      blocksToPlainText(question.question).length > 0,
  }));

  const unsavedChangesMessage = isDirty
    ? 'You have unsaved changes. Save here or on any step before leaving this flow.'
    : undefined;

  return (
    <section className="space-y-4" aria-busy={isBusy}>
      {publishSummary ? (
        <ModulePublishedSuccessModal
          open={publishSuccessOpen}
          summary={publishSummary}
          onRedirect={goToModuleLibrary}
          onCreateAnother={() => {
            setPublishSuccessOpen(false);
            navigate(paths.moduleCreate);
          }}
        />
      ) : null}
      <CourseFlowStepper currentStep="review" isGenerated />
      <Loader open={isBusy} label={loaderLabel} />
      {working ? (
        <ModuleReviewPublishView
          title={working.title}
          topic={working.topic}
          description={working.description}
          lessons={lessonRows}
          quizQuestions={quizRows}
          lessonCount={working.lessons.length}
          quizCount={working.quiz.questions.length}
          estimateMinutes={working.estimateMinutes}
          sourceFileName={working.sourceFile}
          sourceFileSizeLabel="Source document"
          editActionLabel={isReadOnly ? 'View' : 'Edit'}
          isAlreadyPublished={isAlreadyPublished}
          isPublishing={isPublishing}
          isSaving={isSaving}
          publishError={actionError}
          unsavedChangesMessage={unsavedChangesMessage}
          onEditDetails={() => navigate(paths.moduleCreate)}
          onEditLessons={() => navigate(paths.moduleLessons)}
          onEditQuiz={() => navigate(paths.moduleQuiz)}
          onSave={async () => {
            setActionError('');
            try {
              await saveAllForLeave();
            } catch (error) {
              setActionError(formatError(error));
            }
          }}
          onPublish={async () => {
            setActionError('');
            if (isAlreadyPublished) {
              goToModuleLibrary();
              return;
            }
            try {
              if (isDirty) {
                await saveAllForLeave();
              }
              if (working.backendModuleId) {
                await publishModule({
                  moduleId: working.backendModuleId,
                }).unwrap();
                await saveCourseContent({ status: 'published' }).unwrap();
              } else {
                await publishCourse({
                  courseId: working.id ?? 'draft-course',
                }).unwrap();
              }
              await refetch();
              setPublishSuccessOpen(true);
            } catch (error) {
              setActionError(formatRtkQueryError(error));
            }
          }}
        />
      ) : isLoading ? (
        <Loader label="Loading module…" />
      ) : null}
    </section>
  );
};
