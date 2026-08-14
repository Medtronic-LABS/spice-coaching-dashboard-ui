import { useEffect, useMemo, useState } from 'react';
import { Banner, Button, Card, ErrorState, Loader } from '@/components/ui';
import {
  MODULE_ASSIGNMENT_DURATION_KEY,
  useFetchConfigByKeyQuery,
  useUpdateConfigMutation,
} from '@/features/admin-configs/api/adminConfigsApi';
import { ConfigHistoryTable } from '@/features/admin-configs/components/ConfigHistoryTable';
import {
  DURATION_MAX_DAYS,
  DURATION_VALIDATION_ERROR,
  formatConfigDurationValue,
  getDurationValidationError,
  isDurationDaysInput,
  parseConfigDurationDays,
} from '@/features/admin-configs/utils/configDuration';
import { cn } from '@/utils';
import { useAutoDismissFeedback } from '@/hooks/useAutoDismissFeedback';

type FeedbackState =
  | { tone: 'success'; message: string }
  | { tone: 'critical'; message: string }
  | null;

const inputClassName =
  'h-11 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary focus:border-spice-brand-primary focus:outline-none focus:ring-2 focus:ring-spice-brand-primary/20';

function handleDurationChange(
  value: string,
  setDuration: (next: string) => void,
  setError: (message: string) => void,
) {
  if (isDurationDaysInput(value)) {
    setDuration(value);
    setError(getDurationValidationError(value) ?? '');
    return;
  }

  setError(DURATION_VALIDATION_ERROR);
}

function getMutationErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error &&
    'data' in error &&
    typeof (error as { data?: unknown }).data === 'object' &&
    (error as { data?: { message?: unknown } }).data?.message
  ) {
    return String((error as { data: { message: unknown } }).data.message);
  }
  return 'Something went wrong. Please try again.';
}

export const ConfigsPage = () => {
  const {
    data: config,
    isLoading,
    isError,
    refetch,
  } = useFetchConfigByKeyQuery(MODULE_ASSIGNMENT_DURATION_KEY);
  const [updateConfig, { isLoading: isSaving }] = useUpdateConfigMutation();

  const [assignmentDurationDays, setAssignmentDurationDays] = useState('');
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [historyRefreshNonce, setHistoryRefreshNonce] = useState(0);

  const savedDuration = useMemo(
    () => (config ? formatConfigDurationValue(config.value_json) : ''),
    [config],
  );

  useEffect(() => {
    if (config) {
      setAssignmentDurationDays(formatConfigDurationValue(config.value_json));
    }
  }, [config]);

  const isDirty = assignmentDurationDays !== savedDuration;
  const isValid = parseConfigDurationDays(assignmentDurationDays) !== null;

  useAutoDismissFeedback(feedback, () => setFeedback(null));

  const handleSave = async () => {
    if (!config) return;

    const validationError = getDurationValidationError(assignmentDurationDays);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');
    setFeedback(null);

    try {
      await updateConfig({
        key: MODULE_ASSIGNMENT_DURATION_KEY,
        body: {
          title: config.title,
          description: config.description,
          value_json: Number(assignmentDurationDays),
        },
      }).unwrap();
      setHistoryRefreshNonce((current) => current + 1);
      setFeedback({
        tone: 'success',
        message: 'Quiz reattempt validity updated successfully.',
      });
    } catch (error) {
      setFormError(getMutationErrorMessage(error));
    }
  };

  const handleReset = () => {
    setAssignmentDurationDays(savedDuration);
    setFormError('');
    setFeedback(null);
  };

  if (isLoading) {
    return <Loader open label="Loading configuration…" />;
  }

  if (isError || !config) {
    return (
      <ErrorState
        title="Failed to load configuration"
        action={
          <Button variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <section className="space-y-6">
      <Loader open={isSaving} label="Saving configuration…" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-spice-text-primary">
          {config.title ?? 'Configuration'}
        </h1>
        {config.description ? (
          <p className="w-full text-sm leading-relaxed text-spice-text-muted">
            {config.description}
          </p>
        ) : null}
      </div>

      <Card variant="elevated" className="max-w-xl overflow-hidden">
        <div className="space-y-5 p-6">
          {feedback ? (
            <Banner tone={feedback.tone === 'success' ? 'success' : 'critical'}>
              {feedback.message}
            </Banner>
          ) : null}

          {formError ? <Banner tone="critical">{formError}</Banner> : null}

          <div className="space-y-3">
            <label
              htmlFor="quiz-reattempt-validity-days"
              className="block text-sm font-semibold text-spice-text-primary"
            >
              Quiz reattempt validity
            </label>

            <div className="flex items-stretch">
              <input
                id="quiz-reattempt-validity-days"
                className={cn(
                  inputClassName,
                  'w-28 rounded-r-none border-r-0 focus:z-10',
                )}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={assignmentDurationDays}
                disabled={isSaving}
                onChange={(event) => {
                  setFeedback(null);
                  handleDurationChange(
                    event.target.value,
                    setAssignmentDurationDays,
                    setFormError,
                  );
                }}
                onBlur={() => {
                  if (!isDirty) {
                    setFormError('');
                    return;
                  }
                  setFormError(
                    getDurationValidationError(assignmentDurationDays) ?? '',
                  );
                }}
                placeholder="30"
                aria-label="Quiz reattempt validity days"
                aria-describedby="quiz-reattempt-validity-hint"
                aria-invalid={Boolean(formError)}
              />
              <span className="inline-flex shrink-0 items-center rounded-r-lg border border-spice-border bg-spice-bg-tint px-3 text-sm font-medium text-spice-text-medium">
                days
              </span>
            </div>

            <p
              id="quiz-reattempt-validity-hint"
              className="text-xs text-spice-text-muted"
            >
              Enter a value between 1 and {DURATION_MAX_DAYS}.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-spice-border pt-4">
            <Button
              variant="secondary"
              className="h-9 min-w-[5.5rem] text-xs"
              disabled={!isDirty || isSaving}
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              className="h-9 min-w-[5.5rem] text-xs"
              disabled={!isDirty || !isValid || isSaving || Boolean(formError)}
              onClick={() => void handleSave()}
            >
              Save changes
            </Button>
          </div>
        </div>
      </Card>

      <ConfigHistoryTable
        configKey={MODULE_ASSIGNMENT_DURATION_KEY}
        refreshNonce={historyRefreshNonce}
      />
    </section>
  );
};
