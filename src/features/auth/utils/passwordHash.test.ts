import { describe, expect, it } from 'vitest';
import CryptoJS from 'crypto-js';
import { hashPasswordWithHmac } from './passwordHash';

describe('hashPasswordWithHmac', () => {
  it('converts password to hex-encoded HMAC-SHA512 using crypto-js', () => {
    const password = 'mySecretPassword123';
    const key = 'spice_uat';
    const result = hashPasswordWithHmac(password, key);

    // Compute reference using crypto-js directly
    const expected = CryptoJS.HmacSHA512(password, key).toString(
      CryptoJS.enc.Hex,
    );

    expect(result).toBe(expected);
    expect(result).toHaveLength(128); // 512 bits = 128 hex chars
    expect(result).toMatch(/^[0-9a-f]{128}$/);
  });

  it('produces different hashes for different passwords', () => {
    const hash1 = hashPasswordWithHmac('pass1', 'key');
    const hash2 = hashPasswordWithHmac('pass2', 'key');
    expect(hash1).not.toBe(hash2);
  });

  it('produces different hashes for different secret keys', () => {
    const hash1 = hashPasswordWithHmac('pass', 'key1');
    const hash2 = hashPasswordWithHmac('pass', 'key2');
    expect(hash1).not.toBe(hash2);
  });
});
