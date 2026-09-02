/**
 * Tailwind z-index classes for stacked overlays (low → high).
 * Keep modal layers above Loader so confirm dialogs stay visible during async work.
 */
export const OVERLAY_Z_INDEX = {
  loader: 'z-[200]',
  modal: 'z-[300]',
  modalRaised: 'z-[310]',
  modalTop: 'z-[320]',
  tooltip: 'z-[500]',
} as const;

export type OverlayZIndex =
  (typeof OVERLAY_Z_INDEX)[keyof typeof OVERLAY_Z_INDEX];
