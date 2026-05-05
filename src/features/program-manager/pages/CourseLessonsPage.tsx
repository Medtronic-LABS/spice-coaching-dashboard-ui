import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { paths } from '@/constants/routes';
import { CourseFlowStepper } from '@/features/program-manager/components/CourseFlowStepper';
import { RichTextEditor } from '@/features/program-manager/components/RichTextEditor';
import {
  useGetCourseDraftQuery,
  useSaveCourseContentMutation,
} from '@/features/program-manager/api/programManagerApi';
import type { RichBlock } from '@/features/program-manager/types/programManager.types';

export const CourseLessonsPage = () => {
  const navigate = useNavigate();
  const { data, refetch } = useGetCourseDraftQuery();
  const [saveCourseContent, { isLoading }] = useSaveCourseContentMutation();
  const [lessonContent, setLessonContent] = useState<RichBlock[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const isReadOnly = Boolean(data?.isReadOnly);

  useEffect(() => {
    const selectedLesson = data?.lessons.find(
      (lesson) => lesson.id === selectedLessonId,
    );
    setLessonContent(selectedLesson?.content ?? []);
  }, [data?.lessons, selectedLessonId]);
  useEffect(() => {
    if (!selectedLessonId && data?.lessons?.[0]?.id) {
      setSelectedLessonId(data.lessons[0].id);
    }
  }, [data?.lessons, selectedLessonId]);

  if (data?.generationStatus !== 'generated') {
    return (
      <Card variant="elevated" className="space-y-3">
        <div className="text-lg font-semibold text-spice-text-primary">
          No generated module content yet
        </div>
        <p className="text-sm text-spice-text-medium">
          Upload a document and generate module content before editing lessons.
        </p>
        <div>
          <Button onClick={() => navigate(paths.courseCreate)}>
            Go to Module Details
          </Button>
        </div>
      </Card>
    );
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
            {data?.title}
          </div>
          <div className="space-y-2 pt-2">
            {(data?.lessons ?? []).map((lesson) => (
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
          <div className="text-4xl font-semibold text-spice-text-primary">
            Lesson Content
          </div>
          <RichTextEditor
            value={lessonContent}
            onChange={setLessonContent}
            minHeightClassName="min-h-[320px]"
            readOnly={isReadOnly}
          />
          {/* <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          A single high reading does not confirm hypertension. Always confirm with two readings on separate occasions.
        </div> */}
          <div className="flex justify-end gap-2">
            {!isReadOnly && (
              <Button
                variant="secondary"
                disabled={isLoading || isReadOnly}
                onClick={async () => {
                  await saveCourseContent({
                    lessons: (data?.lessons ?? []).map((lesson) =>
                      lesson.id === selectedLessonId
                        ? { ...lesson, content: lessonContent }
                        : lesson,
                    ),
                  });
                  await refetch();
                }}
              >
                {isLoading ? 'Saving...' : 'Save Content'}
              </Button>
            )}
            <Button onClick={() => navigate(paths.courseQuiz)}>
              Continue to Quiz
            </Button>
          </div>
        </Card>

        {/* <Card variant="elevated" className="space-y-3">
        <div className="text-sm font-semibold text-spice-text-primary">AI Assistant</div>
        {[
          data?.moduleContent.fieldMessage ?? 'Normal blood pressure is below 120/80 mmHg.',
          'Use a validated digital BP monitor.',
          ...(data?.moduleContent.objectives ?? []),
          ...(data?.moduleContent.dangerSigns ?? []),
        ].map((item) => (
          <div key={item} className="rounded-lg border border-spice-border bg-spice-bg-surface p-3">
            <div className="text-xs text-spice-text-medium">{item}</div>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-spice-brand-primary"
              disabled={isReadOnly}
              onClick={() =>
                setLessonContent((current) => [
                  ...current,
                  { type: 'paragraph', content: [{ type: 'text', text: item }] },
                ])
              }
            >
              + Insert
            </button>
          </div>
        ))}
      </Card> */}
      </div>
    </section>
  );
};
