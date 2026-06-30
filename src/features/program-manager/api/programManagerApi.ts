import { baseApi } from '@/store/apis/base';
import type {
  CourseDraftData,
  ProgramChwRosterResponse,
  ProgramEscalationsResponse,
  ProgramOverviewResponse,
  ProgramRankingsResponse,
  ProgramSupervisorListResponse,
  SupervisorDetailResponse,
} from '@/features/program-manager/types/programManager.types';

export const programManagerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProgramOverview: builder.query<ProgramOverviewResponse, void>({
      query: () => ({ url: 'program-manager/overview' }),
    }),
    getProgramSupervisors: builder.query<ProgramSupervisorListResponse, void>({
      query: () => ({ url: 'program-manager/supervisors' }),
    }),
    getProgramSupervisorDetail: builder.query<SupervisorDetailResponse, string>(
      {
        query: (supervisorId) => ({
          url: `program-manager/supervisors/${encodeURIComponent(supervisorId)}`,
        }),
      },
    ),
    getProgramChwRoster: builder.query<ProgramChwRosterResponse, void>({
      query: () => ({ url: 'program-manager/chw-roster' }),
    }),
    getProgramEscalations: builder.query<ProgramEscalationsResponse, void>({
      query: () => ({ url: 'program-manager/escalations' }),
    }),
    getProgramRankings: builder.query<ProgramRankingsResponse, void>({
      query: () => ({ url: 'program-manager/rankings' }),
    }),
    getCourseDraft: builder.query<CourseDraftData, void>({
      query: () => ({ url: 'program-manager/courses/draft' }),
      // Drop cached draft as soon as the course flow unmounts.
      keepUnusedDataFor: 0,
    }),
    resetCourseDraft: builder.mutation<CourseDraftData, void>({
      query: () => ({
        url: 'program-manager/courses/draft/reset',
        method: 'POST',
      }),
    }),
    uploadCourseDocument: builder.mutation<
      CourseDraftData,
      { fileName: string; title: string; topic: string; description: string }
    >({
      query: (body) => ({
        url: 'program-manager/courses/upload',
        method: 'POST',
        body,
      }),
    }),
    seedCourseDraftFromPipeline: builder.mutation<
      CourseDraftData,
      CourseDraftData
    >({
      query: (draft) => ({
        url: 'program-manager/courses/draft/seed',
        method: 'POST',
        body: draft,
      }),
    }),
    saveCourseContent: builder.mutation<
      CourseDraftData,
      Partial<CourseDraftData>
    >({
      query: (body) => ({
        url: 'program-manager/courses/content',
        method: 'PUT',
        body,
      }),
    }),
    saveCourseQuiz: builder.mutation<
      CourseDraftData,
      { quiz: CourseDraftData['quiz'] }
    >({
      query: (body) => ({
        url: 'program-manager/courses/quiz',
        method: 'PUT',
        body,
      }),
    }),
    saveCourseDraft: builder.mutation<{ status: string }, void>({
      query: () => ({
        url: 'program-manager/courses/draft/save',
        method: 'POST',
      }),
    }),
    publishCourse: builder.mutation<{ status: string }, { courseId: string }>({
      query: () => ({
        url: 'program-manager/courses/publish',
        method: 'POST',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProgramOverviewQuery,
  useGetProgramSupervisorsQuery,
  useGetProgramSupervisorDetailQuery,
  useGetProgramChwRosterQuery,
  useGetProgramEscalationsQuery,
  useGetProgramRankingsQuery,
  useGetCourseDraftQuery,
  useResetCourseDraftMutation,
  useUploadCourseDocumentMutation,
  useSeedCourseDraftFromPipelineMutation,
  useSaveCourseContentMutation,
  useSaveCourseQuizMutation,
  useSaveCourseDraftMutation,
  usePublishCourseMutation,
} = programManagerApi;
