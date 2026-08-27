import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  QuotedDisplayLabel,
  TruncatedText,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import { useGetModuleDraftQuery } from '@/features/modules/api/moduleDraftApi';
import { ModuleStatusBadge } from '@/features/modules/components/ModuleStatusBadge';

export const ModulePublishedPage = () => {
  const navigate = useNavigate();
  const { data } = useGetModuleDraftQuery();

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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-spice-semantic-successBg text-lg text-spice-semantic-success">
          ✓
        </div>
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <ModuleStatusBadge status="published" />
          </div>
          <h1 className="text-3xl font-semibold text-spice-text-primary">
            Module is Live
          </h1>
          <p className="text-sm text-spice-text-muted">
            {data?.title ? <QuotedDisplayLabel text={data.title} /> : null} has
            been published to the module library and is ready to assign.
          </p>
        </div>

        <Card variant="bordered" className="space-y-2">
          <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
            Module Summary
          </div>
          <div className="rounded-lg bg-spice-bg-tint p-3">
            <div className="text-xs text-spice-text-muted">Module</div>
            <div className="min-w-0 font-semibold text-spice-text-primary">
              {data?.title ? (
                <TruncatedText
                  text={data.title}
                  className="font-semibold text-spice-text-primary"
                />
              ) : null}
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
              <div className="min-w-0 font-semibold text-spice-text-primary">
                {data?.sourceFile ? (
                  <TruncatedText
                    text={data.sourceFile}
                    className="font-semibold text-spice-text-primary"
                  />
                ) : null}
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
            Back to Module Library
          </Button>
        </div>
      </Card>
    </div>
  );
};
