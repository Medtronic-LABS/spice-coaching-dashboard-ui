import { describe, expect, it, vi } from 'vitest';
import { getHmacSecretKey, isLoginEnabled } from './authConfig';

describe('authConfig', () => {
  it('keeps the dashboard login page disabled', () => {
    expect(isLoginEnabled()).toBe(false);
  });

  it('returns custom HMAC secret key when VITE_PASSWORD_HASH_KEY is defined', () => {
    vi.stubEnv('VITE_PASSWORD_HASH_KEY', 'spice_password_key');
    vi.stubEnv('VITE_HMAC_SECRET_KEY', 'legacy_hmac_key');
    expect(getHmacSecretKey()).toBe('spice_password_key');
    vi.unstubAllEnvs();
  });

  it('falls back to VITE_HMAC_SECRET_KEY when password hash key is unset', () => {
    vi.stubEnv('VITE_PASSWORD_HASH_KEY', '');
    vi.stubEnv('VITE_HMAC_SECRET_KEY', 'custom_key_123');
    expect(getHmacSecretKey()).toBe('custom_key_123');
    vi.unstubAllEnvs();
  });

  it('throws when neither password hash key env is set', () => {
    vi.stubEnv('VITE_HMAC_SECRET_KEY', '');
    vi.stubEnv('VITE_PASSWORD_HASH_KEY', '');
    expect(() => getHmacSecretKey()).toThrow(/VITE_PASSWORD_HASH_KEY/);
    vi.unstubAllEnvs();
  });
});
