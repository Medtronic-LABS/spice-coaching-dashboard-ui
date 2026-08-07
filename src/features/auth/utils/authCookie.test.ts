import { describe, expect, it } from 'vitest';
import {
  extractAuthCookieFromResponseHeaders,
  normalizeAuthCookieValue,
} from './authCookie';

describe('normalizeAuthCookieValue', () => {
  it('extracts AuthCookie from a combined JSESSIONID + AuthCookie header', () => {
    expect(
      normalizeAuthCookieValue(
        'JSESSIONID=abcd;Path=/;HttpOnly,AuthCookie=efg;Path=/',
      ),
    ).toBe('efg');
  });

  it('extracts AuthCookie when attributes use spaces', () => {
    expect(
      normalizeAuthCookieValue(
        'JSESSIONID=abcd; Path=/; HttpOnly, AuthCookie=token-xyz; Path=/',
      ),
    ).toBe('token-xyz');
  });

  it('returns bare cookie values unchanged', () => {
    expect(normalizeAuthCookieValue('  abc123  ')).toBe('abc123');
  });

  it('strips legacy auth-cookie= Set-Cookie attribute suffixes', () => {
    expect(
      normalizeAuthCookieValue(
        'auth-cookie=abc123; Path=/; HttpOnly; SameSite=Lax',
      ),
    ).toBe('abc123');
  });
});

describe('extractAuthCookieFromResponseHeaders', () => {
  it('prefers Authorization and extracts AuthCookie from it', () => {
    const headers = new Headers({
      authorization:
        'JSESSIONID=abcd;Path=/;HttpOnly,AuthCookie=from-auth;Path=/',
      'auth-cookie': 'from-cookie',
    });
    expect(extractAuthCookieFromResponseHeaders(headers)).toBe('from-auth');
  });

  it('falls back to auth-cookie when Authorization is absent', () => {
    const headers = new Headers({ 'auth-cookie': 'only-cookie' });
    expect(extractAuthCookieFromResponseHeaders(headers)).toBe('only-cookie');
  });

  it('returns undefined when no auth headers are present', () => {
    expect(extractAuthCookieFromResponseHeaders(new Headers())).toBeUndefined();
    expect(extractAuthCookieFromResponseHeaders(null)).toBeUndefined();
  });
});
