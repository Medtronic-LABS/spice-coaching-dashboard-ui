export const MODULE_COMPLETION_GREEN_THRESHOLD = 75;
export const MODULE_COMPLETION_BLUE_THRESHOLD = 50;
export const MODULE_COMPLETION_ORANGE_THRESHOLD = 25;

export const MODULE_COMPLETION_TONES = {
  onTrack: {
    barClassName: 'bg-spice-palette-green',
    textClassName: 'text-spice-palette-green',
  },
  watch: {
    barClassName: 'bg-spice-palette-blue',
    textClassName: 'text-spice-palette-blue',
  },
  fair: {
    barClassName: 'bg-spice-palette-amber',
    textClassName: 'text-spice-palette-amber',
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
  if (percent > MODULE_COMPLETION_GREEN_THRESHOLD) {
    return MODULE_COMPLETION_TONES.onTrack;
  }
  if (percent > MODULE_COMPLETION_BLUE_THRESHOLD) {
    return MODULE_COMPLETION_TONES.watch;
  }
  if (percent > MODULE_COMPLETION_ORANGE_THRESHOLD) {
    return MODULE_COMPLETION_TONES.fair;
  }
  return MODULE_COMPLETION_TONES.atRisk;
}
