import { baseApi } from '@/store/apis/base';
import type {
  AdminBadge,
  AdminBadgeListQuery,
  AdminBadgeListResponse,
  AdminBadgeWriteBody,
} from '@/features/badges/types/badge.types';
import {
  sortBadgesBySequenceAsc,
  toBadgeWriteBody,
} from '@/features/badges/utils/badgeForm';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : null;
}

function asNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function normalizeModuleIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item : String(item)))
    .filter((id) => id.trim().length > 0);
}

function normalizeLocalizedTitle(value: unknown): Record<string, string> {
  if (!isPlainObject(value)) return {};
  const title: Record<string, string> = {};
  for (const [locale, text] of Object.entries(value)) {
    if (typeof text === 'string' && text.trim()) {
      title[locale] = text;
    }
  }
  return title;
}

function normalizeModules(
  value: unknown,
  fallbackIds: string[],
): AdminBadge['modules'] {
  if (Array.isArray(value)) {
    const modules: AdminBadge['modules'] = [];
    for (const item of value) {
      if (!isPlainObject(item)) continue;
      const id = asString(item.id) ?? String(item.id ?? '');
      if (!id.trim()) continue;
      modules.push({
        id,
        title: normalizeLocalizedTitle(item.title),
      });
    }
    if (modules.length) return modules;
  }
  return fallbackIds.map((id) => ({ id, title: {} }));
}

export function normalizeAdminBadge(raw: unknown): AdminBadge | null {
  if (!isPlainObject(raw)) return null;
  const id = asString(raw.id);
  const name = asString(raw.name);
  const domain = asString(raw.domain);
  const image_storage_path = asString(raw.image_storage_path);
  const created_at = asString(raw.created_at);
  const updated_at = asString(raw.updated_at);
  if (
    !id ||
    !name ||
    !domain ||
    !image_storage_path ||
    !created_at ||
    !updated_at
  ) {
    return null;
  }
  const module_ids = normalizeModuleIds(raw.module_ids);
  const modules = normalizeModules(raw.modules, module_ids);
  return {
    id,
    name,
    domain,
    image_storage_path,
    module_ids: modules.length
      ? modules.map((module) => module.id)
      : module_ids,
    modules,
    status: asString(raw.status) ?? 'active',
    sequence: asNumberOrNull(raw.sequence),
    created_at,
    updated_at,
    created_by: asNullableString(raw.created_by),
    updated_by: asNullableString(raw.updated_by),
  };
}

function normalizeBadgeListResponse(raw: unknown): AdminBadgeListResponse {
  if (!isPlainObject(raw)) {
    return { badges: [], total: 0, total_pages: 0, limit: 50, offset: 0 };
  }
  const badges = Array.isArray(raw.badges)
    ? raw.badges
        .map((item) => normalizeAdminBadge(item))
        .filter((item): item is AdminBadge => item !== null)
    : [];
  const limit =
    typeof raw.limit === 'number' && Number.isFinite(raw.limit)
      ? Math.max(0, raw.limit)
      : 50;
  const offset =
    typeof raw.offset === 'number' && Number.isFinite(raw.offset)
      ? Math.max(0, raw.offset)
      : 0;
  const total =
    typeof raw.total === 'number' && Number.isFinite(raw.total)
      ? Math.max(0, raw.total)
      : badges.length;
  const total_pages =
    typeof raw.total_pages === 'number' && Number.isFinite(raw.total_pages)
      ? Math.max(0, raw.total_pages)
      : limit > 0
        ? Math.ceil(total / limit)
        : total > 0
          ? 1
          : 0;
  return { badges, total, total_pages, limit, offset };
}

function buildListParams(
  query: AdminBadgeListQuery,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (query.domain?.trim()) params.domain = query.domain.trim();
  if (query.created_by?.length) {
    params.created_by = query.created_by.join(',');
  }
  if (query.created_from?.trim())
    params.created_from = query.created_from.trim();
  if (query.created_to?.trim()) params.created_to = query.created_to.trim();
  if (query.module_title?.length) {
    params.module_title = query.module_title.join(',');
  }
  if (query.q?.trim()) params.q = query.q.trim();
  if (query.sort_by) params.sort_by = query.sort_by;
  if (query.sort_dir) params.sort_dir = query.sort_dir;
  if (typeof query.limit === 'number') params.limit = query.limit;
  if (typeof query.offset === 'number') params.offset = query.offset;
  return params;
}

export type ReorderBadgePairArg = {
  badge: AdminBadge;
  neighbor: AdminBadge;
  /** Current sequence of `badge` (moves onto neighbor). */
  badgeSequence: number;
  /** Current sequence of `neighbor` (moves onto badge). */
  neighborSequence: number;
};

function patchBadgeSequencesInCaches(
  dispatch: {
    (action: ReturnType<typeof adminBadgesApi.util.updateQueryData>): {
      undo: () => void;
    };
  },
  getState: () => unknown,
  badgeId: string,
  neighborId: string,
  badgeNextSequence: number,
  neighborNextSequence: number,
): Array<{ undo: () => void }> {
  const cachedArgs = adminBadgesApi.util.selectCachedArgsForQuery(
    getState() as never,
    'fetchBadges',
  );
  return cachedArgs.map((queryArgs) =>
    dispatch(
      adminBadgesApi.util.updateQueryData('fetchBadges', queryArgs, (draft) => {
        const badge = draft.badges.find((row) => row.id === badgeId);
        const neighbor = draft.badges.find((row) => row.id === neighborId);
        if (badge) badge.sequence = badgeNextSequence;
        if (neighbor) neighbor.sequence = neighborNextSequence;
        draft.badges = sortBadgesBySequenceAsc(draft.badges);
      }),
    ),
  );
}

export const adminBadgesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchBadges: builder.query<AdminBadgeListResponse, AdminBadgeListQuery>({
      query: (args) => ({
        url: '/admin/badges',
        method: 'GET',
        params: buildListParams(args),
      }),
      transformResponse: (response: unknown) =>
        normalizeBadgeListResponse(response),
      providesTags: (result) =>
        result
          ? [
              ...result.badges.map((badge) => ({
                type: 'Badges' as const,
                id: badge.id,
              })),
              { type: 'Badges' as const, id: 'LIST' },
            ]
          : [{ type: 'Badges' as const, id: 'LIST' }],
    }),
    getBadge: builder.query<AdminBadge, string>({
      query: (badgeId) => ({
        url: `/admin/badges/${encodeURIComponent(badgeId)}`,
        method: 'GET',
      }),
      transformResponse: (response: unknown) => {
        const badge = normalizeAdminBadge(response);
        if (!badge) {
          throw new Error('Invalid badge response');
        }
        return badge;
      },
      providesTags: (_result, _error, id) => [{ type: 'Badges', id }],
    }),
    createBadge: builder.mutation<AdminBadge, AdminBadgeWriteBody>({
      query: (body) => ({
        url: '/admin/badges',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => {
        const badge = normalizeAdminBadge(response);
        if (!badge) {
          throw new Error('Invalid badge response');
        }
        return badge;
      },
      invalidatesTags: [{ type: 'Badges', id: 'LIST' }],
    }),
    updateBadge: builder.mutation<
      AdminBadge,
      { badgeId: string; body: AdminBadgeWriteBody }
    >({
      query: ({ badgeId, body }) => ({
        url: `/admin/badges/${encodeURIComponent(badgeId)}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: unknown) => {
        const badge = normalizeAdminBadge(response);
        if (!badge) {
          throw new Error('Invalid badge response');
        }
        return badge;
      },
      invalidatesTags: (_result, _error, { badgeId }) => [
        { type: 'Badges', id: badgeId },
        { type: 'Badges', id: 'LIST' },
      ],
    }),
    /**
     * Swap two badge sequences in one mutation (3 PUTs internally).
     * Optimistically patches list caches; does not invalidate LIST on success
     * so reorder does not refetch page + catalog queries.
     */
    reorderBadgePair: builder.mutation<
      { badge: AdminBadge; neighbor: AdminBadge },
      ReorderBadgePairArg
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const putBadge = async (badgeId: string, body: AdminBadgeWriteBody) => {
          const result = await baseQuery({
            url: `/admin/badges/${encodeURIComponent(badgeId)}`,
            method: 'PUT',
            body,
          });
          if (result.error) {
            return { error: result.error };
          }
          const badge = normalizeAdminBadge(result.data);
          if (!badge) {
            return {
              error: {
                status: 500,
                data: { message: 'Invalid badge response' },
              },
            };
          }
          return { data: badge };
        };

        // Three-step swap avoids unique-sequence conflicts on the backend.
        const cleared = await putBadge(
          arg.badge.id,
          toBadgeWriteBody(arg.badge, null),
        );
        if ('error' in cleared && cleared.error) {
          return { error: cleared.error };
        }

        const neighborUpdated = await putBadge(
          arg.neighbor.id,
          toBadgeWriteBody(arg.neighbor, arg.badgeSequence),
        );
        if ('error' in neighborUpdated && neighborUpdated.error) {
          // Compensate: restore the cleared badge sequence.
          await putBadge(
            arg.badge.id,
            toBadgeWriteBody(arg.badge, arg.badgeSequence),
          );
          return { error: neighborUpdated.error };
        }

        const badgeUpdated = await putBadge(
          arg.badge.id,
          toBadgeWriteBody(arg.badge, arg.neighborSequence),
        );
        if ('error' in badgeUpdated && badgeUpdated.error) {
          // Compensate: restore both badges to their original sequences.
          await putBadge(
            arg.neighbor.id,
            toBadgeWriteBody(arg.neighbor, arg.neighborSequence),
          );
          await putBadge(
            arg.badge.id,
            toBadgeWriteBody(arg.badge, arg.badgeSequence),
          );
          return { error: badgeUpdated.error };
        }

        return {
          data: {
            badge: badgeUpdated.data as AdminBadge,
            neighbor: neighborUpdated.data as AdminBadge,
          },
        };
      },
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        const patches = patchBadgeSequencesInCaches(
          dispatch,
          getState,
          arg.badge.id,
          arg.neighbor.id,
          arg.neighborSequence,
          arg.badgeSequence,
        );
        try {
          await queryFulfilled;
        } catch {
          for (const patch of patches) {
            patch.undo();
          }
        }
      },
    }),
    deleteBadge: builder.mutation<void, { badgeId: string }>({
      query: ({ badgeId }) => ({
        url: `/admin/badges/${encodeURIComponent(badgeId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { badgeId }) => [
        { type: 'Badges', id: badgeId },
        { type: 'Badges', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchBadgesQuery,
  useLazyFetchBadgesQuery,
  useGetBadgeQuery,
  useCreateBadgeMutation,
  useUpdateBadgeMutation,
  useReorderBadgePairMutation,
  useDeleteBadgeMutation,
} = adminBadgesApi;
