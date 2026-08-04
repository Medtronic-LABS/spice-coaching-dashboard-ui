import { baseApi } from '@/store/apis/base';
import type {
  AssignmentType,
  AssignmentUser,
  CreateAssignmentResponse,
} from '@/features/modules/api/adminAssignmentApi';

export interface VideoAssignment {
  id: string;
  source_document_id: string;
  video_title: string | null;
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

export interface FetchVideoAssignmentsParams {
  source_document_id?: string;
  assignment_type?: AssignmentType;
}

export interface CreateVideoAssignmentRequest {
  source_document_id: string;
  assignment_type: AssignmentType;
  user_ids?: number[];
  tenant_ids?: number[];
  upazilas?: string[];
}

export interface RevokeVideoAssignmentResponse {
  id: string;
  status: string;
}

function parseVideoAssignments(response: unknown): VideoAssignment[] {
  if (!Array.isArray(response)) return [];

  return response.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const id = record.id;
    const sourceDocumentId = record.source_document_id;
    if (typeof id !== 'string' || typeof sourceDocumentId !== 'string') {
      return [];
    }

    return [
      {
        id,
        source_document_id: sourceDocumentId,
        video_title:
          typeof record.video_title === 'string' ? record.video_title : null,
        assignment_type: record.assignment_type as AssignmentType,
        tenant_id:
          typeof record.tenant_id === 'number' ? record.tenant_id : null,
        user_id: typeof record.user_id === 'number' ? record.user_id : null,
        user:
          record.user && typeof record.user === 'object'
            ? (record.user as AssignmentUser)
            : null,
        upazila: typeof record.upazila === 'string' ? record.upazila : null,
        assigned_by:
          typeof record.assigned_by === 'number' ? record.assigned_by : 0,
        assigned_at:
          typeof record.assigned_at === 'string' ? record.assigned_at : '',
        created_at:
          typeof record.created_at === 'string' ? record.created_at : '',
        updated_at:
          typeof record.updated_at === 'string' ? record.updated_at : '',
      } satisfies VideoAssignment,
    ];
  });
}

export const adminVideoAssignmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchVideoAssignments: builder.query<
      VideoAssignment[],
      FetchVideoAssignmentsParams | void
    >({
      query: (params) => ({
        url: '/admin/video-assignments',
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: parseVideoAssignments,
    }),
    createVideoAssignment: builder.mutation<
      CreateAssignmentResponse,
      CreateVideoAssignmentRequest
    >({
      query: (body) => ({
        url: '/admin/video-assignments',
        method: 'POST',
        body,
      }),
    }),
    revokeVideoAssignment: builder.mutation<
      RevokeVideoAssignmentResponse,
      string
    >({
      query: (id) => ({
        url: `/admin/video-assignments/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchVideoAssignmentsQuery,
  useLazyFetchVideoAssignmentsQuery,
  useCreateVideoAssignmentMutation,
  useRevokeVideoAssignmentMutation,
} = adminVideoAssignmentApi;
