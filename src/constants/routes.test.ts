import { describe, expect, it } from 'vitest';
import { buildPath, paths, ROUTE_PREFIX } from '@/constants/routes';

describe('routes', () => {
  it('prefixes app routes', () => {
    expect(paths.home).toBe(`${ROUTE_PREFIX}/`);
    expect(paths.moduleLibrary).toBe(`${ROUTE_PREFIX}/module-library`);
    expect(paths.configs).toBe(`${ROUTE_PREFIX}/configs`);
  });

  it('buildPath replaces params with encoded values', () => {
    expect(
      buildPath(paths.adminModuleReviewDetails, { moduleId: 'mod 001' }),
    ).toBe(`${ROUTE_PREFIX}/module-library/review/mod%20001/details`);
  });

  it('buildPath supports multiple params', () => {
    expect(
      buildPath(`${ROUTE_PREFIX}/modules/:id/steps/:stepId`, {
        id: 'mod-1',
        stepId: 's/2',
      }),
    ).toBe(`${ROUTE_PREFIX}/modules/mod-1/steps/s%2F2`);
  });
});
