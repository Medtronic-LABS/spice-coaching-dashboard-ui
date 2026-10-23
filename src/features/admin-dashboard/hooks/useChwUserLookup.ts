import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminUser } from '@/features/modules/api/adminAssignmentApi';
import { useLazyFetchHierarchyUsersPageQuery } from '@/features/modules/api/adminAssignmentApi';

export interface ChwUserLookup {
  getUser: (userId: number | null | undefined) => AdminUser | undefined;
  isLoading: boolean;
}

export function useChwUserLookup(): ChwUserLookup {
  const [usersById, setUsersById] = useState<Record<number, AdminUser>>({});
  const [fetchUsersPage, { isLoading }] = useLazyFetchHierarchyUsersPageQuery();

  const loadUsers = useCallback(async () => {
    const merged: Record<number, AdminUser> = {};
    let offset = 0;
    const limit = 200;
    let total = Number.POSITIVE_INFINITY;

    while (offset < total) {
      const page = await fetchUsersPage({ limit, offset }).unwrap();
      total = page.total;
      for (const user of page.users) {
        merged[user.id] = user;
      }
      offset += page.users.length;
      if (page.users.length === 0) break;
    }

    setUsersById(merged);
  }, [fetchUsersPage]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const getUser = useCallback(
    (userId: number | null | undefined) => {
      if (userId == null) return undefined;
      return usersById[userId];
    },
    [usersById],
  );

  return useMemo(
    () => ({
      getUser,
      isLoading,
    }),
    [getUser, isLoading],
  );
}

export function enrichRowsWithUserLookup<
  T extends {
    skId: number | null;
    skName: string | null;
    district: string | null;
    upazila: string | null;
  },
>(rows: T[], lookup: ChwUserLookup): T[] {
  return rows.map((row) => {
    if (!row.skId) return row;
    const user = lookup.getUser(row.skId);
    if (!user) return row;
    return {
      ...row,
      skName: row.skName ?? user.name,
      district: row.district ?? user.district,
      upazila: row.upazila ?? user.upazila ?? user.upazilas[0] ?? null,
    };
  });
}
