import { describe, expect, it } from 'vitest';
import { mapSsoRoleToAppRole } from './mapSsoRoleToAppRole';

describe('mapSsoRoleToAppRole', () => {
  it('maps SUPER_USER to programManager', () => {
    expect(mapSsoRoleToAppRole('SUPER_USER')).toBe('programManager');
  });

  it('maps supervisor roles to supervisor', () => {
    expect(mapSsoRoleToAppRole('SUPERVISOR')).toBe('supervisor');
  });
});
