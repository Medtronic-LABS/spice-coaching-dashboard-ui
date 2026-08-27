import { describe, expect, it } from 'vitest';
import { serializeRepeatedQueryParams } from '@/store/apis/serializeQueryParams';

describe('serializeRepeatedQueryParams', () => {
  it('repeats array keys instead of comma-joining', () => {
    expect(
      serializeRepeatedQueryParams({
        module_id: [
          '065e5a37-6dcf-4fe4-9450-b05176ad13ac',
          '1d030fd0-6541-4e4b-bb0b-38a1cc2b29ab',
        ],
        sort_by: 'published_at',
      }),
    ).toBe(
      'module_id=065e5a37-6dcf-4fe4-9450-b05176ad13ac&module_id=1d030fd0-6541-4e4b-bb0b-38a1cc2b29ab&sort_by=published_at',
    );
  });

  it('omits nullish scalars and empty arrays', () => {
    expect(
      serializeRepeatedQueryParams({
        q: 'protocol',
        module_id: [],
        offset: 0,
        unused: undefined,
        empty: null,
      }),
    ).toBe('q=protocol&offset=0');
  });
});
