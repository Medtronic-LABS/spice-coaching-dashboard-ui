import { useGetModuleDetailQuery } from '@/features/module-library/api/adminModulesApi';

export type UseAdminModuleDetailQueryOptions = {
  skip?: boolean;
  /**
   * When true, reuse RTK Query cache and skip automatic refetch on mount / window focus
   * (subject to `keepUnusedDataFor` on the endpoint). Omit or false for always-fresh behavior
   * from admin API defaults.
   */
  useCache?: boolean;
};

export function useAdminModuleDetailQuery(
  moduleId: string,
  options?: UseAdminModuleDetailQueryOptions,
) {
  const skip = options?.skip ?? !moduleId;
  const useCache = options?.useCache === true;

  return useGetModuleDetailQuery(moduleId, {
    skip,
    ...(useCache
      ? {
          refetchOnMountOrArgChange: false,
          refetchOnFocus: false,
        }
      : {}),
  });
}
