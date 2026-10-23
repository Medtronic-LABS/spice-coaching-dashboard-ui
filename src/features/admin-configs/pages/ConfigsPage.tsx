import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageQueryErrorState } from '@/components/common/PageQueryErrorState';
import { PageTitle } from '@/components/common/PageTitle';
import {
  Button,
  Card,
  FormHelperText,
  FormLabel,
  Loader,
  SectionHeader,
  Tooltip,
  useSnackbar,
} from '@/components/ui';
import {
  MODULE_ASSIGNMENT_DURATION_KEY,
  useFetchConfigByKeyQuery,
  useUpdateConfigMutation,
} from '@/features/admin-configs/api/adminConfigsApi';
import { ConfigHistoryTable } from '@/features/admin-configs/components/ConfigHistoryTable';
import {
  DURATION_MAX_DAYS,
  DURATION_MAX_DIGITS,
  formatConfigDurationValue,
  getDurationValidationError,
  parseConfigDurationDays,
  parseDurationDaysInput,
} from '@/features/admin-configs/utils/configDuration';
import { SPICE_INPUT_FOCUS_CLASSNAME } from '@/constants/formControls';
import { cn } from '@/utils';

const inputClassName = cn(
  'h-11 w-full rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary caret-spice-palette-purple',
  SPICE_INPUT_FOCUS_CLASSNAME,
);

function handleDurationChange(
  value: string,
  setDuration: (next: string) => void,
  setError: (message: string) => void,
) {
  const next = parseDurationDaysInput(value);
  setDuration(next);
  setError(getDurationValidationError(next) ?? '');
}

export const ConfigsPage = () => {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const {
    data: config,
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchConfigByKeyQuery(MODULE_ASSIGNMENT_DURATION_KEY);
  const [updateConfig, { isLoading: isSaving }] = useUpdateConfigMutation();

  const [assignmentDurationDays, setAssignmentDurationDays] = useState('');
  const [formError, setFormError] = useState('');
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

  const handleSave = async () => {
    if (!config) return;

    const validationError = getDurationValidationError(assignmentDurationDays);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');

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
      snackbar.showSuccess('Quiz reattempt validity updated successfully.');
    } catch (saveError) {
      snackbar.showApiError(saveError);
    }
  };

  const handleReset = () => {
    setAssignmentDurationDays(savedDuration);
    setFormError('');
  };

  if (isLoading) {
    return <Loader open label="Loading configuration…" />;
  }

  if (isError || !config) {
    return (
      <PageQueryErrorState
        pageTitle={t('layout.sidebar.nav.configs')}
        error={error ?? { status: 'UNKNOWN' }}
        errorTitle="Unable to load configuration"
        onRetry={() => void refetch()}
      />
    );
  }

  const configFieldLabel =
    config.title?.trim() || 'Quiz reattempt validity (days)';

  return (
    <section className="space-y-6">
      <Loader open={isSaving} label="Saving configuration…" />

      <PageTitle title={t('layout.sidebar.nav.configs')} />

      <Card variant="elevated" className="max-w-xl space-y-5">
        <SectionHeader
          title={configFieldLabel}
          titleAccessory={
            config.description ? (
              <Tooltip
                label="Setting description"
                content={config.description}
                placement="top"
              />
            ) : undefined
          }
        />
        <div className="space-y-3">
          <FormLabel htmlFor="quiz-reattempt-validity-days" className="sr-only">
            {configFieldLabel}
          </FormLabel>
          <input
            id="quiz-reattempt-validity-days"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={DURATION_MAX_DIGITS}
            value={assignmentDurationDays}
            aria-invalid={Boolean(formError)}
            aria-describedby={
              formError ? 'quiz-reattempt-validity-error' : undefined
            }
            className={inputClassName}
            onChange={(event) => {
              handleDurationChange(
                event.target.value,
                setAssignmentDurationDays,
                setFormError,
              );
            }}
          />
          {formError ? (
            <p
              id="quiz-reattempt-validity-error"
              className="text-xs text-spice-semantic-error"
            >
              {formError}
            </p>
          ) : null}
          <FormHelperText>
            Number of days a learner may reattempt a quiz after assignment.
            Maximum {DURATION_MAX_DAYS} days.
          </FormHelperText>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={!isDirty || !isValid || isSaving}
            onClick={() => void handleSave()}
          >
            Save changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!isDirty || isSaving}
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </Card>

      <ConfigHistoryTable
        configKey={MODULE_ASSIGNMENT_DURATION_KEY}
        refreshNonce={historyRefreshNonce}
      />
    </section>
  );
};
