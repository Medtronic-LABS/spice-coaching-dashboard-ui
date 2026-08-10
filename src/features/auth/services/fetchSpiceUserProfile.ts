import { spiceUserApiUrl } from '@/config/spiceConfig';
import { getSpiceRequestHeaders } from '@/config/spiceSession';
import type { SpiceUserProfileResponse } from '@/features/auth/types/spiceUserProfile.types';
import { parseSpiceUserProfileResponse } from '@/features/auth/utils/parseSpiceUserProfileResponse';

export async function fetchSpiceUserProfile(): Promise<SpiceUserProfileResponse> {
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
