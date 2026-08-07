import { describe, expect, it } from 'vitest';
import { buildLoginQuery } from './authApi';

describe('authApi endpoint query structure', () => {
  it('constructs FormData with username and password fields for /auth/session POST request', () => {
    const credentials = {
      username: 'test_user',
      password: 'hashed_password_123',
    };

    const queryResult = buildLoginQuery(credentials);

    expect(queryResult.url).toBe('/auth/session');
    expect(queryResult.method).toBe('POST');
    expect(queryResult.body).toBeInstanceOf(FormData);

    const formData = queryResult.body;
    expect(formData.get('username')).toBe('test_user');
    expect(formData.get('password')).toBe('hashed_password_123');
  });
});
