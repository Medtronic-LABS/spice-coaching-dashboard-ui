import { describe, expect, it } from 'vitest';
import { isAssignablePublishedModule } from '@/features/modules/utils/isAssignablePublishedModule';

describe('isAssignablePublishedModule', () => {
  it('returns false for chatbot FAQ-only modules', () => {
    expect(isAssignablePublishedModule({ chatbot_faqs_only: true })).toBe(
      false,
    );
  });

  it('returns true when the flag is false or omitted', () => {
    expect(isAssignablePublishedModule({ chatbot_faqs_only: false })).toBe(
      true,
    );
    expect(isAssignablePublishedModule({})).toBe(true);
  });
});
