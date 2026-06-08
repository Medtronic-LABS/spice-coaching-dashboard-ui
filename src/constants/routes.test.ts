import { describe, expect, it } from 'vitest';
import { buildPath, paths, ROUTE_PREFIX } from '@/constants/routes';

describe('routes', () => {
  it('prefixes app routes', () => {
    expect(paths.home).toBe(`${ROUTE_PREFIX}/`);
    expect(paths.chwProfiles).toBe(`${ROUTE_PREFIX}/chw-profiles`);
  });

  it('buildPath replaces params with encoded values', () => {
    expect(buildPath(paths.chwProfileDetail, { id: 'CHW 001' })).toBe(
      `${ROUTE_PREFIX}/chw-profiles/CHW%20001`,
    );
  });

  it('buildPath supports multiple params', () => {
    expect(
      buildPath(`${ROUTE_PREFIX}/supervisors/:id/reports/:reportId`, {
        id: 'sup-1',
        reportId: 'r/2',
      }),
    ).toBe(`${ROUTE_PREFIX}/supervisors/sup-1/reports/r%2F2`);
  });
});
