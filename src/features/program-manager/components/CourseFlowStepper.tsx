import { useNavigate } from 'react-router-dom';
import { paths } from '@/constants/routes';

type StepKey = 'details' | 'lessons' | 'quiz' | 'review';

interface CourseFlowStepperProps {
  currentStep: StepKey;
  isGenerated: boolean;
}

const stepMeta: Array<{ key: StepKey; label: string; path: string }> = [
  { key: 'details', label: 'Module Details', path: paths.courseCreate },
  { key: 'lessons', label: 'Lessons', path: paths.courseLessons },
  { key: 'quiz', label: 'Quiz', path: paths.courseQuiz },
  { key: 'review', label: 'Review & Publish', path: paths.courseReview },
];

export const CourseFlowStepper = ({
  currentStep,
  isGenerated,
}: CourseFlowStepperProps) => {
  const navigate = useNavigate();
  const currentIndex = stepMeta.findIndex((step) => step.key === currentStep);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-spice-bg-surface px-4 py-3 ring-1 ring-spice-border">
      {stepMeta.map((step, index) => {
        const isActive = step.key === currentStep;
        const isComplete = index < currentIndex;
        const isLocked = !isGenerated && index > 0;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => navigate(step.path)}
              className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold transition ${
                isActive
                  ? 'bg-spice-brand-pm text-white'
                  : isComplete
                    ? 'bg-spice-bg-tint text-spice-brand-primary'
                    : 'text-spice-text-muted'
              } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
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
  );
};
