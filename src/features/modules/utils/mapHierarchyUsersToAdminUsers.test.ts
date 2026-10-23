import { describe, expect, it } from 'vitest';
import {
  buildDistrictNameById,
  formatAssignmentUserLocation,
  mapHierarchyRole,
  mapHierarchyUserToAdminUser,
  mapHierarchyUsersToAdminUsers,
  parseDistrictListResponse,
  parseDivisionListResponse,
  parseHierarchyUserListResponse,
  parseUpazilaListResponse,
  userMatchesUpazila,
} from './mapHierarchyUsersToAdminUsers';

describe('mapHierarchyRole', () => {
  it('maps hierarchy and legacy short roles', () => {
    expect(mapHierarchyRole('AREA_MANAGER')).toBe('AM');
    expect(mapHierarchyRole('AM')).toBe('AM');
    expect(mapHierarchyRole('PO')).toBe('PO');
    expect(mapHierarchyRole('SHASTIYA_KORMI')).toBe('SK');
    expect(mapHierarchyRole('SK')).toBe('SK');
    expect(mapHierarchyRole('UNKNOWN')).toBeNull();
  });
});

describe('mapHierarchyUserToAdminUser', () => {
  const districts = buildDistrictNameById([{ id: 10, name: 'Lalmonirhat' }]);

  it('maps hierarchy roles, district name, and multi-upazila', () => {
    const mapped = mapHierarchyUserToAdminUser(
      {
        id: 21,
        name: 'SK User',
        role: 'SHASTIYA_KORMI',
        parent_id: 20,
        district_id: 10,
        upazilas: [
          { id: 1, name: 'Hatibandha' },
          { id: 2, name: 'Lalmonirhat Sadar' },
        ],
      },
      districts,
    );

    expect(mapped).toEqual({
      id: 21,
      name: 'SK User',
      role: 'SK',
      division: '—',
      division_id: 0,
      district: 'Lalmonirhat',
      district_id: 10,
      upazila: 'Hatibandha',
      upazilas: ['Hatibandha', 'Lalmonirhat Sadar'],
      upazila_ids: [1, 2],
      parent_id: 20,
    });
  });

  it('maps division fields from wire payload', () => {
    const mapped = mapHierarchyUserToAdminUser(
      {
        id: 22,
        name: 'PO User',
        role: 'PO',
        parent_id: 1,
        division_id: 1,
        division: 'Rangpur',
        district_id: 10,
        district: 'Lalmonirhat',
        upazila: 'Hatibandha',
      },
      districts,
    );

    expect(mapped?.division).toBe('Rangpur');
    expect(mapped?.division_id).toBe(1);
    expect(formatAssignmentUserLocation(mapped!)).toBe(
      'Rangpur · Lalmonirhat · Hatibandha',
    );
  });

  it('falls back to District #id when name is missing', () => {
    const mapped = mapHierarchyUserToAdminUser(
      {
        id: 1,
        name: 'AM User',
        role: 'AREA_MANAGER',
        parent_id: null,
        district_id: 99,
        upazilas: [],
      },
      new Map(),
    );

    expect(mapped?.district).toBe('District #99');
    expect(mapped?.upazila).toBeNull();
    expect(mapped?.upazilas).toEqual([]);
    expect(mapped?.upazila_ids).toEqual([]);
  });

  it('prefers wire district name over lookup', () => {
    const mapped = mapHierarchyUserToAdminUser(
      {
        id: 2,
        name: 'PO User',
        role: 'PO',
        parent_id: 1,
        district_id: 10,
        district: 'Wire District',
        upazila: 'Hatibandha',
      },
      districts,
    );

    expect(mapped?.district).toBe('Wire District');
    expect(mapped?.upazilas).toEqual(['Hatibandha']);
  });

  it('drops rows without a mappable role', () => {
    expect(
      mapHierarchyUserToAdminUser(
        {
          id: 3,
          name: 'X',
          role: 'OTHER',
          parent_id: null,
          district_id: 10,
        },
        districts,
      ),
    ).toBeNull();
  });
});

describe('mapHierarchyUsersToAdminUsers', () => {
  it('maps a list and skips invalid rows', () => {
    const mapped = mapHierarchyUsersToAdminUsers(
      [
        {
          id: 1,
          name: 'AM',
          role: 'AREA_MANAGER',
          parent_id: null,
          district_id: 10,
          upazilas: [],
        },
        { id: 'bad' },
      ],
      buildDistrictNameById([{ id: 10, name: 'Lalmonirhat' }]),
    );
    expect(mapped).toHaveLength(1);
    expect(mapped[0]?.role).toBe('AM');
  });
});

describe('parseHierarchyUserListResponse / parseDistrictListResponse', () => {
  it('parses wrapped hierarchy list and legacy array', () => {
    expect(
      parseHierarchyUserListResponse({
        users: [{ id: 1 }],
        total: 5,
        total_pages: 1,
        limit: 200,
        offset: 0,
      }),
    ).toEqual({ users: [{ id: 1 }], total: 5 });

    expect(parseHierarchyUserListResponse([{ id: 2 }])).toEqual({
      users: [{ id: 2 }],
      total: 1,
    });
  });

  it('parses district list envelope', () => {
    expect(
      parseDistrictListResponse({
        districts: [
          { id: 10, name: 'Lalmonirhat', division_id: 1 },
          { id: 'x', name: 'bad' },
        ],
        total: 1,
      }),
    ).toEqual({
      districts: [{ id: 10, name: 'Lalmonirhat', division_id: 1 }],
      total: 1,
    });
  });

  it('parses division list envelope', () => {
    expect(
      parseDivisionListResponse({
        divisions: [
          { id: 1, name: 'Rangpur' },
          { id: 'x', name: 'bad' },
        ],
        total: 1,
      }),
    ).toEqual({
      divisions: [{ id: 1, name: 'Rangpur' }],
      total: 1,
    });
  });
});

describe('userMatchesUpazila', () => {
  it('matches any upazila on the user', () => {
    const user = {
      upazila: 'Hatibandha',
      upazilas: ['Hatibandha', 'Lalmonirhat Sadar'],
    };
    expect(userMatchesUpazila(user, 'Lalmonirhat Sadar')).toBe(true);
    expect(userMatchesUpazila(user, 'Other')).toBe(false);
    expect(userMatchesUpazila(user, '')).toBe(true);
  });
});

describe('parseUpazilaListResponse', () => {
  it('parses paginated upazila rows and skips invalid entries', () => {
    const parsed = parseUpazilaListResponse({
      upazilas: [
        { id: 1, name: 'Hatibandha', district_id: 10 },
        { id: 2, name: '  ', district_id: 10 },
        { id: 'x', name: 'Bad', district_id: 10 },
        { id: 3, name: 'Lalmonirhat Sadar', district_id: 10 },
      ],
      total: 2,
    });
    expect(parsed).toEqual({
      upazilas: [
        { id: 1, name: 'Hatibandha', district_id: 10 },
        { id: 3, name: 'Lalmonirhat Sadar', district_id: 10 },
      ],
      total: 2,
    });
  });
});
