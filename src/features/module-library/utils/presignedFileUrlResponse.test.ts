import { describe, expect, it } from 'vitest';
import { normalizePresignedFileUrlResponse } from '@/features/module-library/utils/presignedFileUrlResponse';

describe('normalizePresignedFileUrlResponse', () => {
  it('reads presigned_url field', () => {
    expect(
      normalizePresignedFileUrlResponse({
        presigned_url: 'https://cdn.example/file.png',
        expires_seconds: 600,
      }),
    ).toEqual({
      presigned_url: 'https://cdn.example/file.png',
      expires_seconds: 600,
    });
  });

  it('reads url field fallback', () => {
    expect(
      normalizePresignedFileUrlResponse({ url: 'https://cdn.example/v.mp4' }),
    ).toEqual({ presigned_url: 'https://cdn.example/v.mp4' });
  });

  it('reads raw string response', () => {
    expect(
      normalizePresignedFileUrlResponse('https://cdn.example/raw.png'),
    ).toEqual({ presigned_url: 'https://cdn.example/raw.png' });
  });
});
