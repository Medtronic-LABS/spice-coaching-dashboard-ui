import { adminBaseApi } from '@/store/apis/adminBase';
import type {
  ModuleCreationPipelineRequest,
  ModuleCreationPipelineResponse,
} from '@/features/program-manager/types/modulePipeline.types';

export const moduleCreationPipelineApi = adminBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    createModuleFromDocument: builder.mutation<
      ModuleCreationPipelineResponse,
      ModuleCreationPipelineRequest
    >({
      query: (payload) => {
        const form = new FormData();
        form.append('file', payload.file, payload.file.name);
        form.append('topic', payload.topic);
        form.append('doc_type', payload.doc_type);
        form.append('difficulty_level', payload.difficulty_level);
        if (payload.module_title) {
          form.append('module_title', payload.module_title);
        }
        if (payload.module_description) {
          form.append('module_description', payload.module_description);
        }
        form.append(
          'estimated_time_minutes',
          String(payload.estimated_time_minutes),
        );
        form.append('version', String(payload.version));
        return {
          url: '/admin/module-creation-pipeline',
          method: 'POST',
          body: form,
        };
      },
    }),
    publishModule: builder.mutation<unknown, { moduleId: string }>({
      query: ({ moduleId }) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}/publish`,
        method: 'POST',
      }),
    }),
    saveModuleAsDraft: builder.mutation<unknown, { moduleId: string }>({
      query: ({ moduleId }) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}/save-as-draft`,
        method: 'POST',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateModuleFromDocumentMutation,
  usePublishModuleMutation,
  useSaveModuleAsDraftMutation,
} = moduleCreationPipelineApi;
