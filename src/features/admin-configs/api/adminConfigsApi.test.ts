import { describe, expect, it } from 'vitest';
import {
  normalizeConfigThresholdChangeItem,
  normalizeConfigThresholdChangeListResponse,
} from '@/features/admin-configs/api/adminConfigsApi';

describe('normalizeConfigThresholdChangeItem', () => {
  it('maps API fields and defaults missing actor/timestamp', () => {
    expect(
      normalizeConfigThresholdChangeItem({
        previous_value_json: 30,
        current_value_json: 45,
        updated_by: 'Jane Admin',
        updated_at: '2026-08-12T10:00:00Z',
      }),
    ).toEqual({
      previous_value_json: 30,
      current_value_json: 45,
      updated_by: 'Jane Admin',
      updated_at: '2026-08-12T10:00:00Z',
    });

    expect(normalizeConfigThresholdChangeItem({})).toEqual({
      previous_value_json: null,
      current_value_json: null,
      updated_by: '',
      updated_at: '',
    });
  });
});

describe('normalizeConfigThresholdChangeListResponse', () => {
  it('normalizes the paginated envelope', () => {
    expect(
      normalizeConfigThresholdChangeListResponse({
        changes: [
          {
            previous_value_json: 30,
            current_value_json: 45,
            updated_by: 'admin',
            updated_at: '2026-08-12T10:00:00Z',
          },
        ],
        total_changes: 3,
        total_pages: 2,
        limit: 1,
        offset: 0,
      }),
    ).toEqual({
      changes: [
        {
          previous_value_json: 30,
          current_value_json: 45,
          updated_by: 'admin',
          updated_at: '2026-08-12T10:00:00Z',
        },
      ],
      total_changes: 3,
      total_pages: 2,
      limit: 1,
      offset: 0,
    });
  });

  it('returns an empty envelope for invalid payloads', () => {
    expect(normalizeConfigThresholdChangeListResponse(null)).toEqual({
      changes: [],
      total_changes: 0,
      total_pages: 0,
      limit: 0,
      offset: 0,
    });
  });
});
