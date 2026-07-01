import type { SsoRedirectParams } from '@/features/auth/types/auth.types';

const SSO_PARAM_KEYS = [
  'tenantId',
  'userId',
  'email',
  'firstName',
  'lastName',
  'role',
] as const satisfies ReadonlyArray<keyof SsoRedirectParams>;

function readParam(
  params: URLSearchParams,
  key: keyof SsoRedirectParams,
): string | null {
  const value = params.get(key)?.trim();
  return value ? value : null;
}

export function parseSsoParams(search: string): SsoRedirectParams | null {
  const params = new URLSearchParams(search);

  const values = SSO_PARAM_KEYS.map((key) => ({
    key,
    value: readParam(params, key),
  }));

  if (values.some(({ value }) => !value)) {
    return null;
  }

  return {
    tenantId: values[0].value as string,
    userId: values[1].value as string,
    email: values[2].value as string,
    firstName: values[3].value as string,
    lastName: values[4].value as string,
    role: values[5].value as string,
  };
}

export function clearSsoParamsFromUrl(): void {
  const url = new URL(window.location.href);
  for (const key of SSO_PARAM_KEYS) {
    url.searchParams.delete(key);
  }
  const nextSearch = url.searchParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}
