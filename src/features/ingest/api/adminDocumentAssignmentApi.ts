import { baseApi } from '@/store/apis/base';
import type {
  AdminUser,
  AssignmentUpdateResponse,
  CreateAssignmentResponse,
} from '@/features/modules/api/adminAssignmentApi';
import { parseAssignedUsersResponse } from '@/features/modules/api/adminAssignmentApi';

export interface CreateDocumentAssignmentRequest {
  source_document_id: string;
  user_ids?: number[];
  upazilas?: string[];
}

export interface ReplaceDocumentAssignedUsersRequest {
  sourceDocumentId: string;
  user_ids?: number[];
  upazilas?: string[];
}

export const adminDocumentAssignmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchDocumentAssignedUsers: builder.query<AdminUser[], string>({
      query: (sourceDocumentId) => ({
        url: `/admin/document-assignments/${encodeURIComponent(sourceDocumentId)}/users`,
        method: 'GET',
      }),
      transformResponse: parseAssignedUsersResponse,
    }),
    createDocumentAssignment: builder.mutation<
      CreateAssignmentResponse,
      CreateDocumentAssignmentRequest
    >({
      query: (body) => ({
        url: '/admin/document-assignments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SourceDocuments'],
    }),
    replaceDocumentAssignedUsers: builder.mutation<
      AssignmentUpdateResponse,
      ReplaceDocumentAssignedUsersRequest
    >({
      query: ({ sourceDocumentId, user_ids, upazilas }) => ({
        url: `/admin/document-assignments/${encodeURIComponent(sourceDocumentId)}/users`,
        method: 'PUT',
        body: { user_ids, upazilas },
      }),
      invalidatesTags: ['SourceDocuments'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchDocumentAssignedUsersQuery,
  useLazyFetchDocumentAssignedUsersQuery,
  useCreateDocumentAssignmentMutation,
  useReplaceDocumentAssignedUsersMutation,
} = adminDocumentAssignmentApi;
