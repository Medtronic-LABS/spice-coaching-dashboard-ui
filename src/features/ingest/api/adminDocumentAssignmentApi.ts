import { baseApi } from '@/store/apis/base';
import {
  buildAssignmentUsersMutationBody,
  parseAssignedUsersResponse,
  type AdminUser,
  type AssignmentUpdateResponse,
  type CreateAssignmentResponse,
} from '@/features/modules/api/adminAssignmentApi';

export interface CreateDocumentAssignmentRequest {
  source_document_id: string;
  user_ids?: number[];
  upazila_ids?: number[];
  district_ids?: number[];
  division_ids?: number[];
  /** When true, PO ids also assign their direct SK children. Default false (PO only). */
  expand_po_assignees?: boolean;
}

export interface ReplaceDocumentAssignedUsersRequest {
  sourceDocumentId: string;
  user_ids?: number[];
  upazila_ids?: number[];
  district_ids?: number[];
  division_ids?: number[];
  /** When true, PO ids also assign their direct SK children. Default false (PO only). */
  expand_po_assignees?: boolean;
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
      query: ({
        sourceDocumentId,
        user_ids,
        upazila_ids,
        district_ids,
        division_ids,
        expand_po_assignees,
      }) => ({
        url: `/admin/document-assignments/${encodeURIComponent(sourceDocumentId)}/users`,
        method: 'PUT',
        body: buildAssignmentUsersMutationBody({
          user_ids,
          upazila_ids,
          district_ids,
          division_ids,
          expand_po_assignees,
        }),
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
