import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { paths } from '@/constants/routes';

type StepKey = 'details' | 'lessons' | 'quiz' | 'review';

const stepMeta: Array<{
  key: StepKey;
  label: string;
  path: (moduleId: string) => string;
}> = [
  {
    key: 'details',
    label: 'Module Details',
    path: (moduleId) =>
      paths.adminModuleReviewDetails.replace(
        ':moduleId',
        encodeURIComponent(moduleId),
      ),
  },
  {
    key: 'lessons',
    label: 'Lessons',
    path: (moduleId) =>
      paths.adminModuleReviewLessons.replace(
        ':moduleId',
        encodeURIComponent(moduleId),
      ),
  },
  {
    key: 'quiz',
    label: 'Quiz',
    path: (moduleId) =>
      paths.adminModuleReviewQuiz.replace(
        ':moduleId',
        encodeURIComponent(moduleId),
      ),
  },
  {
    key: 'review',
    label: 'Review & Publish',
    path: (moduleId) =>
      paths.adminModuleReviewPublish.replace(
        ':moduleId',
        encodeURIComponent(moduleId),
      ),
  },
];

function stepFromPathname(pathname: string): StepKey {
  const p = pathname.toLowerCase();
  if (p.endsWith('/lessons')) return 'lessons';
  if (p.endsWith('/quiz')) return 'quiz';
  if (p.endsWith('/review')) return 'review';
  return 'details';
}

export const AdminModuleReviewLayout = () => {
  const navigate = useNavigate();
  const { moduleId = '' } = useParams<{ moduleId: string }>();

  const currentStep = stepFromPathname(window.location.pathname);
  const currentIndex = stepMeta.findIndex((s) => s.key === currentStep);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-spice-bg-surface px-4 py-3 ring-1 ring-spice-border">
          {stepMeta.map((step, index) => {
            const isActive = step.key === currentStep;
            const isComplete = index < currentIndex;
            return (
              <div key={step.key} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(step.path(moduleId))}
                  className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-spice-brand-pm text-white'
                      : isComplete
                        ? 'bg-spice-bg-tint text-spice-brand-primary'
                        : 'text-spice-text-muted'
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isComplete
                          ? 'bg-spice-brand-primary text-white'
                          : 'bg-spice-bg-tint text-spice-text-medium'
                    }`}
                  >
                    {isComplete ? '✓' : index + 1}
                  </span>
                  {step.label}
                </button>
                {index < stepMeta.length - 1 ? (
                  <span className="text-xs text-spice-text-muted">-</span>
                ) : null}
              </div>
            );
          })}
        </div>
        <Button
          variant="secondary"
          className="h-9 text-xs"
          onClick={() => navigate(paths.moduleLibrary)}
        >
          Back to modules
        </Button>
      </div>

      <Outlet />
    </section>
  );
};
