import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FormHelperText } from '@/components/ui';
import { SPICE_RADIO_CLASSNAME } from '@/constants/formControls';
import { cn } from '@/utils';

interface AssignToModeFieldProps {
  /** `true` = All SKs, `false` = Specific. */
  assignToAll: boolean;
  onChange: (assignToAll: boolean) => void;
  disabled?: boolean;
  /** Extra hint shown under the "Specific" option, e.g. where to pick assignees afterwards. */
  specificHint?: string;
  className?: string;
}

/** Radio group choosing between "All SKs" (default) and "Specific" assignment. */
export const AssignToModeField = ({
  assignToAll,
  onChange,
  disabled = false,
  specificHint,
  className,
}: AssignToModeFieldProps) => {
  const { t } = useTranslation();
  const groupName = useId();
  const options = [
    {
      value: true,
      label: t('assignmentMode.allSks'),
      hint: t('assignmentMode.allSksHint'),
    },
    {
      value: false,
      label: t('assignmentMode.specific'),
      hint: specificHint ?? t('assignmentMode.specificHint'),
    },
  ];

  return (
    <fieldset
      className={cn('min-w-0 space-y-2', className)}
      disabled={disabled}
    >
      <legend className="mb-1 text-sm font-semibold text-spice-text-primary">
        {t('assignmentMode.legend')}
      </legend>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
        {options.map((option) => (
          <label
            key={String(option.value)}
            className={cn(
              'flex min-w-0 items-start gap-2 text-sm text-spice-text-primary',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            )}
          >
            <input
              type="radio"
              name={groupName}
              checked={assignToAll === option.value}
              onChange={() => onChange(option.value)}
              className={cn(SPICE_RADIO_CLASSNAME, 'mt-0.5')}
            />
            <span className="min-w-0">
              <span className="block font-medium">{option.label}</span>
              <FormHelperText>{option.hint}</FormHelperText>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
