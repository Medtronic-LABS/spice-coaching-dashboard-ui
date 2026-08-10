import {
  hasActiveBadgeFilters,
  isAssignablePublishedModule,
  isDateRangeInvalid,
  nextGlobalBadgeSequence,
  objectNameFromStoragePath,
  findSequenceNeighbor,
  sortBadgesBySequenceAsc,
  toBadgeWriteBody,
} from '@/features/badges/utils/badgeForm';
import { EMPTY_BADGE_FILTERS } from '@/features/badges/types/badge.types';
import type { AdminBadge } from '@/features/badges/types/badge.types';

describe('badgeForm utils', () => {
  it('parses object name from bucket storage paths', () => {
    expect(
      objectNameFromStoragePath(
        'microcoaching-uploads/badges/safe-motherhood.png',
      ),
    ).toBe('badges/safe-motherhood.png');
    expect(objectNameFromStoragePath('uploads/a.png')).toBe('uploads/a.png');
    expect(objectNameFromStoragePath('badges/a.png')).toBe('badges/a.png');
  });

  it('treats chatbot FAQ-only modules as not assignable', () => {
    expect(isAssignablePublishedModule({ chatbot_faqs_only: true })).toBe(
      false,
    );
    expect(isAssignablePublishedModule({ chatbot_faqs_only: false })).toBe(
      true,
    );
    expect(isAssignablePublishedModule({})).toBe(true);
  });

  it('computes next global sequence without an upper cap', () => {
    expect(nextGlobalBadgeSequence([])).toBe(1);
    expect(
      nextGlobalBadgeSequence([
        { sequence: 1 },
        { sequence: 30 },
        { sequence: null },
      ]),
    ).toBe(31);
  });

  it('finds sequence neighbors for reorder', () => {
    const badges: AdminBadge[] = [
      {
        id: 'a',
        name: 'A',
        domain: 'd',
        image_storage_path: 'x',
        module_ids: [],
        modules: [],
        status: 'active',
        sequence: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        created_by: null,
        updated_by: null,
      },
      {
        id: 'b',
        name: 'B',
        domain: 'd',
        image_storage_path: 'x',
        module_ids: [],
        modules: [],
        status: 'active',
        sequence: 2,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        created_by: null,
        updated_by: null,
      },
      {
        id: 'c',
        name: 'C',
        domain: 'd',
        image_storage_path: 'x',
        module_ids: [],
        modules: [],
        status: 'active',
        sequence: 3,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        created_by: null,
        updated_by: null,
      },
    ];
    expect(findSequenceNeighbor(badges, 'b', 'up')?.id).toBe('a');
    expect(findSequenceNeighbor(badges, 'b', 'down')?.id).toBe('c');
    expect(findSequenceNeighbor(badges, 'a', 'up')).toBeNull();
    expect(sortBadgesBySequenceAsc(badges).map((b) => b.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('detects active filters and invalid date ranges', () => {
    expect(hasActiveBadgeFilters(EMPTY_BADGE_FILTERS)).toBe(false);
    expect(
      hasActiveBadgeFilters({ ...EMPTY_BADGE_FILTERS, domain: 'Hypertension' }),
    ).toBe(true);
    expect(isDateRangeInvalid('2026-04-10', '2026-04-01')).toBe(true);
    expect(isDateRangeInvalid('2026-04-01', '2026-04-10')).toBe(false);
  });

  it('builds write bodies for sequence updates', () => {
    expect(
      toBadgeWriteBody(
        {
          name: 'Champion',
          domain: 'hypertension',
          image_storage_path: 'badges/a.png',
          module_ids: ['m1'],
        },
        null,
      ),
    ).toEqual({
      name: 'Champion',
      domain: 'hypertension',
      image_storage_path: 'badges/a.png',
      module_ids: ['m1'],
      sequence: null,
    });
  });
});
