import { spiceUserApiUrl } from '@/config/spiceConfig';
import { getSpiceRequestHeaders } from '@/config/spiceSession';
import type { SpiceUserProfileResponse } from '@/features/auth/types/spiceUserProfile.types';
import { parseSpiceUserProfileResponse } from '@/features/auth/utils/parseSpiceUserProfileResponse';

/** Toggle to use hardcoded mock profile payload (true) or real /user/profile API (false). */
export const USE_HARDCODED_SPICE_PROFILE = true;

export const HARDCODED_SPICE_PROFILE_PAYLOAD = {
  message: 'Got user.',
  entity: {
    id: 63,
    firstName: 'Super',
    roles: [
      {
        id: 7,
        name: 'SUPER_ADMIN',
        level: null,
        groupName: 'SPICE',
        displayName: 'Super Admin',
        suiteAccessName: 'admin',
        appTypes: ['COMMUNITY'],
        reportPrivileges: [],
      },
    ],
    lastName: 'Admin',
    gender: 'Male',
    phoneNumber: '98XXX321',
    username: 'mcf_labtechnicxxx@spice.mdt',
    countryCode: '232',
    country: {
      id: 1,
      name: 'Sierra Leone',
      phoneNumberCode: '232',
      unitMeasurement: null,
      regionCode: '1',
      appTypes: ['COMMUNITY'],
      tenantId: 1,
    },
    organizations: [],
    tenantId: 77,
    fhirId: '49753',
    suiteAccess: ['insights', 'admin', 'coaching'],
    villages: [],
    culture: {
      id: 1,
      name: 'English',
      code: 'en',
    },
    timezone: {
      id: 1,
      offset: '+05:30',
      description: 'Indian Time',
    },
    defaultRoleName: 'SUPER_ADMIN',
    insightUserOrganization: [
      {
        id: 4,
        formDataId: 1,
        name: 'AMC Healthcare',
        sequence: null,
        parentOrganizationId: 3,
        formName: 'healthfacility',
      },
    ],
    reportUserOrganization: [],
    insightId: 195,
    isTermsAndConditionsAccepted: false,
    designation: {
      id: null,
      name: null,
    },
    redRisk: false,
  },
  status: true,
  entityList: null,
  responseCode: 200,
  totalCount: null,
};

export async function fetchSpiceUserProfile(): Promise<SpiceUserProfileResponse> {
  if (USE_HARDCODED_SPICE_PROFILE) {
    return parseSpiceUserProfileResponse(HARDCODED_SPICE_PROFILE_PAYLOAD);
  }

  const response = await fetch(`${spiceUserApiUrl}/user/profile`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...getSpiceRequestHeaders({ 'Content-Type': 'application/json' }),
    },
  });

  if (!response.ok) {
    throw new Error(`User profile request failed (${response.status}).`);
  }

  const payload: unknown = await response.json();
  return parseSpiceUserProfileResponse(payload);
}
