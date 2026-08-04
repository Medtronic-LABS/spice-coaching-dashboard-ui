import type { AdminModuleCard } from '@/features/modules/types/adminModule.types';
import {
  normalizeAdminModuleQuizItem,
  sortQuizItems,
} from '@/features/modules/utils/adminModuleQuizUtils';
import { normalizeAdminModuleCard } from '@/features/modules/utils/cardBody';
import { baseApi } from '@/store/apis/base';
import type { LocalizedOptions, LocalizedString } from '@/types/localized';
import {
  parseLocalizedStringField,
  serializeLocalizedString,
} from '@/features/modules/utils/localizedWire';

export type { AdminModuleCard };

export type AdminModuleLifecycleStatus =
  | 'draft'
  | 'published'
  | 'retired'
  | 'deactivated'
  | 'review_pending';

export type AdminModuleDifficulty = 'easy' | 'medium' | 'hard' | string;

export interface AdminModulesListItem {
  id: string;
  module_family_id: string;
  version: number;
  title: LocalizedString;
  description: LocalizedString | null;
  domain: string;
  category?: string | null;
  module_type: string;
  lifecycle_status: AdminModuleLifecycleStatus;
  clinically_reviewed: boolean;
  has_visibility_window: boolean;
  card_count: number;
  estimated_minutes: number;
  published_at: string | null;
  created_at: string;
  first_activated_at?: string | null;
  last_deactivated_at?: string | null;
  last_reactivated_at?: string | null;
  quality_flags?: { flags: string[] } | null;
  quiz_count: number;
  search_metadata?: Record<string, unknown> | null;
  thumbnail_storage_path?: string | null;
  thumbnail_presigned_url?: string | null;
  thumbnail_presigned_expires_seconds?: number | null;
  /** Populated when the modules list API includes document linkage. */
  source_document_ids?: string[];
  merge_source_module_id?: string | null;
  merge_source_module?: AdminModulesListItem | AdminModuleDetailResponse | null;
  merge_primary_module_id?: string | null;
  merge_secondary_module_id?: string | null;
  is_merge_secondary?: boolean;
}

export interface AdminModuleSourceDocument {
  source_document_id: string;
  presigned_url: string;
  presigned_expires_seconds: number;
}

export interface AdminModuleQuizItem {
  id: string;
  question_order: number;
  question: LocalizedString;
  case_setup: LocalizedString | null;
  options: LocalizedOptions;
  correct_indices: number[];
  explanation: LocalizedString | null;
  difficulty: AdminModuleDifficulty;
}

export interface AdminModuleModuleJson {
  cards: AdminModuleCard[];
  quiz?: AdminModuleQuizItem[];
}

export interface AdminModuleDetailResponse {
  id: string;
  module_family_id: string;
  version: number;
  title: LocalizedString;
  description: LocalizedString | null;
  domain: string;
  category?: string | null;
  module_type: string;
  lifecycle_status: AdminModuleLifecycleStatus;
  clinically_reviewed: boolean;
  has_visibility_window: boolean;
  card_count: number;
  estimated_minutes: number;
  published_at: string | null;
  created_at: string;
  quality_flags: { flags: string[] } | null;
  module_json: AdminModuleModuleJson;
  cards: AdminModuleCard[];
  quiz: AdminModuleQuizItem[];
  source_documents?: AdminModuleSourceDocument[];
  thumbnail_storage_path?: string | null;
  thumbnail_presigned_url?: string | null;
  thumbnail_presigned_expires_seconds?: number | null;
  merge_source_module?: AdminModulesListItem | AdminModuleDetailResponse | null;
  merge_primary_module_id?: string | null;
  merge_secondary_module_id?: string | null;
  is_merge_secondary?: boolean;
}

export interface EditAdminModuleRequestBody {
  /** Must match the tip `version` from GET; stale values return 409. */
  expected_version: number;
  title?: LocalizedString;
  description?: LocalizedString | null;
  module_json: AdminModuleModuleJson;
  editor_id?: string;
  quiz?: AdminModuleQuizItem[];
  thumbnail_storage_path?: string | null;
}

export type AdminModuleRefresherType = 'refresher' | string;

export interface CreateAdminModuleRequestBody {
  title: LocalizedString;
  description?: LocalizedString | null;
  domain: string;
  sub_domain?: string | null;
  module_type?: AdminModuleRefresherType;
  estimated_minutes: number;
  difficulty_level?: string | null;
  chatbot_faqs_only?: boolean;
  module_json: AdminModuleModuleJson;
}

export interface CreateAdminModuleResponse {
  id: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSourceDocumentIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return ids.length ? ids : undefined;
}

function normalizeModuleSummary(
  item: Record<string, unknown>,
): AdminModulesListItem {
  const title = parseLocalizedStringField(
    item,
    'title',
    'title_bn',
    'title_en',
  );
  const descriptionRaw = parseLocalizedStringField(
    item,
    'description',
    'description_bn',
    'description_en',
  );

  return {
    id: String(item.id ?? ''),
    module_family_id: String(item.module_family_id ?? ''),
    version: typeof item.version === 'number' ? item.version : 0,
    title,
    description: Object.keys(descriptionRaw).length ? descriptionRaw : null,
    domain: typeof item.domain === 'string' ? item.domain : '',
    category:
      typeof item.category === 'string'
        ? item.category
        : typeof item.domain === 'string'
          ? item.domain
          : null,
    module_type: typeof item.module_type === 'string' ? item.module_type : '',
    lifecycle_status:
      (item.lifecycle_status as AdminModuleLifecycleStatus) ?? 'draft',
    clinically_reviewed: Boolean(item.clinically_reviewed),
    has_visibility_window: Boolean(item.has_visibility_window),
    card_count: typeof item.card_count === 'number' ? item.card_count : 0,
    estimated_minutes:
      typeof item.estimated_minutes === 'number' ? item.estimated_minutes : 0,
    published_at:
      typeof item.published_at === 'string' ? item.published_at : null,
    created_at: typeof item.created_at === 'string' ? item.created_at : '',
    first_activated_at:
      typeof item.first_activated_at === 'string'
        ? item.first_activated_at
        : null,
    last_deactivated_at:
      typeof item.last_deactivated_at === 'string'
        ? item.last_deactivated_at
        : null,
    last_reactivated_at:
      typeof item.last_reactivated_at === 'string'
        ? item.last_reactivated_at
        : null,
    quality_flags:
      item.quality_flags && typeof item.quality_flags === 'object'
        ? (item.quality_flags as { flags: string[] })
        : null,
    quiz_count: typeof item.quiz_count === 'number' ? item.quiz_count : 0,
    search_metadata:
      item.search_metadata && typeof item.search_metadata === 'object'
        ? (item.search_metadata as Record<string, unknown>)
        : null,
    thumbnail_storage_path:
      typeof item.thumbnail_storage_path === 'string'
        ? item.thumbnail_storage_path
        : null,
    thumbnail_presigned_url:
      typeof item.thumbnail_presigned_url === 'string'
        ? item.thumbnail_presigned_url
        : null,
    thumbnail_presigned_expires_seconds:
      typeof item.thumbnail_presigned_expires_seconds === 'number'
        ? item.thumbnail_presigned_expires_seconds
        : null,
    source_document_ids: normalizeSourceDocumentIds(item.source_document_ids),
    merge_source_module_id:
      typeof item.merge_source_module_id === 'string'
        ? item.merge_source_module_id
        : typeof item.merge_source_module === 'string'
          ? item.merge_source_module
          : null,
    merge_source_module:
      item.merge_source_module && typeof item.merge_source_module === 'object'
        ? normalizeModuleSummary(
            item.merge_source_module as Record<string, unknown>,
          )
        : null,
    merge_primary_module_id:
      typeof item.merge_primary_module_id === 'string'
        ? item.merge_primary_module_id
        : null,
    merge_secondary_module_id:
      typeof item.merge_secondary_module_id === 'string'
        ? item.merge_secondary_module_id
        : null,
    is_merge_secondary: Boolean(item.is_merge_secondary),
  };
}

function normalizeSourceDocuments(value: unknown): AdminModuleSourceDocument[] {
  if (!Array.isArray(value)) return [];
  const documents: AdminModuleSourceDocument[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const source_document_id = record.source_document_id;
    const presigned_url = record.presigned_url;
    if (
      typeof source_document_id !== 'string' ||
      !source_document_id.trim() ||
      typeof presigned_url !== 'string' ||
      !presigned_url.trim()
    ) {
      continue;
    }
    documents.push({
      source_document_id: source_document_id.trim(),
      presigned_url: presigned_url.trim(),
      presigned_expires_seconds:
        typeof record.presigned_expires_seconds === 'number'
          ? record.presigned_expires_seconds
          : 0,
    });
  }
  return documents;
}

function normalizeModuleDetail(
  response: Record<string, unknown>,
): AdminModuleDetailResponse {
  const title = parseLocalizedStringField(
    response,
    'title',
    'title_bn',
    'title_en',
  );
  const descriptionRaw = parseLocalizedStringField(
    response,
    'description',
    'description_bn',
    'description_en',
  );

  const moduleJson = isPlainObject(response.module_json)
    ? response.module_json
    : {};
  const rawCards = Array.isArray(moduleJson.cards)
    ? moduleJson.cards
    : Array.isArray(response.cards)
      ? response.cards
      : [];
  const cards = rawCards.map((card, index) =>
    normalizeAdminModuleCard(card, index),
  );

  const rawQuiz = Array.isArray(moduleJson.quiz)
    ? moduleJson.quiz
    : Array.isArray(response.quiz)
      ? response.quiz
      : [];
  const quiz = sortQuizItems(
    rawQuiz.map((item, index) => normalizeAdminModuleQuizItem(item, index)),
  );
  const source_documents = normalizeSourceDocuments(response.source_documents);

  return {
    id: String(response.id ?? ''),
    module_family_id: String(response.module_family_id ?? ''),
    version: typeof response.version === 'number' ? response.version : 0,
    title,
    description: Object.keys(descriptionRaw).length ? descriptionRaw : null,
    domain: typeof response.domain === 'string' ? response.domain : '',
    category:
      typeof response.category === 'string'
        ? response.category
        : typeof response.domain === 'string'
          ? response.domain
          : null,
    module_type:
      typeof response.module_type === 'string' ? response.module_type : '',
    lifecycle_status:
      (response.lifecycle_status as AdminModuleLifecycleStatus) ?? 'draft',
    clinically_reviewed: Boolean(response.clinically_reviewed),
    has_visibility_window: Boolean(response.has_visibility_window),
    card_count:
      typeof response.card_count === 'number'
        ? response.card_count
        : cards.length,
    estimated_minutes:
      typeof response.estimated_minutes === 'number'
        ? response.estimated_minutes
        : 0,
    published_at:
      typeof response.published_at === 'string' ? response.published_at : null,
    created_at:
      typeof response.created_at === 'string' ? response.created_at : '',
    quality_flags:
      response.quality_flags && typeof response.quality_flags === 'object'
        ? (response.quality_flags as { flags: string[] })
        : null,
    cards,
    quiz,
    source_documents,
    module_json: { cards, quiz },
    thumbnail_storage_path:
      typeof response.thumbnail_storage_path === 'string'
        ? response.thumbnail_storage_path
        : null,
    thumbnail_presigned_url:
      typeof response.thumbnail_presigned_url === 'string'
        ? response.thumbnail_presigned_url
        : null,
    thumbnail_presigned_expires_seconds:
      typeof response.thumbnail_presigned_expires_seconds === 'number'
        ? response.thumbnail_presigned_expires_seconds
        : null,
    merge_source_module:
      response.merge_source_module &&
      typeof response.merge_source_module === 'object'
        ? normalizeModuleDetail(
            response.merge_source_module as Record<string, unknown>,
          )
        : null,
    merge_primary_module_id:
      typeof response.merge_primary_module_id === 'string'
        ? response.merge_primary_module_id
        : null,
    merge_secondary_module_id:
      typeof response.merge_secondary_module_id === 'string'
        ? response.merge_secondary_module_id
        : null,
    is_merge_secondary: Boolean(response.is_merge_secondary),
  };
}

export interface EditAdminModuleResponse {
  id: string;
  module_family_id: string;
  version: number;
  supersedes_module_id: string;
}

export interface ClinicallyReviewedRequestBody {
  clinically_reviewed: true;
  reviewer_id?: string;
}

export interface ClinicallyReviewedResponse {
  id: string;
  clinically_reviewed: boolean;
  clinically_reviewed_at: string;
  clinically_reviewed_by: string;
}

export interface RetireModuleResponse {
  id: string;
  lifecycle_status: 'retired';
  deprecated_at: string;
}

export interface DeactivateModuleRequestBody {
  actor_id?: string;
  reason?: string;
}

export interface DeactivateModuleResponse {
  module_id: string;
  lifecycle_status: 'deactivated';
  last_deactivated_at: string;
}

export interface ReactivateModuleRequestBody {
  actor_id?: string;
  reason?: string;
}

export interface ReactivateModuleResponse {
  module_id: string;
  lifecycle_status: 'published';
  last_reactivated_at: string;
}

export interface FetchModulesQueryArgs {
  limit: number;
  offset: number;
  status?: AdminModuleLifecycleStatus | null;
  domain?: string | null;
  created_from?: string | null;
  created_to?: string | null;
  published_from?: string | null;
  published_to?: string | null;
  activated_from?: string | null;
  activated_to?: string | null;
  deactivated_from?: string | null;
  deactivated_to?: string | null;
  sourceDocumentId?: string | null;
  /** Server-side search; omit when empty or below the UI minimum length. */
  q?: string | null;
}

export interface FetchModulesResponse {
  modules: AdminModulesListItem[];
  total_modules: number;
  total_pages: number;
  limit: number;
  offset: number;
}

function normalizeFetchModulesResponse(
  response: unknown,
): FetchModulesResponse {
  if (Array.isArray(response)) {
    const modules = response
      .filter(isPlainObject)
      .map((item) => normalizeModuleSummary(item));
    return {
      modules,
      total_modules: modules.length,
      total_pages: modules.length > 0 ? 1 : 0,
      limit: modules.length,
      offset: 0,
    };
  }

  if (!isPlainObject(response)) {
    return {
      modules: [],
      total_modules: 0,
      total_pages: 0,
      limit: 0,
      offset: 0,
    };
  }

  const modules = Array.isArray(response.modules)
    ? response.modules
        .filter(isPlainObject)
        .map((item) => normalizeModuleSummary(item))
    : [];

  const totalModules =
    typeof response.total_modules === 'number' &&
    Number.isFinite(response.total_modules)
      ? Math.max(0, response.total_modules)
      : modules.length;
  const limit =
    typeof response.limit === 'number' && Number.isFinite(response.limit)
      ? Math.max(0, response.limit)
      : modules.length;
  const offset =
    typeof response.offset === 'number' && Number.isFinite(response.offset)
      ? Math.max(0, response.offset)
      : 0;
  const totalPages =
    typeof response.total_pages === 'number' &&
    Number.isFinite(response.total_pages)
      ? Math.max(0, response.total_pages)
      : limit > 0
        ? Math.ceil(totalModules / limit)
        : totalModules > 0
          ? 1
          : 0;

  return {
    modules,
    total_modules: totalModules,
    total_pages: totalPages,
    limit,
    offset,
  };
}

export const adminModulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchModules: builder.query<FetchModulesResponse, FetchModulesQueryArgs>({
      query: ({
        limit,
        offset,
        status,
        domain,
        created_from,
        created_to,
        published_from,
        published_to,
        activated_from,
        activated_to,
        deactivated_from,
        deactivated_to,
        sourceDocumentId,
        q,
      }) => ({
        url: '/admin/modules',
        method: 'GET',
        params: {
          limit,
          offset,
          latest_version_only: true,
          ...(status ? { status } : {}),
          ...(domain ? { domain } : {}),
          ...(created_from ? { created_from } : {}),
          ...(created_to ? { created_to } : {}),
          ...(published_from ? { published_from } : {}),
          ...(published_to ? { published_to } : {}),
          ...(activated_from ? { activated_from } : {}),
          ...(activated_to ? { activated_to } : {}),
          ...(deactivated_from ? { deactivated_from } : {}),
          ...(deactivated_to ? { deactivated_to } : {}),
          ...(sourceDocumentId ? { source_document_id: sourceDocumentId } : {}),
          ...(q ? { q } : {}),
        },
      }),
      transformResponse: (response: unknown) =>
        normalizeFetchModulesResponse(response),
    }),
    fetchModuleDomainOptions: builder.query<
      string[],
      { status?: AdminModuleLifecycleStatus | null }
    >({
      query: ({ status }) => ({
        url: '/admin/modules/domains',
        method: 'GET',
        params: {
          latest_version_only: true,
          ...(status ? { status } : {}),
        },
      }),
      transformResponse: (response: unknown) => {
        if (!Array.isArray(response)) return [];
        return response.filter(
          (domain): domain is string =>
            typeof domain === 'string' && domain.trim().length > 0,
        );
      },
      providesTags: ['ModuleDomains'],
      keepUnusedDataFor: 60,
    }),
    createModule: builder.mutation<
      CreateAdminModuleResponse,
      CreateAdminModuleRequestBody
    >({
      query: (body) => ({
        url: '/admin/modules',
        method: 'POST',
        body: {
          ...body,
          title: serializeLocalizedString(body.title),
          description: body.description
            ? serializeLocalizedString(body.description)
            : null,
        },
      }),
      invalidatesTags: ['ModuleDomains'],
    }),
    getModuleDetail: builder.query<AdminModuleDetailResponse, string>({
      query: (moduleId) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}`,
        method: 'GET',
      }),
      transformResponse: (response: unknown) =>
        normalizeModuleDetail(isPlainObject(response) ? response : {}),
      /** Retain briefly so `useAdminModuleDetailQuery(..., { useCache: true })` can reuse across review steps. */
      keepUnusedDataFor: 300,
    }),
    editModule: builder.mutation<
      EditAdminModuleResponse,
      { moduleId: string; body: EditAdminModuleRequestBody }
    >({
      query: ({ moduleId, body }) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}`,
        method: 'PUT',
        body,
      }),
    }),
    setClinicallyReviewed: builder.mutation<
      ClinicallyReviewedResponse,
      { moduleId: string; body: ClinicallyReviewedRequestBody }
    >({
      query: ({ moduleId, body }) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}/clinically-reviewed`,
        method: 'POST',
        body,
      }),
    }),
    deleteModule: builder.mutation<RetireModuleResponse, { moduleId: string }>({
      query: ({ moduleId }) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}`,
        method: 'DELETE',
      }),
    }),
    deactivateModule: builder.mutation<
      DeactivateModuleResponse,
      { moduleId: string; body?: DeactivateModuleRequestBody }
    >({
      query: ({ moduleId, body }) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}/deactivate`,
        method: 'POST',
        body,
      }),
    }),
    reactivateModule: builder.mutation<
      ReactivateModuleResponse,
      { moduleId: string; body?: ReactivateModuleRequestBody }
    >({
      query: ({ moduleId, body }) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}/reactivate`,
        method: 'POST',
        body,
      }),
    }),
    overrideMergeModule: builder.mutation<
      { id: string; lifecycle_status: AdminModuleLifecycleStatus },
      { moduleId: string }
    >({
      query: ({ moduleId }) => ({
        url: `/admin/ingest/modules/${encodeURIComponent(moduleId)}/override-merge`,
        method: 'POST',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchModulesQuery,
  useFetchModuleDomainOptionsQuery,
  useCreateModuleMutation,
  useGetModuleDetailQuery,
  useEditModuleMutation,
  useSetClinicallyReviewedMutation,
  useDeleteModuleMutation,
  useDeactivateModuleMutation,
  useReactivateModuleMutation,
  useOverrideMergeModuleMutation,
} = adminModulesApi;
