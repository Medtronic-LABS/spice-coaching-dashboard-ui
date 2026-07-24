import { describe, expect, it } from 'vitest';
import type { SpiceUserProfileEntity } from '@/features/auth/types/spiceUserProfile.types';
import { mapSpiceProfileToAuthUser } from './mapSpiceProfileToAuthUser';

const sampleEntity: SpiceUserProfileEntity = {
  id: 1,
  firstName: 'test',
  lastName: 'user',
  username: 'superuser@test.com',
  tenantId: 2,
  defaultRoleName: 'SUPER_USER',
  suiteAccess: ['insights', 'admin', 'coaching'],
  roles: [
    {
      id: 1,
      name: 'SUPER_USER',
      level: 1,
      groupName: 'SPICE',
      displayName: 'Super user',
      suiteAccessName: 'admin',
      appTypes: ['COMMUNITY'],
      reportPrivileges: [],
    },
    {
      id: 18,
      name: 'REPORT_ADMIN',
      level: 13,
      groupName: 'REPORTS',
      displayName: 'Report Admin',
      suiteAccessName: 'cfr',
      appTypes: ['COMMUNITY'],
      reportPrivileges: [],
    },
  ],
};

describe('mapSpiceProfileToAuthUser', () => {
  it('maps profile entity fields to the auth session shape', () => {
    expect(mapSpiceProfileToAuthUser(sampleEntity)).toEqual({
      tenantId: '2',
      userId: '1',
      email: 'superuser@test.com',
      firstName: 'test',
      lastName: 'user',
      role: 'SUPER_USER',
    });
  });

  it('prefers the coaching role when present', () => {
    expect(
      mapSpiceProfileToAuthUser({
        ...sampleEntity,
        defaultRoleName: 'SUPER_USER',
        roles: [
          ...sampleEntity.roles,
          {
            id: 99,
            name: 'COACHING_ADMIN',
            level: 2,
            groupName: 'SPICE',
            displayName: 'Coaching Admin',
            suiteAccessName: 'coaching',
            appTypes: ['COMMUNITY'],
            reportPrivileges: [],
          },
        ],
      }).role,
    ).toBe('COACHING_ADMIN');
  });
});
