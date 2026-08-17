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

  it('uses updated_by.name from actor objects and treats null as empty', () => {
    expect(
      normalizeConfigThresholdChangeItem({
        previous_value_json: 2,
        current_value_json: 1,
        updated_by: { id: 422, name: 'Mudassar Raza' },
        updated_at: '2026-08-17T05:48:10.167239Z',
      }),
    ).toEqual({
      previous_value_json: 2,
      current_value_json: 1,
      updated_by: 'Mudassar Raza',
      updated_at: '2026-08-17T05:48:10.167239Z',
    });

    expect(
      normalizeConfigThresholdChangeItem({
        previous_value_json: 3,
        current_value_json: 1,
        updated_by: null,
        updated_at: '2026-08-14T20:09:43.027496Z',
      }).updated_by,
    ).toBe('');
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
