import { baseApi } from '@/store/apis/base';
import { spiceAdminApiUrl, spiceUserApiUrl } from '@/config/spiceConfig';
import { getAuthSession } from '@/features/auth/services/authSession';
import {
  getSpiceRequestHeaders,
  getSpiceTenantId,
} from '@/config/spiceSession';
import { SPICE_COUNTRY_ID } from '@/features/module-library/constants/spiceRegionConstants';
import { parseSpiceRegionListResponse } from '@/features/module-library/utils/parseSpiceRegionListResponse';
import { parseSpiceUserListResponse } from '@/features/module-library/utils/parseSpiceUserListResponse';
import { extractSpiceEntityList } from '@/features/module-library/utils/parseSpiceSuccessResponse';
import type { LocalizedString } from '@/types/localized';
import { parseLocalizedStringField } from '@/features/module-library/utils/localizedWire';

export type AssignmentType = 'individual' | 'po_sk' | 'geographical' | 'group';

export type AdminUserRole = 'AM' | 'PO' | 'SK';

export interface AssignmentUser {
  id: number;
  name: string;
  role: AdminUserRole;
  district: string;
  upazila: string | null;
  parent_id: number | null;
}

export interface ModuleAssignment {
  id: string;
  module_id: string;
  module_title: LocalizedString | null;
  assignment_type: AssignmentType;
  tenant_id: number | null;
  user_id: number | null;
  user?: AssignmentUser | null;
  upazila?: string | null;
  assigned_by: number;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

export interface FetchAssignmentsParams {
  module_id?: string;
  assignment_type?: AssignmentType;
}

export interface CreateAssignmentRequest {
  module_id: string;
  assignment_type: AssignmentType;
  user_ids?: number[];
  tenant_ids?: number[];
  upazilas?: string[];
}

export interface AdminUser {
  id: number;
  name: string;
  role: AdminUserRole;
  district: string;
  upazila: string | null;
  parent_id: number | null;
}

function parseAdminUsersResponse(response: unknown): AdminUser[] {
  if (!Array.isArray(response)) return [];

  return response.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const id = record.id;
    const name = record.name;
    const role = record.role;
    const district = record.district;
    const upazila = record.upazila;
    const parentId = record.parent_id;

    if (
      typeof id !== 'number' ||
      typeof name !== 'string' ||
      typeof district !== 'string'
    ) {
      return [];
    }

    const parsedUpazila =
      upazila === null || upazila === undefined
        ? null
        : typeof upazila === 'string'
          ? upazila
          : null;

    if (role !== 'AM' && role !== 'PO' && role !== 'SK') {
      return [];
    }

    return [
      {
        id,
        name,
        role,
        district,
        upazila: parsedUpazila,
        parent_id: typeof parentId === 'number' ? parentId : null,
      },
    ];
  });
}

export function getProgramOrganizers(users: AdminUser[]): AdminUser[] {
  return users.filter((user) => user.role === 'PO');
}

export function getSkUsers(users: AdminUser[]): AdminUser[] {
  return users.filter((user) => user.role === 'SK');
}

export function getUniqueDistricts(users: AdminUser[]): string[] {
  return Array.from(new Set(users.map((user) => user.district))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getUniqueUpazilas(
  users: AdminUser[],
  districtFilter?: string,
): string[] {
  return Array.from(
    new Set(
      users
        .filter((user) => user.upazila)
        .filter((user) => !districtFilter || user.district === districtFilter)
        .map((user) => user.upazila as string),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export interface CreateAssignmentResponse {
  assigned_count: number;
  assignment_ids: string[];
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
    fetchAssignments: builder.query<
      ModuleAssignment[],
      FetchAssignmentsParams | void
    >({
      query: (params) => ({
        url: '/admin/assignments',
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (response: unknown) => {
        if (!Array.isArray(response)) return [];
        return response.flatMap((item) => {
          if (!item || typeof item !== 'object') return [];
          const record = item as Record<string, unknown>;
          const id = record.id;
          const module_id = record.module_id;
          if (typeof id !== 'string' || typeof module_id !== 'string') {
            return [];
          }
          const moduleTitleRaw = parseLocalizedStringField(
            record,
            'module_title',
            'module_title_bn',
            'module_title_en',
          );
          return [
            {
              id,
              module_id,
              module_title: Object.keys(moduleTitleRaw).length
                ? moduleTitleRaw
                : null,
              assignment_type: record.assignment_type as AssignmentType,
              tenant_id:
                typeof record.tenant_id === 'number' ? record.tenant_id : null,
              user_id:
                typeof record.user_id === 'number' ? record.user_id : null,
              user:
                record.user && typeof record.user === 'object'
                  ? (record.user as AssignmentUser)
                  : null,
              upazila:
                typeof record.upazila === 'string' ? record.upazila : null,
              assigned_by:
                typeof record.assigned_by === 'number' ? record.assigned_by : 0,
              assigned_at:
                typeof record.assigned_at === 'string'
                  ? record.assigned_at
                  : '',
              created_at:
                typeof record.created_at === 'string' ? record.created_at : '',
              updated_at:
                typeof record.updated_at === 'string' ? record.updated_at : '',
            } satisfies ModuleAssignment,
          ];
        });
      },
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
    revokeAssignment: builder.mutation<{ status: string }, string>({
      query: (id) => ({
        url: `/admin/assignments/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
    }),
    fetchAdminUsers: builder.query<AdminUser[], void>({
      query: () => ({
        url: '/admin/users',
        method: 'GET',
      }),
      transformResponse: parseAdminUsersResponse,
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
  useFetchAssignmentsQuery,
  useLazyFetchAssignmentsQuery,
  useCreateAssignmentMutation,
  useRevokeAssignmentMutation,
  useFetchAdminUsersQuery,
  useLazyFetchAdminUsersQuery,
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
