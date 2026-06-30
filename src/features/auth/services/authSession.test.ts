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
  firstName: 'test',
  lastName: 'user',
  role: 'SUPER_USER',
};

describe('authSession', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('stores and reads the auth session', () => {
    setAuthSession(sampleUser);

    expect(getAuthSession()).toEqual(sampleUser);
    expect(window.sessionStorage.getItem('appRole')).toBe('programManager');
  });

  it('derives display name and initials from the session user', () => {
    expect(getAuthDisplayName(sampleUser)).toBe('test user');
    expect(getAuthInitials(sampleUser)).toBe('TU');
  });
});
