import { describe, expect, it } from 'vitest';
import {
  isDisplayTextTruncated,
  truncateDisplayText,
} from '@/utils/truncateDisplayText';

describe('truncateDisplayText', () => {
  it('returns trimmed text when within the limit', () => {
    expect(truncateDisplayText('  Safe Motherhood  ', 60)).toBe(
      'Safe Motherhood',
    );
  });

  it('truncates with an ellipsis when over the limit', () => {
    const long = 'A'.repeat(80);
    expect(truncateDisplayText(long, 60)).toBe(`${'A'.repeat(60)}…`);
  });

  it('detects when display truncation is needed', () => {
    expect(isDisplayTextTruncated('short', 60)).toBe(false);
    expect(isDisplayTextTruncated('x'.repeat(61), 60)).toBe(true);
  });
});
