import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSpiceUserProfile } from './fetchSpiceUserProfile';

const profilePayload = {
  message: 'Got user.',
  entity: {
    id: 1,
    firstName: 'test',
    lastName: 'user',
    username: 'superuser@test.com',
    tenantId: 2,
    defaultRoleName: 'SUPER_USER',
    suiteAccess: ['coaching'],
    roles: [],
  },
  status: true,
  entityList: null,
  responseCode: 200,
  totalCount: null,
};

describe('fetchSpiceUserProfile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('posts to user-service profile with credentials included', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(profilePayload), { status: 200 }),
      );

    const profile = await fetchSpiceUserProfile();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(String(requestUrl)).toContain('/user/profile');
    expect(requestInit).toEqual(
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          client: 'web',
          tenantId: '0',
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(profile.entity.username).toBe('superuser@test.com');
  });

  it('throws when the profile request is not successful', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Unauthorized', { status: 401 }),
    );

    await expect(fetchSpiceUserProfile()).rejects.toThrow(
      'User profile request failed (401).',
    );
  });
});
