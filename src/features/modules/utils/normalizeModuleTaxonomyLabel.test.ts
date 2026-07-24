import { describe, expect, it } from 'vitest';
import { normalizeModuleTaxonomyLabel } from './normalizeModuleTaxonomyLabel';

describe('normalizeModuleTaxonomyLabel', () => {
  it('normalizes labels to lowercase snake_case', () => {
    expect(normalizeModuleTaxonomyLabel('RMNCH')).toBe('rmnch');
    expect(normalizeModuleTaxonomyLabel('ANC Referral')).toBe('anc_referral');
    expect(normalizeModuleTaxonomyLabel('  Blood-Pressure  ')).toBe(
      'blood_pressure',
    );
  });

  it('strips leading and trailing separators', () => {
    expect(normalizeModuleTaxonomyLabel('__clinical__')).toBe('clinical');
  });

  it('returns empty string for blank input', () => {
    expect(normalizeModuleTaxonomyLabel('   ')).toBe('');
  });
});
