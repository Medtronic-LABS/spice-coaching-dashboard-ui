import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import {
  normalizeAdminModuleQuizItem,
  sortQuizItems,
} from '@/features/module-library/utils/adminModuleQuizUtils';
import { normalizeAdminModuleCard } from '@/features/module-library/utils/cardBody';
import { baseApi } from '@/store/apis/base';
import type { LocalizedOptions, LocalizedString } from '@/types/localized';
import {
  parseLocalizedStringField,
  serializeLocalizedString,
} from '@/features/module-library/utils/localizedWire';

export type { AdminModuleCard };

export type AdminModuleLifecycleStatus = 'draft' | 'published' | 'retired';

export type AdminModuleDifficulty = 'easy' | 'medium' | 'hard' | string;

export interface AdminModulesListItem {
  id: string;
  module_family_id: string;
  version: number;
  title: LocalizedString;
  description: LocalizedString | null;
  domain: string;
  module_type: string;
  lifecycle_status: AdminModuleLifecycleStatus;
  clinically_reviewed: boolean;
  has_visibility_window: boolean;
  card_count: number;
  estimated_minutes: number;
  published_at: string | null;
  created_at: string;
  quality_flags?: { flags: string[] } | null;
  quiz_count: number;
  search_metadata?: Record<string, unknown> | null;
  thumbnail_storage_path?: string | null;
  thumbnail_presigned_url?: string | null;
  thumbnail_presigned_expires_seconds?: number | null;
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
}

export interface EditAdminModuleRequestBody {
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
  module_type: AdminModuleRefresherType;
  estimated_minutes: number;
  difficulty_level?: string | null;
  module_json: AdminModuleModuleJson;
}

export interface CreateAdminModuleResponse {
  id: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

export const adminModulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchModules: builder.query<
      AdminModulesListItem[],
      {
        limit: number;
        offset: number;
        status?: AdminModuleLifecycleStatus | null;
      }
    >({
      query: (params) => ({
        url: '/admin/modules',
        method: 'GET',
        params,
      }),
      transformResponse: (response: unknown) => {
        if (!Array.isArray(response)) return [];
        return response
          .filter(isPlainObject)
          .map((item) => normalizeModuleSummary(item));
      },
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
  }),
  overrideExisting: false,
});

export const {
  useFetchModulesQuery,
  useCreateModuleMutation,
  useGetModuleDetailQuery,
  useEditModuleMutation,
  useSetClinicallyReviewedMutation,
  useDeleteModuleMutation,
} = adminModulesApi;
