/** Shared Spice form-control classes for consistent theme focus/accent. */

/** Native checkbox: brand fill + themed focus ring (no CSS-var opacity). */
export const SPICE_CHECKBOX_CLASSNAME =
  'h-4 w-4 shrink-0 rounded border-spice-border-mid text-spice-brand-primary accent-spice-palette-purple focus:outline-none focus:ring-2 focus:ring-spice-palette-purpleLt focus:ring-offset-1 focus:ring-offset-spice-bg-surface';

/**
 * Text/select focus treatment.
 * Prefer solid theme tokens over `/opacity` modifiers — CSS-variable colors
 * often drop the alpha and fall back to the browser’s blue focus ring.
 */
export const SPICE_INPUT_FOCUS_CLASSNAME =
  'outline-none transition focus:border-spice-palette-purple focus:outline-none focus:ring-2 focus:ring-spice-palette-purpleLt';
