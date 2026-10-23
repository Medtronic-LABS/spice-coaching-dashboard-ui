import { describe, expect, it } from 'vitest';
import {
  adminModuleReviewPaths,
  buildPath,
  legacyPaths,
  paths,
  ROUTE_PREFIX,
  routeSegments,
} from '@/constants/routes';

describe('routes', () => {
  it('prefixes app routes from routeSegments', () => {
    expect(paths.home).toBe(`${ROUTE_PREFIX}/`);
    expect(paths.moduleLibrary).toBe(
      `${ROUTE_PREFIX}/${routeSegments.moduleLibrary}`,
    );
    expect(paths.uploadKnowledge).toBe(
      `${ROUTE_PREFIX}/${routeSegments.knowledge}`,
    );
    expect(paths.ingestDocument).toBe(
      `${ROUTE_PREFIX}/${routeSegments.ingest}`,
    );
    expect(paths.videoUpload).toBe(
      `${ROUTE_PREFIX}/${routeSegments.ingest}/video`,
    );
    expect(paths.ingestHistory).toBe(
      `${ROUTE_PREFIX}/${routeSegments.ingest}/history`,
    );
    expect(paths.adminDashboard).toBe(
      `${ROUTE_PREFIX}/${routeSegments.dashboard}`,
    );
    expect(paths.configs).toBe(`${ROUTE_PREFIX}/${routeSegments.configs}`);
  });

  it('keeps legacy paths for redirect compatibility', () => {
    expect(legacyPaths.uploadKnowledge).toBe(
      `${ROUTE_PREFIX}/${routeSegments.moduleLibrary}/upload-knowledge`,
    );
    expect(legacyPaths.ingestDocument).toBe(
      `${ROUTE_PREFIX}/${routeSegments.moduleLibrary}/ingest`,
    );
    expect(legacyPaths.videoUpload).toBe(
      `${ROUTE_PREFIX}/${routeSegments.moduleLibrary}/ingest-video`,
    );
    expect(legacyPaths.ingestHistory).toBe(
      `${ROUTE_PREFIX}/${routeSegments.moduleLibrary}/ingest-history`,
    );
    expect(legacyPaths.adminDashboard).toBe(`${ROUTE_PREFIX}/admin-dashboard`);
  });

  it('buildPath replaces params with encoded values', () => {
    expect(
      buildPath(paths.adminModuleReviewDetails, { moduleId: 'mod 001' }),
    ).toBe(
      `${ROUTE_PREFIX}/${routeSegments.moduleLibrary}/review/mod%20001/details`,
    );
  });

  it('adminModuleReviewPaths helpers encode module ids', () => {
    expect(adminModuleReviewPaths.details('mod 001')).toBe(
      `${ROUTE_PREFIX}/${routeSegments.moduleLibrary}/review/mod%20001/details`,
    );
    expect(adminModuleReviewPaths.quiz('mod-1')).toBe(
      `${ROUTE_PREFIX}/${routeSegments.moduleLibrary}/review/mod-1/quiz`,
    );
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
