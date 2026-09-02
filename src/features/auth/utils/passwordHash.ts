import * as CryptoJS from 'crypto-js';

/** Same crypto-js interop as spice-2.0-admin-web login hashing. */
const cryptoJsLib =
  (CryptoJS as typeof CryptoJS & { default?: typeof CryptoJS }).default ||
  CryptoJS;

/**
 * HMAC-SHA512 hex digest for password transmission.
 * Login flow is not used by this app; callers must pass an explicit key when hashing.
 */
export function hashPasswordWithHmac(
  password: string,
  secretKey: string,
): string {
  const hmac = cryptoJsLib.HmacSHA512(password, secretKey);
  return hmac.toString(cryptoJsLib.enc.Hex);
}

/** Alias mirroring spice-2.0-admin-web `generatePassword`. */
export const generatePassword = hashPasswordWithHmac;
