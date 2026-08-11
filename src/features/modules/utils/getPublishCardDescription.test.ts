import { describe, expect, it } from 'vitest';
import { getPublishCardDescription } from '@/features/modules/utils/getPublishCardDescription';

describe('getPublishCardDescription', () => {
  it('describes draft modules that remain assignable', () => {
    expect(
      getPublishCardDescription({
        readonly: false,
        isAlreadyPublished: false,
        assignDisabled: false,
      }),
    ).toMatch(/assign it to CHWs after publishing/i);
  });

  it('describes draft chatbot FAQ-only modules', () => {
    expect(
      getPublishCardDescription({
        readonly: false,
        isAlreadyPublished: false,
        assignDisabled: true,
      }),
    ).toMatch(/cannot be assigned to CHWs/i);
  });

  it('describes published chatbot FAQ-only modules in readonly review', () => {
    expect(
      getPublishCardDescription({
        readonly: true,
        isAlreadyPublished: true,
        assignDisabled: true,
      }),
    ).toBe(
      'Review this chatbot FAQ-only module. It cannot be assigned to CHWs.',
    );
  });
});
