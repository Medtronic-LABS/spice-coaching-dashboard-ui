import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { paths } from '@/constants/routes';
import { CourseFlowStepper } from '@/features/program-manager/components/CourseFlowStepper';
import { RichTextEditor } from '@/features/program-manager/components/RichTextEditor';
import { useCourseModuleEditor } from '@/features/program-manager/hooks/useCourseModuleEditor';
import { setCourseLessons } from '@/features/program-manager/store/courseModuleEditSlice';
import type { RichBlock } from '@/features/program-manager/types/programManager.types';
import { useAppDispatch } from '@/store/hooks';

export const CourseLessonsPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { working, isLoading, saveContent, isSavingContent, formatError } =
    useCourseModuleEditor();
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [actionError, setActionError] = useState('');
  const isReadOnly = Boolean(working?.isReadOnly);

  const selectedLesson = working?.lessons.find(
    (lesson) => lesson.id === selectedLessonId,
  );
  const lessonContent = selectedLesson?.content ?? [];

  useEffect(() => {
    if (!selectedLessonId && working?.lessons?.[0]?.id) {
      setSelectedLessonId(working.lessons[0].id);
    }
  }, [working?.lessons, selectedLessonId]);

  const updateLessonContent = (content: RichBlock[]) => {
    if (!working || !selectedLessonId) return;
    dispatch(
      setCourseLessons(
        working.lessons.map((lesson) =>
          lesson.id === selectedLessonId ? { ...lesson, content } : lesson,
        ),
      ),
    );
  };

  if (working?.generationStatus !== 'generated') {
    return (
      <Card variant="elevated" className="space-y-3">
        <div className="text-lg font-semibold text-spice-text-primary">
          No generated module content yet
        </div>
        <p className="text-sm text-spice-text-medium">
          Upload a document and generate module content before editing lessons.
        </p>
        <div>
          <Button onClick={() => navigate(paths.moduleCreate)}>
            Go to Module Details
          </Button>
        </div>
      </Card>
    );
  }

  if (!working) {
    return isLoading ? null : null;
  }

  return (
    <section className="space-y-4">
      <CourseFlowStepper currentStep="lessons" isGenerated />
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card variant="elevated" className="space-y-2">
          <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
            Module
          </div>
          <div className="text-sm font-semibold text-spice-text-primary">
            {working.title}
          </div>
          <div className="space-y-2 pt-2">
            {working.lessons.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setSelectedLessonId(lesson.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selectedLessonId === lesson.id
                    ? 'bg-spice-bg-tint text-spice-brand-primary ring-1 ring-spice-border'
                    : 'text-spice-text-medium'
                }`}
              >
                {lesson.title}
                <div className="text-[11px] text-spice-text-muted">
                  Lesson {lesson.order}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card variant="elevated" className="space-y-4">
          {actionError ? (
            <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
              {actionError}
            </div>
          ) : null}
          <div className="text-4xl font-semibold text-spice-text-primary">
            Lesson Content
          </div>
          <RichTextEditor
            value={lessonContent}
            onChange={updateLessonContent}
            minHeightClassName="min-h-[320px]"
            readOnly={isReadOnly}
          />
          <div className="flex justify-end gap-2">
            {!isReadOnly ? (
              <Button
                variant="secondary"
                disabled={isSavingContent || isReadOnly}
                onClick={async () => {
                  setActionError('');
                  try {
                    await saveContent();
                  } catch (err) {
                    setActionError(formatError(err));
                  }
                }}
              >
                {isSavingContent ? 'Saving...' : 'Save Content'}
              </Button>
            ) : null}
            <Button onClick={() => navigate(paths.moduleQuiz)}>
              Continue to Quiz
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};
