import { useEffect, useMemo, useState } from 'react';
import { Banner, Button, Card, ErrorState, Loader } from '@/components/ui';
import {
  MODULE_ASSIGNMENT_DURATION_KEY,
  useFetchConfigByKeyQuery,
  useUpdateConfigMutation,
} from '@/features/admin-configs/api/adminConfigsApi';
import {
  DURATION_MAX_DAYS,
  DURATION_VALIDATION_ERROR,
  formatConfigDurationValue,
  getDurationValidationError,
  isDurationDaysInput,
  parseConfigDurationDays,
} from '@/features/admin-configs/utils/configDuration';

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
    isFetching,
    refetch,
  } = useFetchConfigByKeyQuery(MODULE_ASSIGNMENT_DURATION_KEY);
  const [updateConfig, { isLoading: isSaving }] = useUpdateConfigMutation();

  const [assignmentDurationDays, setAssignmentDurationDays] = useState('');
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);

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
      setFeedback({
        tone: 'success',
        message: 'Assignment duration updated successfully.',
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
      <Loader
        open={isSaving || isFetching}
        label={isSaving ? 'Saving configuration…' : 'Refreshing configuration…'}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            {config.title ?? 'Configuration'}
          </h1>
        </div>
        {config.description ? (
          <p className="max-w-3xl text-sm leading-relaxed text-spice-text-muted">
            {config.description}
          </p>
        ) : null}
      </div>

      <Card variant="elevated" className="max-w-2xl overflow-hidden">
        <div className="space-y-5 p-6">
          {feedback ? (
            <Banner tone={feedback.tone === 'success' ? 'success' : 'critical'}>
              {feedback.message}
            </Banner>
          ) : null}

          {formError ? <Banner tone="critical">{formError}</Banner> : null}

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-spice-text-primary">
              Quiz reattempt validity
            </span>
            <div className="flex max-w-xs items-center gap-3">
              <input
                className={inputClassName}
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
                aria-invalid={Boolean(formError)}
              />
              <span className="shrink-0 text-sm font-medium text-spice-text-muted">
                days
              </span>
            </div>
            <span className="text-xs text-spice-text-muted">
              Enter a value between 1 and {DURATION_MAX_DAYS} days.
            </span>
          </label>

          <div className="flex flex-wrap justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              disabled={!isDirty || isSaving}
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              disabled={!isDirty || !isValid || isSaving || Boolean(formError)}
              onClick={() => void handleSave()}
            >
              Save changes
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
};
