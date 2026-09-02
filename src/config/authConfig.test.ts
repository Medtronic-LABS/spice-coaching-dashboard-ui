import { describe, expect, it } from 'vitest';
import { isLoginEnabled } from './authConfig';

describe('authConfig', () => {
  it('keeps the dashboard login page disabled', () => {
    expect(isLoginEnabled()).toBe(false);
  });
});
