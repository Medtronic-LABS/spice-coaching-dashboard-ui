import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '@/components/ui';
import { paths } from '@/constants/routes';
import { useGetCourseDraftQuery } from '@/features/program-manager/api/programManagerApi';

export const CoursePublishedPage = () => {
  const navigate = useNavigate();
  const { data } = useGetCourseDraftQuery();

  if (data?.status !== 'published') {
    return (
      <Card variant="elevated" className="space-y-3">
        <div className="text-lg font-semibold text-spice-text-primary">
          Module is still in draft
        </div>
        <p className="text-sm text-spice-text-medium">
          Publish the module from Review & Publish to see the live screen.
        </p>
        <div>
          <Button onClick={() => navigate(paths.moduleReview)}>
            Go to Review & Publish
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card variant="elevated" className="w-full max-w-xl space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg text-green-700">
          ✓
        </div>
        <div className="text-center">
          <Badge className="bg-green-100 text-green-700">Published</Badge>
          <h1 className="mt-2 text-3xl font-semibold text-spice-text-primary">
            Module is Live
          </h1>
          <p className="text-sm text-spice-text-muted">
            {data?.title} has been published to the module library and is ready
            to assign.
          </p>
        </div>

        <Card variant="bordered" className="space-y-2">
          <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
            Module Summary
          </div>
          <div className="rounded-lg bg-spice-bg-tint p-3">
            <div className="text-xs text-spice-text-muted">Module</div>
            <div className="font-semibold text-spice-text-primary">
              {data?.title}
            </div>
            <div className="text-xs text-spice-text-muted">
              {data?.topic} • Published just now
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-spice-bg-tint p-3">
              <div className="text-xs text-spice-text-muted">Lessons</div>
              <div className="font-semibold text-spice-text-primary">
                {data?.lessons.length ?? 0} lessons
              </div>
            </div>
            <div className="rounded-lg bg-spice-bg-tint p-3">
              <div className="text-xs text-spice-text-muted">Quiz</div>
              <div className="font-semibold text-spice-text-primary">
                {data?.quiz.questions.length ?? 0} questions
              </div>
            </div>
            <div className="rounded-lg bg-spice-bg-tint p-3">
              <div className="text-xs text-spice-text-muted">Est. Time</div>
              <div className="font-semibold text-spice-text-primary">
                ~{data?.estimateMinutes ?? 0} min
              </div>
            </div>
            <div className="rounded-lg bg-spice-bg-tint p-3">
              <div className="text-xs text-spice-text-muted">Source</div>
              <div className="font-semibold text-spice-text-primary">
                {data?.sourceFile}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate(paths.moduleLibrary)}
            className="flex w-full items-center justify-between rounded-lg bg-spice-bg-tint px-4 py-3 text-left"
          >
            <div>
              <div className="text-sm font-semibold text-spice-text-primary">
                Assign this module now
              </div>
              <div className="text-xs text-spice-text-muted">
                Select CHWs and set a deadline
              </div>
            </div>
            <span>›</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(paths.moduleCreate)}
            className="flex w-full items-center justify-between rounded-lg bg-spice-bg-tint px-4 py-3 text-left"
          >
            <div>
              <div className="text-sm font-semibold text-spice-text-primary">
                Create another module
              </div>
              <div className="text-xs text-spice-text-muted">
                Build a new module from a document or from scratch
              </div>
            </div>
            <span>›</span>
          </button>
        </div>

        <div className="flex justify-center">
          <Button onClick={() => navigate(paths.moduleLibrary)}>
            Back to Courses
          </Button>
        </div>
      </Card>
    </div>
  );
};
