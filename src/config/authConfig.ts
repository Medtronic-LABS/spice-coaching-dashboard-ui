function readEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Check whether login page flow is enabled (configurable via VITE_ENABLE_LOGIN). */
export function isLoginEnabled(): boolean {
  const envVal = readEnv('VITE_ENABLE_LOGIN');
  if (envVal === undefined) {
    return true;
  }
  return envVal.toLowerCase() === 'true';
}

/**
 * Client-side HMAC-SHA512 key used before login POST
 * (SPICE `REACT_APP_PASSWORD_HASH_KEY` parity).
 * Prefers `VITE_PASSWORD_HASH_KEY`, then `VITE_HMAC_SECRET_KEY`.
 * Not a server secret — still must be set explicitly (no in-repo default).
 */
export function getHmacSecretKey(): string {
  const key =
    readEnv('VITE_PASSWORD_HASH_KEY') ?? readEnv('VITE_HMAC_SECRET_KEY');
  if (!key) {
    throw new Error(
      'Missing VITE_PASSWORD_HASH_KEY (or VITE_HMAC_SECRET_KEY) for login password hashing.',
    );
  }
  return key;
}
