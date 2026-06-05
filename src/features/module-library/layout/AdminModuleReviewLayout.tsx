import { useEffect, useMemo } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Button, UnsavedChangesDialog } from '@/components/ui';
import { paths } from '@/constants/routes';
import { useAdminModuleReviewNavigation } from '@/features/module-library/hooks/useAdminModuleReviewNavigation';
import { useAdminModuleReviewReadonly } from '@/features/module-library/hooks/useAdminModuleReviewReadonly';
import { clearAdminModuleReview } from '@/features/module-library/store/adminModuleReviewSlice';
import { useAppDispatch } from '@/store/hooks';

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
  const dispatch = useAppDispatch();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const isReadonly = useAdminModuleReviewReadonly();
  const steps = useMemo(
    () =>
      stepMeta.map((step) =>
        step.key === 'review' && isReadonly
          ? { ...step, label: 'Review' }
          : step,
      ),
    [isReadonly],
  );

  const currentStep = stepFromPathname(window.location.pathname);
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  const {
    isDirty,
    isSaving,
    dialogOpen,
    navigateTo,
    closeDialog,
    confirmDiscard,
    confirmSaveAndLeave,
  } = useAdminModuleReviewNavigation(moduleId);

  useEffect(() => {
    return () => {
      dispatch(clearAdminModuleReview());
    };
  }, [dispatch]);

  return (
    <section className="space-y-4">
      <UnsavedChangesDialog
        open={dialogOpen}
        onStay={closeDialog}
        onDiscard={confirmDiscard}
        onSaveAndLeave={() => void confirmSaveAndLeave()}
        isSaving={isSaving}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-spice-bg-surface px-4 py-3 ring-1 ring-spice-border">
          {isReadonly ? (
            <span className="rounded-full bg-spice-bg-tint px-2.5 py-1 text-[11px] font-semibold text-spice-text-medium ring-1 ring-spice-border">
              Read-only review
            </span>
          ) : null}
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isComplete = index < currentIndex;
            return (
              <div key={step.key} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateTo(step.path(moduleId))}
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
                  {isDirty && !isActive ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  ) : null}
                </button>
                {index < steps.length - 1 ? (
                  <span className="text-xs text-spice-text-muted">-</span>
                ) : null}
              </div>
            );
          })}
        </div>
        <Button
          variant="secondary"
          className="h-9 text-xs"
          onClick={() => navigateTo(paths.moduleLibrary)}
        >
          Back to modules
        </Button>
      </div>

      <Outlet />
    </section>
  );
};
