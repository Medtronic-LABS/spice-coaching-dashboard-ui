export const CARD_IMAGE_MIN_DISPLAY_DIMENSION = 80;
export const CARD_IMAGE_MAX_DISPLAY_DIMENSION = 640;
export const CARD_IMAGE_DEFAULT_MAX_WIDTH = 480;

export function parsePositiveDimension(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }
  return undefined;
}

export function clampImageDimensions(
  width: number,
  height: number,
  options?: { min?: number; max?: number },
): { width: number; height: number } {
  const min = options?.min ?? CARD_IMAGE_MIN_DISPLAY_DIMENSION;
  const max = options?.max ?? CARD_IMAGE_MAX_DISPLAY_DIMENSION;
  let w = width;
  let h = height;
  const aspect = w / h;

  if (w < min || h < min) {
    if (aspect >= 1) {
      w = min;
      h = Math.max(1, Math.round(min / aspect));
    } else {
      h = min;
      w = Math.max(1, Math.round(min * aspect));
    }
  }

  if (w > max || h > max) {
    if (w >= h) {
      w = max;
      h = Math.max(1, Math.round(max / aspect));
    } else {
      h = max;
      w = Math.max(1, Math.round(max * aspect));
    }
  }

  return { width: w, height: h };
}

export function initialDisplayDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth = CARD_IMAGE_DEFAULT_MAX_WIDTH,
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return clampImageDimensions(maxWidth, Math.round(maxWidth * (9 / 16)));
  }
  if (naturalWidth <= maxWidth) {
    return clampImageDimensions(naturalWidth, naturalHeight);
  }
  const scale = maxWidth / naturalWidth;
  return clampImageDimensions(
    Math.round(naturalWidth * scale),
    Math.round(naturalHeight * scale),
  );
}

export function resizeDimensionsByWidth(
  width: number,
  height: number,
  nextWidth: number,
): { width: number; height: number } {
  const aspect = width / height;
  const w = Math.round(nextWidth);
  const h = Math.max(1, Math.round(w / aspect));
  return clampImageDimensions(w, h);
}

export function readImageDisplayDimensions(attrs: Record<string, unknown>): {
  width?: number;
  height?: number;
} {
  const width = parsePositiveDimension(attrs.width);
  const height = parsePositiveDimension(attrs.height);
  if (!width || !height) {
    return {};
  }
  return { width, height };
}
