import { describe, expect, it, vi } from 'vitest';
import type { LoginResponse } from '@/features/auth/types/auth.types';
import { mapLoginResponseToAuthUser } from './mapLoginResponseToAuthUser';

const sampleLoginResponse = {
  id: 1,
  firstName: 'test',
  lastName: 'user',
  username: 'superuser@test.com',
  email: null,
  roles: [
    {
      id: 1,
      name: 'SUPER_USER',
      level: 1,
      suiteAccessName: 'admin',
      authority: 'SUPER_USER',
    },
    {
      id: 8,
      name: 'SUPER_ADMIN',
      level: 5,
      suiteAccessName: 'admin',
      authority: 'SUPER_ADMIN',
    },
  ],
  tenantId: 2,
  isSuperUser: true,
  suiteAccess: ['insights', 'admin', 'cfr'],
  authorization: null,
  cookie: null,
} as LoginResponse;

describe('mapLoginResponseToAuthUser', () => {
  it('maps Spice /auth/session body using id, tenantId, roles[], and username', () => {
    vi.stubEnv('VITE_COACHING_SUITE_ACCESS', 'coaching');
    expect(
      mapLoginResponseToAuthUser(sampleLoginResponse, {
        authCookie: 'cookie-from-header',
        usernameFallback: 'fallback@test.com',
      }),
    ).toEqual({
      tenantId: '2',
      userId: '1',
      email: 'superuser@test.com',
      firstName: 'test',
      lastName: 'user',
      role: 'SUPER_USER',
      authorization: 'cookie-from-header',
      token: 'cookie-from-header',
    });
    vi.unstubAllEnvs();
  });

  it('prefers a coaching-suite role when present', () => {
    vi.stubEnv('VITE_COACHING_SUITE_ACCESS', 'coaching');
    const response = {
      ...sampleLoginResponse,
      roles: [
        ...((sampleLoginResponse.roles as object[]) ?? []),
        {
          id: 99,
          name: 'COACHING_ADMIN',
          suiteAccessName: 'coaching',
          authority: 'COACHING_ADMIN',
        },
      ],
    } as LoginResponse;

    expect(
      mapLoginResponseToAuthUser(response, {
        authCookie: 'cookie',
        usernameFallback: 'x',
      })?.role,
    ).toBe('COACHING_ADMIN');
    vi.unstubAllEnvs();
  });

  it('returns null when tenant or user id is missing', () => {
    expect(
      mapLoginResponseToAuthUser(
        { ...sampleLoginResponse, id: undefined, tenantId: undefined },
        { authCookie: 'cookie', usernameFallback: 'x' },
      ),
    ).toBeNull();
  });
});
