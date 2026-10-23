import {
  normalizeAdminBadge,
  normalizeBadgeActorName,
} from '@/features/badges/api/adminBadgesApi';

describe('normalizeBadgeActorName', () => {
  it('reads names from actor objects, strings, and null', () => {
    expect(normalizeBadgeActorName({ id: 422, name: 'Mudassar Raza' })).toBe(
      'Mudassar Raza',
    );
    expect(normalizeBadgeActorName('alice')).toBe('alice');
    expect(normalizeBadgeActorName({ id: 1, name: '  ' })).toBeNull();
    expect(normalizeBadgeActorName(null)).toBeNull();
  });
});

describe('normalizeAdminBadge', () => {
  it('normalizes a valid badge payload', () => {
    const badge = normalizeAdminBadge({
      id: 'b1',
      name: 'Champion',
      domain: 'hypertension',
      image_storage_path: 'badges/a.png',
      module_ids: ['m1', 'm2'],
      status: 'active',
      sequence: 4,
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-02T00:00:00.000Z',
      created_by: 'alice',
      updated_by: null,
    });

    expect(badge).toEqual({
      id: 'b1',
      name: 'Champion',
      domain: 'hypertension',
      image_storage_path: 'badges/a.png',
      module_ids: ['m1', 'm2'],
      modules: [
        { id: 'm1', title: {} },
        { id: 'm2', title: {} },
      ],
      status: 'active',
      sequence: 4,
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-02T00:00:00.000Z',
      created_by: 'alice',
      updated_by: null,
    });
  });

  it('maps created_by and updated_by actor objects to display names', () => {
    const badge = normalizeAdminBadge({
      id: 'b1',
      name: 'Champion',
      domain: 'hypertension',
      image_storage_path: 'badges/a.png',
      module_ids: ['m1'],
      status: 'active',
      sequence: 19,
      created_at: '2026-08-17T05:53:01.318700Z',
      updated_at: '2026-08-17T05:53:01.318700Z',
      created_by: { id: 422, name: 'Mudassar Raza' },
      updated_by: { id: 422, name: 'Mudassar Raza' },
    });

    expect(badge?.created_by).toBe('Mudassar Raza');
    expect(badge?.updated_by).toBe('Mudassar Raza');
  });

  it('prefers modules payload titles when present', () => {
    const badge = normalizeAdminBadge({
      id: 'b1',
      name: 'Champion',
      domain: 'hypertension',
      image_storage_path: 'badges/a.png',
      module_ids: ['m1'],
      modules: [{ id: 'm1', title: { bn: 'মডিউল', en: 'Module One' } }],
      status: 'active',
      sequence: null,
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-02T00:00:00.000Z',
      created_by: null,
      updated_by: null,
    });

    expect(badge?.modules).toEqual([
      { id: 'm1', title: { bn: 'মডিউল', en: 'Module One' } },
    ]);
    expect(badge?.module_ids).toEqual(['m1']);
  });

  it('returns null for incomplete payloads', () => {
    expect(normalizeAdminBadge({ id: 'b1', name: 'x' })).toBeNull();
  });
});
