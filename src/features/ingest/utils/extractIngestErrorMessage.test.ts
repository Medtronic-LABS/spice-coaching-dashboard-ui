import { describe, expect, it } from 'vitest';
import { extractIngestErrorMessage } from './extractIngestErrorMessage';

describe('extractIngestErrorMessage', () => {
  it('returns message from structured error objects', () => {
    expect(
      extractIngestErrorMessage({
        type: 'InvalidRequestError',
        message:
          'This session is provisioning a new connection; concurrent operations are not permitted',
      }),
    ).toBe(
      'This session is provisioning a new connection; concurrent operations are not permitted',
    );
  });

  it('returns detail when message is absent', () => {
    expect(extractIngestErrorMessage({ detail: 'Pipeline stopped' })).toBe(
      'Pipeline stopped',
    );
  });

  it('returns plain strings and null for empty values', () => {
    expect(extractIngestErrorMessage('boom')).toBe('boom');
    expect(extractIngestErrorMessage('   ')).toBeNull();
    expect(extractIngestErrorMessage(null)).toBeNull();
    expect(
      extractIngestErrorMessage({ type: 'InvalidRequestError' }),
    ).toBeNull();
  });
});
