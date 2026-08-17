import { spiceUserApiUrl } from '@/config/spiceConfig';
import { getSpiceRequestHeaders } from '@/config/spiceSession';
import type { SpiceUserProfileResponse } from '@/features/auth/types/spiceUserProfile.types';
import { parseSpiceUserProfileResponse } from '@/features/auth/utils/parseSpiceUserProfileResponse';

export class SpiceProfileHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`User profile request failed (${status}).`);
    this.name = 'SpiceProfileHttpError';
    this.status = status;
  }
}

export function isSpiceProfileUnauthorizedError(error: unknown): boolean {
  return error instanceof SpiceProfileHttpError && error.status === 401;
}

export async function fetchSpiceUserProfile(): Promise<SpiceUserProfileResponse> {
  const response = await fetch(`${spiceUserApiUrl}/user/profile`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...getSpiceRequestHeaders({ 'Content-Type': 'application/json' }),
    },
  });

  if (!response.ok) {
    throw new SpiceProfileHttpError(response.status);
  }

  const payload: unknown = await response.json();
  return parseSpiceUserProfileResponse(payload);
}
