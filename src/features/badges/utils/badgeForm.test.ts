import {
  assignSequencesByOrder,
  dateRangeValidationMessage,
  diffBadgeSequenceChanges,
  getMutationErrorMessage,
  hasActiveBadgeFilters,
  isDateRangeInvalid,
  nextGlobalBadgeSequence,
  objectNameFromStoragePath,
  reorderBadges,
  sortBadgesBySequenceAsc,
  toBadgeWriteBody,
} from '@/features/badges/utils/badgeForm';
import { EMPTY_BADGE_FILTERS } from '@/features/badges/types/badge.types';
import type { AdminBadge } from '@/features/badges/types/badge.types';

function makeBadge(
  overrides: Partial<AdminBadge> & Pick<AdminBadge, 'id' | 'name' | 'sequence'>,
): AdminBadge {
  return {
    domain: 'd',
    image_storage_path: 'x',
    module_ids: [],
    modules: [],
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    ...overrides,
  };
}

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

  it('sorts badges by sequence ascending with nulls last', () => {
    const badges = [
      makeBadge({ id: 'c', name: 'C', sequence: 3 }),
      makeBadge({ id: 'a', name: 'A', sequence: 1 }),
      makeBadge({ id: 'b', name: 'B', sequence: 2 }),
      makeBadge({ id: 'z', name: 'Z', sequence: null }),
    ];
    expect(sortBadgesBySequenceAsc(badges).map((badge) => badge.id)).toEqual([
      'a',
      'b',
      'c',
      'z',
    ]);
  });

  it('detects active filters and invalid date ranges', () => {
    expect(hasActiveBadgeFilters(EMPTY_BADGE_FILTERS)).toBe(false);
    expect(
      hasActiveBadgeFilters({
        ...EMPTY_BADGE_FILTERS,
        createdBy: 'admin@example.com',
      }),
    ).toBe(true);
    expect(isDateRangeInvalid('2026-04-10', '2026-04-01')).toBe(true);
    expect(isDateRangeInvalid('2026-04-01', '2026-04-10')).toBe(false);
    expect(isDateRangeInvalid('', '2026-04-10')).toBe(true);
    expect(isDateRangeInvalid('2026-04-10', '')).toBe(true);
    expect(isDateRangeInvalid('', '')).toBe(false);
    expect(dateRangeValidationMessage('', '2026-04-10')).toBe(
      'Both from and to dates are required.',
    );
    expect(dateRangeValidationMessage('2026-04-10', '2026-04-01')).toBe(
      'From date must be on or before to date.',
    );
    expect(dateRangeValidationMessage('2026-04-01', '2026-04-10')).toBeNull();
  });

  it('surfaces API problem-details detail for mutation errors', () => {
    expect(
      getMutationErrorMessage({
        status: 409,
        data: {
          type: 'docs/error-codes.json#badge_name_conflict',
          title: 'Badge Name Conflict',
          status: 409,
          detail: "An active badge named 'asdfd' already exists.",
          code: 'badge_name_conflict',
        },
      }),
    ).toBe("An active badge named 'asdfd' already exists.");
    expect(getMutationErrorMessage({ status: 500 })).toBe(
      'Request failed (500)',
    );
    expect(getMutationErrorMessage({})).toBe(
      'Something went wrong. Please try again.',
    );
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

  it('reorders badges and diffs only changed sequences', () => {
    const badges = [
      makeBadge({ id: 'a', name: 'A', sequence: 1 }),
      makeBadge({ id: 'b', name: 'B', sequence: 2 }),
      makeBadge({ id: 'c', name: 'C', sequence: 3 }),
    ];

    const draft = reorderBadges(badges, 0, 2);
    expect(draft.map((badge) => badge.id)).toEqual(['b', 'c', 'a']);
    expect(
      assignSequencesByOrder(draft).map((badge) => badge.sequence),
    ).toEqual([1, 2, 3]);

    const changes = diffBadgeSequenceChanges(badges, draft);
    expect(changes).toEqual([
      expect.objectContaining({
        badge: expect.objectContaining({ id: 'b' }),
        fromSequence: 2,
        toSequence: 1,
      }),
      expect.objectContaining({
        badge: expect.objectContaining({ id: 'c' }),
        fromSequence: 3,
        toSequence: 2,
      }),
      expect.objectContaining({
        badge: expect.objectContaining({ id: 'a' }),
        fromSequence: 1,
        toSequence: 3,
      }),
    ]);
    expect(diffBadgeSequenceChanges(badges, badges)).toEqual([]);
  });
});
