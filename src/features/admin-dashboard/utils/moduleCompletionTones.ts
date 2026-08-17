export const MODULE_COMPLETION_ON_TRACK_PERCENT = 75;
export const MODULE_COMPLETION_WATCH_PERCENT = 55;

export const MODULE_COMPLETION_TONES = {
  onTrack: {
    barClassName: 'bg-spice-palette-green',
    textClassName: 'text-spice-palette-green',
  },
  watch: {
    barClassName: 'bg-spice-palette-blue',
    textClassName: 'text-spice-palette-blue',
  },
  atRisk: {
    barClassName: 'bg-spice-palette-red',
    textClassName: 'text-spice-palette-red',
  },
} as const;

export type ModuleCompletionRowTone =
  (typeof MODULE_COMPLETION_TONES)[keyof typeof MODULE_COMPLETION_TONES];

export function resolveModuleCompletionTone(
  percent: number,
): ModuleCompletionRowTone {
  if (percent >= MODULE_COMPLETION_ON_TRACK_PERCENT) {
    return MODULE_COMPLETION_TONES.onTrack;
  }
  if (percent >= MODULE_COMPLETION_WATCH_PERCENT) {
    return MODULE_COMPLETION_TONES.watch;
  }
  return MODULE_COMPLETION_TONES.atRisk;
}
