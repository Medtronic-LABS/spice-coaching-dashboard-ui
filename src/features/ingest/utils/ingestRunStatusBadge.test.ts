import { describe, expect, it } from 'vitest';
import { getIngestRunStatusBadgeProps } from '@/features/ingest/utils/ingestRunStatusBadge';

describe('getIngestRunStatusBadgeProps', () => {
  it('maps ingestion run statuses to semantic badge props', () => {
    expect(getIngestRunStatusBadgeProps('running')).toEqual({
      status: 'info',
      label: 'Running',
    });
    expect(getIngestRunStatusBadgeProps('succeeded')).toEqual({
      status: 'success',
      label: 'Succeeded',
    });
    expect(getIngestRunStatusBadgeProps('partially_succeeded')).toEqual({
      status: 'warning',
      label: 'Partially Succeeded',
    });
    expect(getIngestRunStatusBadgeProps('failed')).toEqual({
      status: 'critical',
      label: 'Failed',
    });
    expect(getIngestRunStatusBadgeProps(undefined)).toEqual({
      status: 'neutral',
      label: 'Unknown',
    });
  });
});
