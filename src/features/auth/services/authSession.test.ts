import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAuthDisplayName,
  getAuthInitials,
  getAuthSession,
  setAuthSession,
} from './authSession';

const sampleUser = {
  tenantId: '2',
  userId: '1',
  email: 'superuser@test.com',
  firstName: 'Super',
  lastName: 'User',
  role: 'SUPER_USER',
};

describe('authSession', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('stores and reads the auth session', () => {
    setAuthSession(sampleUser);

    expect(getAuthSession()).toEqual(sampleUser);
  });

  it('stores and reads authorization/auth-cookie payload on the session', () => {
    setAuthSession({
      ...sampleUser,
      authorization: 'cookie-value-123',
      token: 'cookie-value-123',
    });

    const session = getAuthSession();
    expect(session?.authorization).toBe('cookie-value-123');
    expect(session?.token).toBe('cookie-value-123');
  });

  it('derives display name and initials from the session user', () => {
    expect(getAuthDisplayName(sampleUser)).toBe('Super User');
    expect(getAuthInitials(sampleUser)).toBe('SU');
  });
});
