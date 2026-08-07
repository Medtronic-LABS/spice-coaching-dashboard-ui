import * as CryptoJS from 'crypto-js';
import { getHmacSecretKey } from '@/config/authConfig';

/** Same crypto-js interop as spice-2.0-admin-web login hashing. */
const cryptoJsLib =
  (CryptoJS as typeof CryptoJS & { default?: typeof CryptoJS }).default ||
  CryptoJS;

/**
 * HMAC-SHA512 hex digest for password transmission.
 * Matches spice-2.0-admin-web `generatePassword` / login saga hashing.
 */
export function hashPasswordWithHmac(
  password: string,
  secretKey?: string,
): string {
  const key = secretKey ?? getHmacSecretKey();
  const hmac = cryptoJsLib.HmacSHA512(password, key);
  return hmac.toString(cryptoJsLib.enc.Hex);
}

/** Alias mirroring spice-2.0-admin-web `generatePassword`. */
export const generatePassword = hashPasswordWithHmac;
