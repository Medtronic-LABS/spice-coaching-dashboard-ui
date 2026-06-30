import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('concatenates basic strings and ignores falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('supports arrays and object maps', () => {
    expect(cn(['a', ['b']], { c: true, d: false })).toBe('a b c');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
    expect(cn('px-2 py-2', 'p-6')).toBe('p-6');
  });
});
