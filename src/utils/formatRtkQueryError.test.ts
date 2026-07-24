import { describe, expect, it } from 'vitest';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';

describe('formatRtkQueryError', () => {
  it('reads FastAPI detail.message', () => {
    expect(
      formatRtkQueryError({
        status: 409,
        data: {
          detail: {
            code: 'module_version_conflict',
            message: 'module has been modified; refetch and retry',
          },
        },
      }),
    ).toBe('module has been modified; refetch and retry');
  });

  it('reads top-level message when present', () => {
    expect(
      formatRtkQueryError({
        status: 400,
        data: { message: 'bad request' },
      }),
    ).toBe('bad request');
  });

  it('falls back to status when no message', () => {
    expect(formatRtkQueryError({ status: 500, data: {} })).toBe(
      'Request failed (500)',
    );
  });
});
