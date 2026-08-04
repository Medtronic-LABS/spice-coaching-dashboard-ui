import { describe, expect, it } from 'vitest';
import {
  clampImageDimensions,
  initialDisplayDimensions,
  parsePositiveDimension,
  resizeDimensionsByWidth,
} from '@/features/modules/utils/cardImageDimensions';

describe('cardImageDimensions', () => {
  it('parses positive numeric dimensions', () => {
    expect(parsePositiveDimension(320)).toBe(320);
    expect(parsePositiveDimension('480')).toBe(480);
    expect(parsePositiveDimension(0)).toBeUndefined();
    expect(parsePositiveDimension('')).toBeUndefined();
  });

  it('scales large natural dimensions down to the default max width', () => {
    expect(initialDisplayDimensions(1600, 900)).toEqual({
      width: 480,
      height: 270,
    });
  });

  it('clamps resize results to configured bounds', () => {
    expect(resizeDimensionsByWidth(320, 180, 900)).toEqual({
      width: 640,
      height: 360,
    });
    expect(resizeDimensionsByWidth(320, 180, 40)).toEqual({
      width: 80,
      height: 46,
    });
  });

  it('preserves aspect ratio while clamping', () => {
    const clamped = clampImageDimensions(2000, 1000);
    expect(clamped.width / clamped.height).toBeCloseTo(2, 5);
    expect(clamped.width).toBeLessThanOrEqual(640);
    expect(clamped.height).toBeLessThanOrEqual(640);
  });
});
