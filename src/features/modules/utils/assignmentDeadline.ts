import { parseConfigDurationDays } from '@/features/admin-configs/utils/configDuration';

export function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatAssignmentDeadlineLabel(
  date: Date,
  locale = 'en-GB',
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getAssignmentDeadlineDate(
  assignmentDate: Date,
  configValue: unknown,
): Date | null {
  const durationDays = parseConfigDurationDays(configValue);
  if (durationDays === null) {
    return null;
  }

  return addDaysToDate(assignmentDate, durationDays);
}
