import { baseApi } from '@/store/apis/base';
import { spiceAdminApiUrl, spiceUserApiUrl } from '@/config/spiceConfig';
import { getAuthSession } from '@/features/auth/services/authSession';
import {
  getSpiceRequestHeaders,
  getSpiceTenantId,
} from '@/config/spiceSession';
import { SPICE_COUNTRY_ID } from '@/features/modules/constants/spiceRegionConstants';
import { parseSpiceRegionListResponse } from '@/features/modules/utils/parseSpiceRegionListResponse';
import { parseSpiceUserListResponse } from '@/features/modules/utils/parseSpiceUserListResponse';
import { extractSpiceEntityList } from '@/features/modules/utils/parseSpiceSuccessResponse';
import {
  buildDistrictNameById,
  getHierarchyPageSize,
  mapHierarchyUserToAdminUser,
  mapHierarchyUsersToAdminUsers,
  parseDistrictListResponse,
  parseDivisionListResponse,
  parseHierarchyUserListResponse,
  parseUpazilaListResponse,
} from '@/features/modules/utils/mapHierarchyUsersToAdminUsers';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export type AssignmentSummaryType = 'po_sk' | 'po' | 'sk' | 'geographical';

export type AdminUserRole = 'AM' | 'PO' | 'SK';

export interface AssignmentUser {
  id: number;
  name: string;
  role: AdminUserRole;
  district: string;
  district_id: number;
  upazila: string | null;
  upazilas: string[];
  parent_id: number | null;
}

export interface CreateAssignmentRequest {
  module_id: string;
  user_ids?: number[];
  upazilas?: string[];
  /** When true, PO ids also assign their direct SK children. Default false (PO only). */
  expand_po_assignees?: boolean;
}

export interface ReplaceAssignmentUsersRequest {
  moduleId: string;
  user_ids?: number[];
  upazilas?: string[];
  /** When true, PO ids also assign their direct SK children. Default false (PO only). */
  expand_po_assignees?: boolean;
}

export interface AssignmentUsersMutationBody {
  user_ids?: number[];
  upazilas?: string[];
  expand_po_assignees?: boolean;
}

/** Wire body for module/document assignment create/replace mutations. */
export function buildAssignmentUsersMutationBody(input: {
  user_ids?: number[];
  upazilas?: string[];
  expand_po_assignees?: boolean;
}): AssignmentUsersMutationBody {
  return {
    user_ids: input.user_ids,
    upazilas: input.upazilas,
    ...(input.expand_po_assignees !== undefined
      ? { expand_po_assignees: input.expand_po_assignees }
      : {}),
  };
}

export interface AssignmentUpdateResponse {
  added_count: number;
  removed_count: number;
  assignment_ids: string[];
}

export interface CreateAssignmentResponse {
  assigned_count: number;
  assignment_ids: string[];
}

export interface AdminUser {
  id: number;
  name: string;
  role: AdminUserRole;
  district: string;
  district_id: number;
  upazila: string | null;
  upazilas: string[];
  parent_id: number | null;
}

export interface AdminUpazila {
  id: number;
  name: string;
  district_id: number;
}

export interface AdminDistrict {
  id: number;
  name: string;
}

export interface AdminDivision {
  id: number;
  name: string;
}

export interface HierarchyUsersPageParams {
  limit?: number;
  offset?: number;
  districtId?: number;
  upazilaId?: number;
  /** Case-insensitive substring match on user name. */
  q?: string;
  /** Platform hierarchy role wire values. */
  role?: 'AREA_MANAGER' | 'PO' | 'SHASTIYA_KORMI';
  parentId?: number;
}

export interface PaginatedAdminUsers {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginatedAdminDistricts {
  districts: AdminDistrict[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginatedAdminUpazilas {
  upazilas: AdminUpazila[];
  total: number;
  limit: number;
  offset: number;
}

export interface HierarchyDistrictsPageParams {
  limit?: number;
  offset?: number;
  /** Case-insensitive substring match on district name. */
  q?: string;
}

export interface HierarchyUpazilasPageParams {
  limit?: number;
  offset?: number;
  districtId?: number;
  /** Case-insensitive substring match on upazila name. */
  q?: string;
}

export const ASSIGNMENT_LIST_PAGE_SIZE = 200;
/** Page size for assignment user list fetches (API max is 200). */
export const ASSIGNMENT_USERS_PAGE_SIZE = 200;

function resolveHierarchyPageArgs(
  arg: {
    limit?: number;
    offset?: number;
    q?: string;
  } | void,
): { limit: number; offset: number; nameQuery?: string } {
  const limit =
    arg && typeof arg.limit === 'number'
      ? arg.limit
      : ASSIGNMENT_LIST_PAGE_SIZE;
  const offset = arg && typeof arg.offset === 'number' ? arg.offset : 0;
  const trimmed = arg && typeof arg.q === 'string' ? arg.q.trim() : '';
  return {
    limit,
    offset,
    ...(trimmed ? { nameQuery: trimmed } : {}),
  };
}

export function parseAssignedUsersResponse(response: unknown): AdminUser[] {
  if (!response || typeof response !== 'object') return [];
  const record = response as Record<string, unknown>;
  const users = Array.isArray(record.users) ? record.users : [];
  return users.flatMap((user) => {
    const mapped = mapHierarchyUserToAdminUser(user, new Map());
    return mapped ? [mapped] : [];
  });
}

export interface SpiceDistrict {
  id: number;
  name: string;
  countryId: number;
  tenantId?: number;
}

export interface SpiceChiefdom {
  id: number;
  name: string;
  districtId: number;
  tenantId?: number;
}

export interface SpiceVillage {
  id: number;
  name: string;
  chiefdomId: number;
}

export interface SpiceHealthFacility {
  id: number;
  name: string;
  chiefdomId: number;
  tenantId: number;
}

export interface SpiceUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  tenantId?: number;
  villages?: Array<{ id: number; name: string }>;
}

export interface FetchChwUsersRequest {
  tenantIds: number[];
  searchTerm?: string;
  skip?: number;
  limit?: number;
}

const COMMUNITY_APP_TYPES = ['COMMUNITY'] as const;
const DEFAULT_CHW_PAGE_SIZE = 100;

function resolveCurrentUserTenantId(): string {
  return getAuthSession()?.tenantId ?? getSpiceTenantId();
}

function spiceAdminPost(path: string, body: Record<string, unknown>) {
  return {
    url: `${spiceAdminApiUrl}/${path}`,
    method: 'POST' as const,
    credentials: 'include' as const,
    headers: getSpiceRequestHeaders({ 'Content-Type': 'application/json' }),
    body,
  };
}

function spiceUserPost(path: string, body: Record<string, unknown>) {
  return {
    url: `${spiceUserApiUrl}/${path}`,
    method: 'POST' as const,
    credentials: 'include' as const,
    headers: getSpiceRequestHeaders({ 'Content-Type': 'application/json' }),
    body,
  };
}

function mapHealthFacility(
  item: unknown,
  chiefdomId: number,
): SpiceHealthFacility | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  const id = record.id;
  const name = record.name;
  const tenantId = record.tenantId;
  if (
    typeof id !== 'number' ||
    typeof name !== 'string' ||
    typeof tenantId !== 'number'
  ) {
    return null;
  }
  return { id, name, tenantId, chiefdomId };
}

export const adminAssignmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchModuleAssignedUsers: builder.query<AdminUser[], string>({
      query: (moduleId) => ({
        url: `/admin/assignments/${encodeURIComponent(moduleId)}/users`,
        method: 'GET',
      }),
      transformResponse: parseAssignedUsersResponse,
    }),
    createAssignment: builder.mutation<
      CreateAssignmentResponse,
      CreateAssignmentRequest
    >({
      query: (body) => ({
        url: '/admin/assignments',
        method: 'POST',
        body,
      }),
    }),
    replaceModuleAssignedUsers: builder.mutation<
      AssignmentUpdateResponse,
      ReplaceAssignmentUsersRequest
    >({
      query: ({ moduleId, user_ids, upazilas, expand_po_assignees }) => ({
        url: `/admin/assignments/${encodeURIComponent(moduleId)}/users`,
        method: 'PUT',
        body: buildAssignmentUsersMutationBody({
          user_ids,
          upazilas,
          expand_po_assignees,
        }),
      }),
    }),
    /** Loads every district page — catalogs are typically small. */
    fetchAdminDistricts: builder.query<AdminDistrict[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const pageSize = getHierarchyPageSize();
        const allDistricts: AdminDistrict[] = [];
        let offset = 0;
        let total = Number.POSITIVE_INFINITY;

        while (offset < total) {
          const result = await baseQuery({
            url: '/admin/districts',
            method: 'GET',
            params: { limit: pageSize, offset },
          });
          if (result.error) {
            return { error: result.error as FetchBaseQueryError };
          }
          const page = parseDistrictListResponse(result.data);
          allDistricts.push(...page.districts);
          total = page.total;
          if (page.districts.length === 0) break;
          offset += page.districts.length;
        }

        return { data: allDistricts };
      },
    }),
    fetchAdminDivisions: builder.query<AdminDivision[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const pageSize = getHierarchyPageSize();
        const allDivisions: AdminDivision[] = [];
        let offset = 0;
        let total = Number.POSITIVE_INFINITY;

        while (offset < total) {
          const result = await baseQuery({
            url: '/admin/divisions',
            method: 'GET',
            params: { limit: pageSize, offset },
          });
          if (result.error) {
            return { error: result.error as FetchBaseQueryError };
          }
          const page = parseDivisionListResponse(result.data);
          allDivisions.push(...page.divisions);
          total = page.total;
          if (page.divisions.length === 0) break;
          offset += page.divisions.length;
        }

        return { data: allDivisions };
      },
    }),
    fetchAdminDistrictsPage: builder.query<
      PaginatedAdminDistricts,
      HierarchyDistrictsPageParams | void
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const { limit, offset, nameQuery } = resolveHierarchyPageArgs(arg);
        const result = await baseQuery({
          url: '/admin/districts',
          method: 'GET',
          params: {
            limit,
            offset,
            ...(nameQuery ? { q: nameQuery } : {}),
          },
        });
        if (result.error) {
          return { error: result.error as FetchBaseQueryError };
        }
        const page = parseDistrictListResponse(result.data);
        return {
          data: {
            districts: page.districts,
            total: page.total,
            limit,
            offset,
          },
        };
      },
    }),
    fetchHierarchyUsersPage: builder.query<
      PaginatedAdminUsers,
      HierarchyUsersPageParams
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const limit = arg.limit ?? ASSIGNMENT_USERS_PAGE_SIZE;
        const offset = arg.offset ?? 0;

        const districtsResult = await baseQuery({
          url: '/admin/districts',
          method: 'GET',
          params: { limit: getHierarchyPageSize(), offset: 0 },
        });
        if (districtsResult.error) {
          return { error: districtsResult.error as FetchBaseQueryError };
        }
        const districtPage = parseDistrictListResponse(districtsResult.data);
        const districtNameById = buildDistrictNameById(districtPage.districts);

        const nameQuery = arg.q?.trim();
        const usersResult = await baseQuery({
          url: '/admin/hierarchy/users',
          method: 'GET',
          params: {
            limit,
            offset,
            ...(typeof arg.districtId === 'number'
              ? { district_id: arg.districtId }
              : {}),
            ...(typeof arg.upazilaId === 'number'
              ? { upazila_id: arg.upazilaId }
              : {}),
            ...(nameQuery ? { q: nameQuery } : {}),
            ...(arg.role ? { role: arg.role } : {}),
            ...(typeof arg.parentId === 'number'
              ? { parent_id: arg.parentId }
              : {}),
          },
        });
        if (usersResult.error) {
          return { error: usersResult.error as FetchBaseQueryError };
        }
        const page = parseHierarchyUserListResponse(usersResult.data);
        return {
          data: {
            users: mapHierarchyUsersToAdminUsers(page.users, districtNameById),
            total: page.total,
            limit,
            offset,
          },
        };
      },
    }),
    fetchAdminUsers: builder.query<AdminUser[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const pageSize = getHierarchyPageSize();
        const allDistricts: Array<{ id: number; name: string }> = [];
        let districtOffset = 0;
        let districtTotal = Number.POSITIVE_INFINITY;

        while (districtOffset < districtTotal) {
          const districtResult = await baseQuery({
            url: '/admin/districts',
            method: 'GET',
            params: { limit: pageSize, offset: districtOffset },
          });
          if (districtResult.error) {
            return { error: districtResult.error as FetchBaseQueryError };
          }
          const page = parseDistrictListResponse(districtResult.data);
          allDistricts.push(...page.districts);
          districtTotal = page.total;
          if (page.districts.length === 0) break;
          districtOffset += page.districts.length;
        }

        const districtNameById = buildDistrictNameById(allDistricts);
        const allUsers: unknown[] = [];
        let userOffset = 0;
        let userTotal = Number.POSITIVE_INFINITY;

        while (userOffset < userTotal) {
          const usersResult = await baseQuery({
            url: '/admin/hierarchy/users',
            method: 'GET',
            params: { limit: pageSize, offset: userOffset },
          });
          if (usersResult.error) {
            return { error: usersResult.error as FetchBaseQueryError };
          }
          const page = parseHierarchyUserListResponse(usersResult.data);
          allUsers.push(...page.users);
          userTotal = page.total;
          if (page.users.length === 0) break;
          userOffset += page.users.length;
        }

        return {
          data: mapHierarchyUsersToAdminUsers(allUsers, districtNameById),
        };
      },
    }),
    fetchAdminUpazilasPage: builder.query<
      PaginatedAdminUpazilas,
      HierarchyUpazilasPageParams | void
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const { limit, offset, nameQuery } = resolveHierarchyPageArgs(arg);
        const districtId =
          arg && 'districtId' in arg ? arg.districtId : undefined;
        const result = await baseQuery({
          url: '/admin/upazilas',
          method: 'GET',
          params: {
            limit,
            offset,
            ...(typeof districtId === 'number'
              ? { district_id: districtId }
              : {}),
            ...(nameQuery ? { q: nameQuery } : {}),
          },
        });
        if (result.error) {
          return { error: result.error as FetchBaseQueryError };
        }
        const page = parseUpazilaListResponse(result.data);
        return {
          data: {
            upazilas: page.upazilas,
            total: page.total,
            limit,
            offset,
          },
        };
      },
    }),
    fetchAdminUpazilas: builder.query<
      AdminUpazila[],
      { districtId?: number } | void
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const pageSize = getHierarchyPageSize();
        const districtId =
          arg && 'districtId' in arg ? arg.districtId : undefined;
        const allUpazilas: AdminUpazila[] = [];
        let offset = 0;
        let total = Number.POSITIVE_INFINITY;

        while (offset < total) {
          const result = await baseQuery({
            url: '/admin/upazilas',
            method: 'GET',
            params: {
              limit: pageSize,
              offset,
              ...(typeof districtId === 'number'
                ? { district_id: districtId }
                : {}),
            },
          });
          if (result.error) {
            return { error: result.error as FetchBaseQueryError };
          }
          const page = parseUpazilaListResponse(result.data);
          allUpazilas.push(...page.upazilas);
          total = page.total;
          if (page.upazilas.length === 0) break;
          offset += page.upazilas.length;
        }

        return { data: allUpazilas };
      },
    }),
    /** admin-service POST /district-list */
    fetchDistricts: builder.query<SpiceDistrict[], void>({
      query: () =>
        spiceAdminPost('district-list', { countryId: SPICE_COUNTRY_ID }),
      transformResponse: (response: unknown) =>
        parseSpiceRegionListResponse(response).map((item) => ({
          id: item.id,
          name: item.name,
          countryId: SPICE_COUNTRY_ID,
          tenantId: item.tenantId,
        })),
    }),
    /** admin-service POST /chiefdom-list */
    fetchChiefdoms: builder.query<SpiceChiefdom[], { districtId: number }>({
      query: ({ districtId }) =>
        spiceAdminPost('chiefdom-list', {
          countryId: SPICE_COUNTRY_ID,
          districtId,
        }),
      transformResponse: (response: unknown, _meta, { districtId }) =>
        parseSpiceRegionListResponse(response).map((item) => ({
          id: item.id,
          name: item.name,
          districtId,
          tenantId: item.tenantId,
        })),
    }),
    /** admin-service POST /villages-list */
    fetchVillages: builder.query<
      SpiceVillage[],
      { districtId: number; chiefdomId: number }
    >({
      query: ({ districtId, chiefdomId }) =>
        spiceAdminPost('villages-list', {
          countryId: SPICE_COUNTRY_ID,
          districtId,
          chiefdomId,
        }),
      transformResponse: (response: unknown, _meta, { chiefdomId }) =>
        parseSpiceRegionListResponse(response).map((item) => ({
          id: item.id,
          name: item.name,
          chiefdomId,
        })),
    }),
    /** admin-service POST /healthfacility/chiefdom-list/{chiefdomId} */
    fetchHealthFacilities: builder.query<
      SpiceHealthFacility[],
      { chiefdomId: number }
    >({
      query: ({ chiefdomId }) => ({
        url: `${spiceAdminApiUrl}/healthfacility/chiefdom-list/${chiefdomId}`,
        method: 'POST',
        credentials: 'include',
        headers: getSpiceRequestHeaders({ 'Content-Type': 'application/json' }),
      }),
      transformResponse: (response: unknown, _meta, { chiefdomId }) =>
        extractSpiceEntityList(response)
          .map((item) => mapHealthFacility(item, chiefdomId))
          .filter((item): item is SpiceHealthFacility => item !== null),
    }),
    /** user-service POST /user/admin-users */
    fetchChwUsers: builder.query<SpiceUser[], FetchChwUsersRequest>({
      query: ({ searchTerm = '', skip = 0, limit = DEFAULT_CHW_PAGE_SIZE }) =>
        spiceUserPost('user/admin-users', {
          countryId: SPICE_COUNTRY_ID,
          tenantId: resolveCurrentUserTenantId(),
          // tenantIds,
          appTypes: COMMUNITY_APP_TYPES,
          isSiteUsers: true,
          isFacilityUsersOnly: true,
          searchTerm,
          skip,
          limit,
        }),
      transformResponse: (response: unknown) =>
        parseSpiceUserListResponse(response),
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchModuleAssignedUsersQuery,
  useLazyFetchModuleAssignedUsersQuery,
  useCreateAssignmentMutation,
  useReplaceModuleAssignedUsersMutation,
  useFetchAdminDistrictsQuery,
  useLazyFetchAdminDistrictsQuery,
  useFetchAdminDivisionsQuery,
  useFetchAdminDistrictsPageQuery,
  useLazyFetchAdminDistrictsPageQuery,
  useFetchHierarchyUsersPageQuery,
  useLazyFetchHierarchyUsersPageQuery,
  useFetchAdminUsersQuery,
  useLazyFetchAdminUsersQuery,
  useFetchAdminUpazilasQuery,
  useLazyFetchAdminUpazilasQuery,
  useFetchAdminUpazilasPageQuery,
  useLazyFetchAdminUpazilasPageQuery,
  useFetchDistrictsQuery,
  useFetchChiefdomsQuery,
  useFetchVillagesQuery,
  useFetchHealthFacilitiesQuery,
  useLazyFetchDistrictsQuery,
  useLazyFetchChiefdomsQuery,
  useLazyFetchVillagesQuery,
  useLazyFetchHealthFacilitiesQuery,
  useFetchChwUsersQuery,
  useLazyFetchChwUsersQuery,
} = adminAssignmentApi;
