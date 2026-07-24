import { baseApi } from '@/store/apis/base';
import type { ModuleDraftData } from '@/features/modules/types/moduleDraft.types';

export const moduleDraftApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModuleDraft: builder.query<ModuleDraftData, void>({
      query: () => ({ url: 'program-manager/courses/draft' }),
      // Drop cached draft as soon as the module flow unmounts.
      keepUnusedDataFor: 0,
    }),
    resetModuleDraft: builder.mutation<ModuleDraftData, void>({
      query: () => ({
        url: 'program-manager/courses/draft/reset',
        method: 'POST',
      }),
    }),
    uploadModuleDocument: builder.mutation<
      ModuleDraftData,
      { fileName: string; title: string; topic: string; description: string }
    >({
      query: (body) => ({
        url: 'program-manager/courses/upload',
        method: 'POST',
        body,
      }),
    }),
    seedModuleDraftFromPipeline: builder.mutation<
      ModuleDraftData,
      ModuleDraftData
    >({
      query: (draft) => ({
        url: 'program-manager/courses/draft/seed',
        method: 'POST',
        body: draft,
      }),
    }),
    saveModuleContent: builder.mutation<
      ModuleDraftData,
      Partial<ModuleDraftData>
    >({
      query: (body) => ({
        url: 'program-manager/courses/content',
        method: 'PUT',
        body,
      }),
    }),
    saveModuleQuiz: builder.mutation<
      ModuleDraftData,
      { quiz: ModuleDraftData['quiz'] }
    >({
      query: (body) => ({
        url: 'program-manager/courses/quiz',
        method: 'PUT',
        body,
      }),
    }),
    saveModuleDraft: builder.mutation<{ status: string }, void>({
      query: () => ({
        url: 'program-manager/courses/draft/save',
        method: 'POST',
      }),
    }),
    publishModuleDraft: builder.mutation<
      { status: string },
      { courseId: string }
    >({
      query: () => ({
        url: 'program-manager/courses/publish',
        method: 'POST',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetModuleDraftQuery,
  useResetModuleDraftMutation,
  useUploadModuleDocumentMutation,
  useSeedModuleDraftFromPipelineMutation,
  useSaveModuleContentMutation,
  useSaveModuleQuizMutation,
  useSaveModuleDraftMutation,
  usePublishModuleDraftMutation,
} = moduleDraftApi;
