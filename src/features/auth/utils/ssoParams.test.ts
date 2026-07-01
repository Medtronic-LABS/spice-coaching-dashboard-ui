import { describe, expect, it } from 'vitest';
import { parseSsoParams } from './ssoParams';

describe('parseSsoParams', () => {
  it('parses a complete SSO redirect query string', () => {
    const search =
      '?tenantId=2&userId=1&email=superuser%40test.com&firstName=test&lastName=user&role=SUPER_USER';

    expect(parseSsoParams(search)).toEqual({
      tenantId: '2',
      userId: '1',
      email: 'superuser@test.com',
      firstName: 'test',
      lastName: 'user',
      role: 'SUPER_USER',
    });
  });

  it('returns null when any required param is missing', () => {
    expect(parseSsoParams('?tenantId=2&userId=1&email=a@b.com')).toBeNull();
  });
});
