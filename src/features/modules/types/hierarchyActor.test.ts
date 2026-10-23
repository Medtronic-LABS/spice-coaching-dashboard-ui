import {
  actorNameFromMetadata,
  formatHierarchyActorName,
  normalizeHierarchyActorRef,
} from './hierarchyActor';

describe('normalizeHierarchyActorRef', () => {
  it('accepts a finite id and non-empty name', () => {
    expect(normalizeHierarchyActorRef({ id: 7, name: '  Ada  ' })).toEqual({
      id: 7,
      name: 'Ada',
    });
  });

  it('rejects missing id or blank name', () => {
    expect(normalizeHierarchyActorRef({ name: 'Ada' })).toBeNull();
    expect(normalizeHierarchyActorRef({ id: 7, name: '  ' })).toBeNull();
  });
});

describe('actorNameFromMetadata', () => {
  it('reads a trimmed string value', () => {
    expect(
      actorNameFromMetadata({ discarded_by: '  Rina  ' }, 'discarded_by'),
    ).toBe('Rina');
  });

  it('reads a name-only object when id is absent', () => {
    expect(
      actorNameFromMetadata(
        { discarded_by: { name: '  Rina  ' } },
        'discarded_by',
      ),
    ).toBe('Rina');
  });

  it('reads a full actor ref object', () => {
    expect(
      actorNameFromMetadata(
        { deactivated_by: { id: 3, name: 'Rokeya' } },
        'deactivated_by',
      ),
    ).toBe('Rokeya');
  });

  it('returns undefined for missing metadata or blank values', () => {
    expect(actorNameFromMetadata(null, 'discarded_by')).toBeUndefined();
    expect(
      actorNameFromMetadata({ discarded_by: '  ' }, 'discarded_by'),
    ).toBeUndefined();
    expect(actorNameFromMetadata({}, 'discarded_by')).toBeUndefined();
  });
});

describe('formatHierarchyActorName', () => {
  it('falls back to an em dash when empty', () => {
    expect(formatHierarchyActorName('Ada')).toBe('Ada');
    expect(formatHierarchyActorName('  ')).toBe('—');
    expect(formatHierarchyActorName(undefined)).toBe('—');
  });
});
