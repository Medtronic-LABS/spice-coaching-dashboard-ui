import { normalizeAdminBadge } from '@/features/badges/api/adminBadgesApi';

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
