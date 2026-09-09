import { describe, expect, it } from 'vitest';
import { parseApiError } from '@/utils/parseApiError';

describe('parseApiError', () => {
  it('maps module_version_conflict from FastAPI detail', () => {
    expect(
      parseApiError({
        status: 409,
        data: {
          detail: {
            code: 'module_version_conflict',
            message: 'module has been modified; refetch and retry',
          },
        },
      }),
    ).toMatchObject({
      status: 409,
      code: 'module_version_conflict',
      message: 'module has been modified; refetch and retry',
      title: 'Module Version Conflict',
      retryable: true,
      domain: 'modules',
    });
  });

  it('falls back to HTTP status catalog when code is missing', () => {
    expect(parseApiError({ status: 503, data: {} })).toMatchObject({
      status: 503,
      code: null,
      title: 'Service Unavailable',
      retryable: true,
      domain: 'cross_cutting',
    });
  });

  it('uses API message over catalog description', () => {
    expect(
      parseApiError({
        status: 404,
        data: {
          detail: {
            code: 'module_not_found',
            message: 'Module abc-123 was not found.',
          },
        },
      }),
    ).toMatchObject({
      title: 'Module Not Found',
      description: 'Module abc-123 was not found.',
    });
  });

  it('maps validation_error for 422 responses', () => {
    expect(
      parseApiError({
        status: 422,
        data: {
          detail: { code: 'validation_error', message: 'Invalid domain.' },
        },
      }),
    ).toMatchObject({
      code: 'validation_error',
      title: 'Validation Error',
      retryable: false,
    });
  });

  it('uses generic fallback when API message and catalog description are missing', () => {
    expect(parseApiError({ status: 418, data: {} })).toMatchObject({
      title: 'Request failed (418)',
      description: 'Something went wrong. Please try again.',
    });
  });

  it('handles plain Error instances', () => {
    expect(parseApiError(new Error('Network down'))).toMatchObject({
      status: 'UNKNOWN',
      message: 'Network down',
      description: 'Network down',
      retryable: false,
    });
  });

  it('uses generic fallback for unknown errors without a message', () => {
    expect(parseApiError(null)).toMatchObject({
      status: 'UNKNOWN',
      description: 'Something went wrong. Please try again.',
    });
  });
});
