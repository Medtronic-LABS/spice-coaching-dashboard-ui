export const MODULE_COMPLETION_ROW_TONES = [
  {
    barClassName: 'bg-spice-brand-primary',
    textClassName: 'text-spice-brand-primary',
  },
  {
    barClassName: 'bg-spice-semantic-info',
    textClassName: 'text-spice-semantic-info',
  },
  {
    barClassName: 'bg-spice-semantic-success',
    textClassName: 'text-spice-semantic-success',
  },
  {
    barClassName: 'bg-spice-semantic-warning',
    textClassName: 'text-spice-semantic-warning',
  },
] as const;

export type ModuleCompletionRowTone =
  (typeof MODULE_COMPLETION_ROW_TONES)[number];

export function resolveModuleCompletionTone(
  index: number,
): ModuleCompletionRowTone {
  return (
    MODULE_COMPLETION_ROW_TONES[index % MODULE_COMPLETION_ROW_TONES.length] ??
    MODULE_COMPLETION_ROW_TONES[0]
  );
}
