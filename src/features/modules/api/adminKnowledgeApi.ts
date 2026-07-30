import type {
  KnowledgeAsset,
  KnowledgeAssetStatus,
  KnowledgeLibraryFilters,
  KnowledgeUploadMode,
} from '@/features/modules/types/knowledgeLibrary.types';
import { baseApi } from '@/store/apis/base';

/** Wire shape returned by knowledge asset APIs (snake_case). */
export interface KnowledgeAssetWire {
  id: string;
  title: string;
  file_type: 'pdf';
  start_page: number;
  end_page: number;
  page_count?: number | null;
  thumbnail_url: string | null;
  uploaded_at: string;
  uploaded_by: string;
  updated_at: string;
  assigned: boolean;
  status: KnowledgeAssetStatus;
  parent_upload_id: string;
}

export interface KnowledgeAssetListResponse {
  assets: KnowledgeAsset[];
  total: number;
  page: number;
  page_size: number;
}

export interface KnowledgeAssetListWireResponse {
  assets: KnowledgeAssetWire[];
  total: number;
  page: number;
  page_size: number;
}

export interface KnowledgeSplitInput {
  title: string;
  start_page: number;
  end_page: number;
}

export interface KnowledgeUploadPayload {
  file: File;
  mode: KnowledgeUploadMode;
  /** Required for `original` mode. */
  title?: string;
  /** Required for `split` mode (≥1). */
  splits?: KnowledgeSplitInput[];
  /** Optional custom thumbnail for original mode. */
  thumbnail?: File | null;
}

export interface KnowledgeUploadResponse {
  upload_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  poll_url: string;
  asset_ids: string[];
}

export interface KnowledgeUploadStatusResponse {
  upload_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  assets: KnowledgeAsset[];
  error?: string | null;
}

export interface KnowledgeUploadStatusWireResponse {
  upload_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  assets: KnowledgeAssetWire[];
  error?: string | null;
}

export interface PatchKnowledgeAssetPayload {
  id: string;
  title: string;
}

export interface PutKnowledgeThumbnailPayload {
  id: string;
  thumbnail: File;
}

export interface KnowledgeDownloadResponse {
  download_url: string;
  filename: string;
}

export interface KnowledgeUploaderOption {
  value: string;
  label: string;
}

export interface KnowledgeUploadersResponse {
  uploaders: KnowledgeUploaderOption[];
}

export type FetchKnowledgeAssetsParams = Partial<KnowledgeLibraryFilters>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toAssetStatus(value: unknown): KnowledgeAssetStatus {
  if (
    value === 'processing' ||
    value === 'ready' ||
    value === 'failed' ||
    value === 'deactivated'
  ) {
    return value;
  }
  return 'ready';
}

export function mapKnowledgeAssetWire(
  item: KnowledgeAssetWire,
): KnowledgeAsset {
  return {
    id: item.id,
    title: item.title,
    fileType: 'pdf',
    startPage: item.start_page,
    endPage: item.end_page,
    pageCount:
      typeof item.page_count === 'number' ? item.page_count : undefined,
    thumbnailUrl: item.thumbnail_url,
    uploadedAt: item.uploaded_at,
    uploadedBy: item.uploaded_by,
    updatedAt: item.updated_at,
    assigned: Boolean(item.assigned),
    status: toAssetStatus(item.status),
    parentUploadId: item.parent_upload_id,
  };
}

function normalizeKnowledgeAssetWire(
  item: Record<string, unknown>,
): KnowledgeAssetWire {
  return {
    id: String(item.id ?? ''),
    title: typeof item.title === 'string' ? item.title : '',
    file_type: 'pdf',
    start_page:
      typeof item.start_page === 'number' && Number.isFinite(item.start_page)
        ? item.start_page
        : 1,
    end_page:
      typeof item.end_page === 'number' && Number.isFinite(item.end_page)
        ? item.end_page
        : 1,
    page_count: typeof item.page_count === 'number' ? item.page_count : null,
    thumbnail_url:
      typeof item.thumbnail_url === 'string' ? item.thumbnail_url : null,
    uploaded_at: typeof item.uploaded_at === 'string' ? item.uploaded_at : '',
    uploaded_by: typeof item.uploaded_by === 'string' ? item.uploaded_by : '',
    updated_at: typeof item.updated_at === 'string' ? item.updated_at : '',
    assigned: Boolean(item.assigned),
    status: toAssetStatus(item.status),
    parent_upload_id:
      typeof item.parent_upload_id === 'string' ? item.parent_upload_id : '',
  };
}

function listQueryParams(
  params: FetchKnowledgeAssetsParams | void,
): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const query: Record<string, string | number> = {};
  if (params.q?.trim()) query.q = params.q.trim();
  if (params.uploadedBy?.trim()) query.uploaded_by = params.uploadedBy.trim();
  if (params.assigned && params.assigned !== 'all') {
    query.assigned = params.assigned;
  }
  if (params.status) query.status = params.status;
  if (params.uploadedAtFrom) query.uploaded_at_from = params.uploadedAtFrom;
  if (params.uploadedAtTo) query.uploaded_at_to = params.uploadedAtTo;
  if (params.updatedAtFrom) query.updated_at_from = params.updatedAtFrom;
  if (params.updatedAtTo) query.updated_at_to = params.updatedAtTo;
  if (params.sortBy) query.sort_by = params.sortBy;
  if (params.sortOrder) query.sort_order = params.sortOrder;
  if (params.page) query.page = params.page;
  if (params.pageSize) query.page_size = params.pageSize;
  return Object.keys(query).length ? query : undefined;
}

export const adminKnowledgeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadKnowledgeDocument: builder.mutation<
      KnowledgeUploadResponse,
      KnowledgeUploadPayload
    >({
      query: (payload) => {
        const form = new FormData();
        form.append('file', payload.file, payload.file.name);
        form.append('mode', payload.mode);
        if (payload.title?.trim()) {
          form.append('title', payload.title.trim());
        }
        if (payload.splits?.length) {
          form.append('splits', JSON.stringify(payload.splits));
        }
        if (payload.thumbnail) {
          form.append('thumbnail', payload.thumbnail, payload.thumbnail.name);
        }
        return {
          url: '/admin/knowledge/uploads',
          method: 'POST',
          body: form,
        };
      },
      invalidatesTags: ['KnowledgeAssets'],
    }),

    getKnowledgeUploadStatus: builder.query<
      KnowledgeUploadStatusResponse,
      string
    >({
      query: (uploadId) => ({
        url: `/admin/knowledge/uploads/${encodeURIComponent(uploadId)}`,
        method: 'GET',
      }),
      transformResponse: (
        response: KnowledgeUploadStatusWireResponse,
      ): KnowledgeUploadStatusResponse => ({
        upload_id: response.upload_id,
        status: response.status,
        progress_percent: response.progress_percent,
        assets: (response.assets ?? []).map(mapKnowledgeAssetWire),
        error: response.error ?? null,
      }),
      keepUnusedDataFor: 60,
    }),

    fetchKnowledgeAssets: builder.query<
      KnowledgeAssetListResponse,
      FetchKnowledgeAssetsParams | void
    >({
      query: (params) => ({
        url: '/admin/knowledge/assets',
        method: 'GET',
        params: listQueryParams(params),
      }),
      transformResponse: (response: unknown): KnowledgeAssetListResponse => {
        if (!isPlainObject(response)) {
          return { assets: [], total: 0, page: 1, page_size: 20 };
        }
        const assets = Array.isArray(response.assets)
          ? response.assets
              .filter(isPlainObject)
              .map((item) =>
                mapKnowledgeAssetWire(normalizeKnowledgeAssetWire(item)),
              )
          : [];
        return {
          assets,
          total:
            typeof response.total === 'number' ? response.total : assets.length,
          page: typeof response.page === 'number' ? response.page : 1,
          page_size:
            typeof response.page_size === 'number'
              ? response.page_size
              : assets.length,
        };
      },
      providesTags: ['KnowledgeAssets'],
    }),

    fetchKnowledgeUploaders: builder.query<KnowledgeUploadersResponse, void>({
      query: () => ({
        url: '/admin/knowledge/uploaders',
        method: 'GET',
      }),
      transformResponse: (response: unknown): KnowledgeUploadersResponse => {
        if (!isPlainObject(response) || !Array.isArray(response.uploaders)) {
          return { uploaders: [] };
        }
        const uploaders: KnowledgeUploaderOption[] = [];
        for (const row of response.uploaders) {
          if (!isPlainObject(row)) continue;
          const value = typeof row.value === 'string' ? row.value.trim() : '';
          const label =
            typeof row.label === 'string' && row.label.trim()
              ? row.label.trim()
              : value;
          if (!value) continue;
          uploaders.push({ value, label });
        }
        return { uploaders };
      },
      providesTags: ['KnowledgeAssets'],
    }),

    patchKnowledgeAsset: builder.mutation<
      KnowledgeAsset,
      PatchKnowledgeAssetPayload
    >({
      query: ({ id, title }) => ({
        url: `/admin/knowledge/assets/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: { title },
      }),
      transformResponse: (response: KnowledgeAssetWire) =>
        mapKnowledgeAssetWire(response),
      invalidatesTags: ['KnowledgeAssets'],
    }),

    putKnowledgeAssetThumbnail: builder.mutation<
      KnowledgeAsset,
      PutKnowledgeThumbnailPayload
    >({
      query: ({ id, thumbnail }) => {
        const form = new FormData();
        form.append('thumbnail', thumbnail, thumbnail.name);
        return {
          url: `/admin/knowledge/assets/${encodeURIComponent(id)}/thumbnail`,
          method: 'PUT',
          body: form,
        };
      },
      transformResponse: (response: KnowledgeAssetWire) =>
        mapKnowledgeAssetWire(response),
      invalidatesTags: ['KnowledgeAssets'],
    }),

    deactivateKnowledgeAsset: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/admin/knowledge/assets/${encodeURIComponent(id)}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: ['KnowledgeAssets'],
    }),

    getKnowledgeAssetDownload: builder.query<KnowledgeDownloadResponse, string>(
      {
        query: (id) => ({
          url: `/admin/knowledge/assets/${encodeURIComponent(id)}/download`,
          method: 'GET',
        }),
      },
    ),
  }),
  overrideExisting: false,
});

export const {
  useUploadKnowledgeDocumentMutation,
  useGetKnowledgeUploadStatusQuery,
  useFetchKnowledgeAssetsQuery,
  useFetchKnowledgeUploadersQuery,
  usePatchKnowledgeAssetMutation,
  usePutKnowledgeAssetThumbnailMutation,
  useDeactivateKnowledgeAssetMutation,
  useLazyGetKnowledgeAssetDownloadQuery,
} = adminKnowledgeApi;
