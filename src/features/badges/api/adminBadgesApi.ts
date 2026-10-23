import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { baseApi } from '@/store/apis/base';
import type {
  AdminBadge,
  AdminBadgeListQuery,
  AdminBadgeListResponse,
  AdminBadgeWriteBody,
} from '@/features/badges/types/badge.types';
import {
  assignSequencesByOrder,
  diffBadgeSequenceChanges,
  sortBadgesBySequenceAsc,
} from '@/features/badges/utils/badgeSequence';
import { toBadgeWriteBody } from '@/features/badges/utils/badgeForm';

type BadgePutBaseQuery = (
  arg: string | FetchArgs,
) =>
  | PromiseLike<{ data?: unknown; error?: unknown }>
  | { data?: unknown; error?: unknown };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** Display name from `{ id, name }`, a legacy string, or null when missing. */
export function normalizeBadgeActorName(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (isPlainObject(value) && typeof value.name === 'string') {
    const trimmed = value.name.trim();
    return trimmed || null;
  }
  return null;
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
    created_by: normalizeBadgeActorName(raw.created_by),
    updated_by: normalizeBadgeActorName(raw.updated_by),
  };
}

async function putBadge(
  baseQuery: BadgePutBaseQuery,
  badgeId: string,
  body: AdminBadgeWriteBody,
): Promise<{ data: AdminBadge } | { error: FetchBaseQueryError }> {
  const result = await baseQuery({
    url: `/admin/badges/${encodeURIComponent(badgeId)}`,
    method: 'PUT',
    body,
  });
  if (result.error) {
    return { error: result.error as FetchBaseQueryError };
  }
  const badge = normalizeAdminBadge(result.data);
  if (!badge) {
    return {
      error: {
        status: 500,
        data: { message: 'Invalid milestone response' },
      },
    };
  }
  return { data: badge };
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

export type CommitBadgeSequenceOrderArg = {
  baseline: AdminBadge[];
  draft: AdminBadge[];
};

function patchCommittedSequencesInCaches(
  dispatch: {
    (action: ReturnType<typeof adminBadgesApi.util.updateQueryData>): {
      undo: () => void;
    };
  },
  getState: () => unknown,
  ordered: AdminBadge[],
): Array<{ undo: () => void }> {
  const byId = new Map(ordered.map((badge) => [badge.id, badge.sequence]));
  const cachedArgs = adminBadgesApi.util.selectCachedArgsForQuery(
    getState() as never,
    'fetchBadges',
  );
  return cachedArgs.map((queryArgs) =>
    dispatch(
      adminBadgesApi.util.updateQueryData('fetchBadges', queryArgs, (draft) => {
        for (const row of draft.badges) {
          if (byId.has(row.id)) {
            row.sequence = byId.get(row.id) ?? null;
          }
        }
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
          throw new Error('Invalid milestone response');
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
          throw new Error('Invalid milestone response');
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
          throw new Error('Invalid milestone response');
        }
        return badge;
      },
      invalidatesTags: (_result, _error, { badgeId }) => [
        { type: 'Badges', id: badgeId },
        { type: 'Badges', id: 'LIST' },
      ],
    }),
    /**
     * Persist a full drag-reorder with minimal PUTs: clear then assign only
     * badges whose sequence changed (unique-sequence safe).
     */
    commitBadgeSequenceOrder: builder.mutation<
      AdminBadge[],
      CommitBadgeSequenceOrderArg
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const assigned = assignSequencesByOrder(arg.draft);
        const changes = diffBadgeSequenceChanges(arg.baseline, arg.draft);
        if (changes.length === 0) {
          return { data: assigned };
        }

        const clearedIds: string[] = [];
        for (const change of changes) {
          const cleared = await putBadge(
            baseQuery,
            change.badge.id,
            toBadgeWriteBody(change.badge, null),
          );
          if ('error' in cleared && cleared.error) {
            for (const id of clearedIds) {
              const original = arg.baseline.find((badge) => badge.id === id);
              if (original) {
                await putBadge(
                  baseQuery,
                  id,
                  toBadgeWriteBody(original, original.sequence),
                );
              }
            }
            return { error: cleared.error };
          }
          clearedIds.push(change.badge.id);
        }

        const assignedIds: string[] = [];
        for (const change of changes) {
          const updated = await putBadge(
            baseQuery,
            change.badge.id,
            toBadgeWriteBody(change.badge, change.toSequence),
          );
          if ('error' in updated && updated.error) {
            for (const id of [...assignedIds, ...clearedIds]) {
              const original = arg.baseline.find((badge) => badge.id === id);
              if (original) {
                await putBadge(
                  baseQuery,
                  id,
                  toBadgeWriteBody(original, original.sequence),
                );
              }
            }
            return { error: updated.error };
          }
          assignedIds.push(change.badge.id);
        }

        return { data: assigned };
      },
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        const assigned = assignSequencesByOrder(arg.draft);
        const patches = patchCommittedSequencesInCaches(
          dispatch,
          getState,
          assigned,
        );
        try {
          await queryFulfilled;
        } catch {
          for (const patch of patches) {
            patch.undo();
          }
        }
      },
      // Refetch list pages so sorted membership is correct across offsets.
      invalidatesTags: [{ type: 'Badges', id: 'LIST' }],
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
  useCommitBadgeSequenceOrderMutation,
  useDeleteBadgeMutation,
} = adminBadgesApi;
