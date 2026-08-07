function readEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const DEFAULT_HMAC_SECRET_KEY = 'spice_uat';

/** Check whether login page flow is enabled (configurable via VITE_ENABLE_LOGIN). */
export function isLoginEnabled(): boolean {
  const envVal = readEnv('VITE_ENABLE_LOGIN');
  if (envVal === undefined) {
    return true;
  }
  return envVal.toLowerCase() === 'true';
}

/**
 * Secret key for HMAC-SHA512 password hashing prior to login transmission.
 * Prefers `VITE_PASSWORD_HASH_KEY` (SPICE: `REACT_APP_PASSWORD_HASH_KEY`).
 */
export function getHmacSecretKey(): string {
  return (
    readEnv('VITE_PASSWORD_HASH_KEY') ??
    readEnv('VITE_HMAC_SECRET_KEY') ??
    DEFAULT_HMAC_SECRET_KEY
  );
}
